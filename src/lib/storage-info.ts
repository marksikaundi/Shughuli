import { Directory, File, Paths } from 'expo-file-system';
import { defaultDatabaseDirectory } from 'expo-sqlite';
import { Platform } from 'react-native';

import { countSavedNotes } from '@/lib/notes';

export type StorageBreakdown = {
  databaseBytes: number | null;
  notesBytes: number | null;
  backupBytes: number | null;
  noteCount: number | null;
  backupCount: number;
};

export function appFolder() {
  return new Directory(Paths.document, 'shughuli');
}

export function backupFolder() {
  return new Directory(appFolder(), 'backups');
}

export function cacheFolder() {
  return new Directory(Paths.cache, 'shughuli');
}

export function avatarFile() {
  return new File(appFolder(), 'avatar');
}

export function readStorageBreakdown(): StorageBreakdown {
  if (Platform.OS === 'web') {
    return {
      databaseBytes: null,
      notesBytes: null,
      backupBytes: null,
      noteCount: null,
      backupCount: webBackups().length,
    };
  }

  return {
    databaseBytes: databaseBytes(),
    notesBytes: bytesIn(new Directory(appFolder(), 'notes')),
    backupBytes: bytesIn(backupFolder()),
    noteCount: countSavedNotes(),
    backupCount: listBackupFiles().length,
  };
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 102.4) / 10)} KB`;
  return `${Math.round(bytes / (1024 * 102.4)) / 10} MB`;
}

export function listBackupFiles() {
  if (Platform.OS === 'web') return [];
  const folder = backupFolder();
  if (!folder.exists) return [];
  return folder
    .list()
    .filter((item): item is File => item instanceof File && item.name.endsWith('.json'))
    .sort((a, b) => (b.lastModified ?? 0) - (a.lastModified ?? 0));
}

function databaseBytes() {
  const names = ['shughuli.db', 'shughuli.db-wal', 'shughuli.db-shm'];
  const directories = [defaultDatabaseDirectory, new Directory(Paths.document, 'SQLite')];
  const seen = new Set<string>();
  let total = 0;

  for (const directory of directories) {
    if (typeof directory !== 'string' && !(directory instanceof Directory)) continue;
    for (const name of names) {
      try {
        const file = new File(directory, name);
        if (!file.exists || seen.has(file.uri)) continue;
        seen.add(file.uri);
        total += file.size;
      } catch {
        // Try the next database location.
      }
    }
  }

  return total;
}

function bytesIn(directory: Directory) {
  if (!directory.exists) return 0;
  let total = 0;
  try {
    for (const item of directory.list()) {
      if (item instanceof Directory) total += bytesIn(item);
      else if (item instanceof File) total += item.size;
    }
  } catch {
    return total;
  }
  return total;
}

function webBackups() {
  try {
    const raw = globalThis.localStorage?.getItem('shughuli.backups');
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
