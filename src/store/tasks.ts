import { eq, inArray } from 'drizzle-orm';
import * as Notifications from 'expo-notifications';
import { create } from 'zustand';

import { getDb } from '@/db/client';
import { migrateDb } from '@/db/migrate';
import { taskTable } from '@/db/schema';
import { addMinutes, type Priority, type Subtask, type Task, type TaskCategory, type TaskComment, type TaskDraft, type TaskKind, type TaskStatus } from '@/data/model';
import { getCopy } from '@/i18n/translate';
import { deleteAllNotes, deleteTaskNote, saveTaskNote } from '@/lib/notes';
import { clearSyncedEvents, removeTaskFromCalendar, syncAllTasks, syncTaskToCalendar } from '@/lib/google-calendar';
import { prepareReminders, scheduleTaskReminder } from '@/lib/reminders';
import { playCompleteTone } from '@/lib/complete-tone';
import { getRuntimePrefs } from '@/lib/runtime-prefs';

const SAMPLE_TASK_IDS = [
  'meeting',
  'landing',
  'checklist',
  'slides',
  'references',
  'dribbble',
  'motion',
  'illustrations',
  'header',
  'a11y',
];

type TaskState = {
  tasks: Task[];
  ready: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  addTask: (draft: TaskDraft) => Promise<void>;
  updateTask: (id: string, draft: TaskDraft) => Promise<void>;
  setTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  clearTasks: () => Promise<void>;
  replaceTasks: (tasks: Task[]) => Promise<void>;
  importTasks: (tasks: Task[]) => Promise<void>;
  syncReminders: () => Promise<void>;
};

let hydrating: Promise<void> | null = null;

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  ready: false,
  error: null,
  hydrate: () => {
    if (get().ready && !get().error) return Promise.resolve();
    hydrating ??= loadTasks(set).finally(() => {
      if (get().error) hydrating = null;
    });
    return hydrating;
  },
  addTask: async (draft) => {
    const task = draftToTask(draft);
    await rememberTask(task);
    set({ tasks: [task, ...get().tasks.filter((item) => item.id !== task.id)] });
  },
  updateTask: async (id, draft) => {
    const current = get().tasks.find((item) => item.id === id);
    if (!current) throw new Error(getCopy().taskGoneError);
    const task: Task = {
      ...current,
      title: draft.title,
      description: draft.description,
      date: draft.date,
      start: draft.start,
      end: draft.start === current.start ? current.end : addMinutes(draft.start, getRuntimePrefs().defaultDuration),
      priority: draft.priority,
      project: draft.project,
      tags: draft.tags,
      subtasks: draft.subtasks ?? current.subtasks,
      comments: draft.comments ?? current.comments,
      sectionId: draft.sectionId === undefined ? current.sectionId : draft.sectionId,
    };
    await persistTask(task, 'update');
    set({ tasks: get().tasks.map((item) => (item.id === id ? task : item)) });
  },
  setTaskStatus: async (id, status) => {
    const current = get().tasks.find((item) => item.id === id);
    if (!current) throw new Error(getCopy().taskGoneError);
    if (current.status === status) return;
    const prefs = getRuntimePrefs();
    const subtasks = status === 'done' && prefs.resetSubtasks ? current.subtasks.map((item) => ({ ...item, done: false })) : current.subtasks;
    const task = { ...current, status, subtasks };
    if (status === 'done') void playCompleteTone(prefs.completeTone);
    await persistTask(task, 'update');
    set({ tasks: get().tasks.map((item) => (item.id === id ? task : item)) });
  },
  deleteTask: async (id) => {
    await forgetTask(id);
    set({ tasks: get().tasks.filter((item) => item.id !== id) });
  },
  clearTasks: async () => {
    await wipeTasks();
    set({ tasks: [] });
  },
  replaceTasks: async (tasks) => {
    await wipeTasks();
    const db = await getDb();
    for (const task of tasks) {
      db.insert(taskTable)
        .values({
          ...taskValues(task),
          notificationId: await scheduleTaskReminder(task),
          noteUri: writeNote(task),
        })
        .run();
    }
    set({ tasks });
    await syncAllTasks(tasks).catch(() => undefined);
  },
  importTasks: async (incoming) => {
    if (incoming.length === 0) return;
    for (const task of incoming) await persistTask(task, 'insert', false);
    set({ tasks: await readTasks() });
  },
  syncReminders: async () => {
    const db = await getDb();
    const rows = db.select().from(taskTable).all();
    for (const row of rows) {
      await cancelReminder(row.notificationId);
      const notificationId = await scheduleTaskReminder(toTask(row));
      if (notificationId !== row.notificationId) {
        db.update(taskTable).set({ notificationId }).where(eq(taskTable.id, row.id)).run();
      }
    }
  },
}));

export function useTasks() {
  const tasks = useTaskStore((state) => state.tasks);
  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const setTaskStatus = useTaskStore((state) => state.setTaskStatus);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  return { tasks, addTask, updateTask, setTaskStatus, deleteTask };
}

async function loadTasks(set: (partial: Partial<TaskState>) => void) {
  try {
    await migrateDb();
    await prepareReminders();
    await removeSampleTasks();
    set({ tasks: await readTasks(), ready: true, error: null });
  } catch (error) {
    set({
      ready: true,
      error: error instanceof Error ? error.message : getCopy().couldNotOpenDatabase,
    });
  }
}

