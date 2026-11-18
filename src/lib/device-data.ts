import { File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';

import {
  defaultPreferences,
  sanitizePreferences,
  type Preferences,
} from '@/data/preferences';
import type { Priority, Task, TaskCategory, TaskKind, TaskStatus } from '@/data/model';
import { PEOPLE, type PersonId } from '@/data/people';
import { clearPin } from '@/lib/app-lock';
import { readAllNotes, writeNoteContents } from '@/lib/notes';
import { cancelPlannedReminders } from '@/lib/planned-reminders';
import {
  appFolder,
  avatarFile,
  backupFolder,
  cacheFolder,
  listBackupFiles,
} from '@/lib/storage-info';
import { usePreferencesStore } from '@/store/preferences';
import { useTaskStore } from '@/store/tasks';

const WEB_BACKUPS = 'shughuli.backups';

export type BackupRecord = {
  name: string;
  uri: string;
  modified: number | null;
  json?: string;
};

type BackupFile = {
  app: 'shughuli';
  version: 1;
  exportedAt: string;
  tasks: Task[];
  notes: { id: string; text: string }[];
  preferences: Preferences;
};

export async function exportTasksJson() {
  const json = JSON.stringify(buildBackup(), null, 2);
  await shareTextFile(json, `shughuli-${stamp()}.json`, 'application/json', 'public.json');
}

export async function exportTasksCsv() {
  const tasks = useTaskStore.getState().tasks;
  const header = ['title', 'description', 'date', 'start', 'end', 'priority', 'status', 'category', 'project', 'tags', 'kind'];
  const lines = tasks.map((task) =>
    [
      task.title,
      task.description,
      task.date,
      task.start,
      task.end,
      task.priority,
      task.status,
      task.category,
      task.project,
      task.tags.join('|'),
      task.kind,
    ]
      .map(csvCell)
      .join(','),
  );
  await shareTextFile([header.join(','), ...lines].join('\n'), `shughuli-tasks-${stamp()}.csv`, 'text/csv', 'public.comma-separated-values-text');
}

export async function createLocalBackup() {
  const json = JSON.stringify(buildBackup(), null, 2);
  const name = `shughuli-${stamp()}.json`;
  if (Platform.OS === 'web') {
    const next = [{ name, createdAt: new Date().toISOString(), json }, ...webBackupList()].slice(0, 12);
    globalThis.localStorage?.setItem(WEB_BACKUPS, JSON.stringify(next));
  } else {
    const folder = backupFolder();
    if (!folder.exists) folder.create({ intermediates: true, idempotent: true });
    const file = new File(folder, name);
    if (!file.exists) file.create();
    file.writeSync(json);
  }
  await usePreferencesStore.getState().update({ lastBackupAt: new Date().toISOString() });
}

export function listLocalBackups(): BackupRecord[] {
  if (Platform.OS === 'web') {
    return webBackupList().map((item) => ({
      name: item.name,
      uri: item.name,
      modified: Date.parse(item.createdAt),
      json: item.json,
    }));
  }
  return listBackupFiles().map((file) => ({
    name: file.name,
    uri: file.uri,
    modified: file.lastModified,
  }));
}

export async function restoreBackup(record: BackupRecord) {
  const json = record.json ?? new File(record.uri).textSync();
  await restoreJson(json);
}

export async function restorePickedFile() {
  if (Platform.OS === 'web') throw new Error('Choose a backup from the list saved in this browser.');
  const picked = await File.pickFileAsync({ mimeTypes: ['application/json', 'text/plain', 'text/*'] });
  if (picked.canceled || !picked.result) return false;
  await restoreJson(picked.result.textSync());
  return true;
}

export async function chooseAvatar() {
  if (Platform.OS === 'web') throw new Error('A profile photo can be saved on iPhone and Android.');
  const picked = await File.pickFileAsync({ mimeTypes: ['image/*'] });
  if (picked.canceled || !picked.result) return null;
  const folder = appFolder();
  if (!folder.exists) folder.create({ intermediates: true, idempotent: true });
  const destination = avatarFile();
  if (destination.exists) destination.delete();
  await picked.result.copy(destination);
  return destination.uri;
}

export async function removeAvatar() {
  if (Platform.OS !== 'web') {
    const file = avatarFile();
    if (file.exists) file.delete();
  }
  await usePreferencesStore.getState().update({ avatarUri: null });
}

export async function clearCache() {
  if (Platform.OS === 'web') return;
  const folder = cacheFolder();
  if (!folder.exists) return;
  for (const item of folder.list()) {
    try {
      item.delete();
    } catch {
      // Keep clearing the rest of the cache.
    }
  }
}

export async function clearPersonalData() {
  await useTaskStore.getState().clearTasks();
  await cancelPlannedReminders();
  await removeAvatar();
  await clearPin();
  await usePreferencesStore.getState().update({
    displayName: '',
    avatarUri: null,
    appLockEnabled: false,
    useBiometrics: false,
    hideSensitive: false,
  });
}

export async function deleteAllData() {
  await cancelPlannedReminders();
  await useTaskStore.getState().clearTasks();
  await clearPin();
  await clearCache();
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(WEB_BACKUPS);
  } else {
    const folder = backupFolder();
    if (folder.exists) {
      for (const item of folder.list()) {
        try {
          item.delete();
        } catch {
          // Continue deleting the remaining backups.
        }
      }
    }
    const avatar = avatarFile();
    if (avatar.exists) avatar.delete();
  }
  await usePreferencesStore.getState().replace(defaultPreferences);
}