async function removeSampleTasks() {
  const db = await getDb();
  const rows = db
    .select()
    .from(taskTable)
    .all()
    .filter((row) => SAMPLE_TASK_IDS.includes(row.id));
  if (rows.length === 0) return;

  for (const row of rows) {
    await cancelReminder(row.notificationId);
    deleteTaskNote(row.id);
  }

  db.delete(taskTable)
    .where(
      inArray(
        taskTable.id,
        rows.map((row) => row.id),
      ),
    )
    .run();
}

async function rememberTask(task: Task) {
  await persistTask(task, 'insert');
}

async function persistTask(task: Task, mode: 'insert' | 'update', syncCalendar = true) {
  const db = await getDb();
  if (mode === 'update') {
    const existing = db.select().from(taskTable).where(eq(taskTable.id, task.id)).get();
    await cancelReminder(existing?.notificationId ?? null);
  }

  const values = {
    ...taskValues(task),
    notificationId: await scheduleTaskReminder(task),
    noteUri: writeNote(task),
  };

  if (mode === 'insert') {
    db.insert(taskTable).values(values).run();
  } else {
    db.update(taskTable).set(values).where(eq(taskTable.id, task.id)).run();
  }
  if (syncCalendar) await syncTaskToCalendar(task).catch(() => undefined);
}

async function wipeTasks() {
  const db = await getDb();
  const rows = db.select().from(taskTable).all();
  for (const row of rows) await cancelReminder(row.notificationId);
  db.delete(taskTable).run();
  deleteAllNotes();
  await clearSyncedEvents().catch(() => undefined);
}

async function forgetTask(id: string) {
  const db = await getDb();
  const existing = db.select().from(taskTable).where(eq(taskTable.id, id)).get();
  await cancelReminder(existing?.notificationId ?? null);
  deleteTaskNote(id);
  db.delete(taskTable).where(eq(taskTable.id, id)).run();
  await removeTaskFromCalendar(id).catch(() => undefined);
}

async function cancelReminder(notificationId: string | null) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // The reminder may already be gone.
  }
}

async function readTasks() {
  const db = await getDb();
  return db
    .select()
    .from(taskTable)
    .all()
    .map(toTask)
    .sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
}

function toTask(row: typeof taskTable.$inferSelect): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.date,
    start: row.start,
    end: row.end,
    priority: row.priority as Priority,
    status: row.status as TaskStatus,
    category: row.category as TaskCategory,
    project: row.project,
    tags: JSON.parse(row.tags) as string[],
    scheduled: row.scheduled,
    starred: row.starred,
    kind: row.kind as TaskKind,
    ...readDetails(row.details),
    sectionId: row.sectionId ?? null,
  };
}

function readDetails(raw: string | null | undefined) {
  const empty = { subtasks: [] as Subtask[], comments: [] as TaskComment[], remind: false };
  if (!raw) return empty;
  try {
    const parsed = JSON.parse(raw) as { subtasks?: unknown; comments?: unknown; remind?: unknown };
    return {
      subtasks: Array.isArray(parsed.subtasks) ? parsed.subtasks.flatMap(readSubtask) : [],
      comments: Array.isArray(parsed.comments) ? parsed.comments.flatMap(readComment) : [],
      remind: parsed.remind === true,
    };
  } catch {
    return empty;
  }
}

function readSubtask(value: unknown): Subtask[] {
  if (!value || typeof value !== 'object') return [];
  const item = value as Partial<Subtask>;
  if (typeof item.id !== 'string' || typeof item.title !== 'string') return [];
  return [{ id: item.id, title: item.title, done: item.done === true }];
}

function readComment(value: unknown): TaskComment[] {
  if (!value || typeof value !== 'object') return [];
  const item = value as Partial<TaskComment>;
  if (typeof item.id !== 'string' || typeof item.body !== 'string') return [];
  return [{ id: item.id, body: item.body, createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString() }];
}

function taskValues(task: Task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    date: task.date,
    start: task.start,
    end: task.end,
    priority: task.priority,
    status: task.status,
    category: task.category,
    project: task.project,
    tags: JSON.stringify(task.tags),
    // Kept only because the columns exist; the app no longer assigns tasks to people.
    people: '[]',
    extraPeople: 0,
    scheduled: task.scheduled,
    starred: task.starred,
    kind: task.kind,
    details: JSON.stringify({ subtasks: task.subtasks ?? [], comments: task.comments ?? [], remind: task.remind === true }),
    sectionId: task.sectionId ?? null,
  };
}

function draftToTask(draft: TaskDraft): Task {
  return {
    id: `task-${Date.now()}`,
    title: draft.title,
    description: draft.description,
    date: draft.date,
    start: draft.start,
    end: addMinutes(draft.start, getRuntimePrefs().defaultDuration),
    priority: draft.priority,
    status: 'todo',
    category: 'work',
    project: draft.project,
    tags: draft.tags,
    scheduled: true,
    starred: false,
    kind: 'task',
    subtasks: draft.subtasks ?? [],
    comments: draft.comments ?? [],
    sectionId: draft.sectionId ?? null,
    remind: draft.remind === true,
  };
}

function writeNote(task: Task) {
  try {
    return saveTaskNote(task);
  } catch {
    return null;
  }
}