async function restoreJson(raw: string) {
  const backup = parseBackup(raw);
  await useTaskStore.getState().replaceTasks(backup.tasks);
  for (const note of backup.notes) writeNoteContents(note.id, note.text);
  const current = usePreferencesStore.getState().prefs;
  await usePreferencesStore.getState().replace({
    ...backup.preferences,
    appLockEnabled: current.appLockEnabled,
    useBiometrics: current.useBiometrics,
    lockTimeout: current.lockTimeout,
  });
}

function buildBackup(): BackupFile {
  return {
    app: 'shughuli',
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks: useTaskStore.getState().tasks,
    notes: readAllNotes(),
    preferences: usePreferencesStore.getState().prefs,
  };
}

function parseBackup(raw: string): BackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('This file isn’t a Shughuli backup.');
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('This file isn’t a Shughuli backup.');
  const record = parsed as Partial<BackupFile>;
  if (record.app !== 'shughuli' || !Array.isArray(record.tasks)) {
    throw new Error('This file isn’t a Shughuli backup.');
  }
  return {
    app: 'shughuli',
    version: 1,
    exportedAt: typeof record.exportedAt === 'string' ? record.exportedAt : new Date().toISOString(),
    tasks: record.tasks.map(normalizeTask),
    notes: Array.isArray(record.notes)
      ? record.notes.flatMap((note) => {
          if (!note || typeof note !== 'object') return [];
          const item = note as { id?: unknown; text?: unknown };
          if (typeof item.id !== 'string' || typeof item.text !== 'string') return [];
          return [{ id: item.id, text: item.text }];
        })
      : [],
    preferences: sanitizePreferences(record.preferences),
  };
}

function normalizeTask(value: unknown): Task {
  const input = value && typeof value === 'object' ? (value as Partial<Task>) : {};
  const priority: Priority = input.priority === 'medium' || input.priority === 'high' ? input.priority : 'low';
  const status: TaskStatus =
    input.status === 'in_progress' || input.status === 'in_review' || input.status === 'done' ? input.status : 'todo';
  const category: TaskCategory = input.category === 'personal' ? 'personal' : 'work';
  const kind: TaskKind = input.kind === 'meeting' ? 'meeting' : 'task';
  return {
    id: typeof input.id === 'string' && input.id ? input.id : `task-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: typeof input.title === 'string' && input.title.trim() ? input.title.trim() : 'Untitled task',
    description: typeof input.description === 'string' ? input.description : '',
    date: typeof input.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? input.date : todayKey(),
    start: clock(input.start, '09:00'),
    end: clock(input.end, '10:00'),
    priority,
    status,
    category,
    project: typeof input.project === 'string' ? input.project : '',
    tags: Array.isArray(input.tags) ? input.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    people: Array.isArray(input.people)
      ? input.people.filter((person): person is PersonId => typeof person === 'string' && person in PEOPLE)
      : [],
    extraPeople: typeof input.extraPeople === 'number' ? input.extraPeople : 0,
    scheduled: input.scheduled !== false,
    starred: input.starred === true,
    kind,
  };
}

async function shareTextFile(contents: string, filename: string, mimeType: string, uti: string) {
  if (Platform.OS === 'web') {
    await Share.share({ message: contents, title: filename });
    return;
  }

  const folder = cacheFolder();
  if (!folder.exists) folder.create({ intermediates: true, idempotent: true });
  const file = new File(folder, filename);
  if (!file.exists) file.create();
  file.writeSync(contents);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType, UTI: uti, dialogTitle: filename });
    return;
  }
  await Share.share({ message: contents, title: filename });
}

function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

function clock(value: unknown, fallback: string) {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return fallback;
  return value;
}

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function stamp() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${now.getFullYear()}${month}${day}-${hour}${minute}`;
}

function webBackupList() {
  try {
    const raw = globalThis.localStorage?.getItem(WEB_BACKUPS);
    const parsed = raw ? (JSON.parse(raw) as { name?: string; createdAt?: string; json?: string }[]) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item.name !== 'string' || typeof item.json !== 'string') return [];
      return [{ name: item.name, createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(), json: item.json }];
    });
  } catch {
    return [];
  }
}
