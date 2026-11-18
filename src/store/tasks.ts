import { create } from 'zustand';

import { getDb } from '@/db/client';
import { migrateDb } from '@/db/migrate';
import { taskTable } from '@/db/schema';
import { seedTasks } from '@/db/seed';
import { addMinutes, type Priority, type Task, type TaskCategory, type TaskDraft, type TaskKind, type TaskStatus } from '@/data/model';
import type { PersonId } from '@/data/people';
import { saveTaskNote } from '@/lib/notes';
import { prepareReminders, scheduleTaskReminder } from '@/lib/reminders';

type TaskState = {
  tasks: Task[];
  ready: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  addTask: (draft: TaskDraft) => Promise<void>;
};

let hydrating: Promise<void> | null = null;

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  ready: false,
  error: null,
  hydrate: () => {
    if (get().ready) return Promise.resolve();
    hydrating ??= loadTasks(set);
    return hydrating;
  },
  addTask: async (draft) => {
    const task = draftToTask(draft);
    await rememberTask(task);
    set({ tasks: [task, ...get().tasks.filter((item) => item.id !== task.id)] });
  },
}));

export function useTasks() {
  const tasks = useTaskStore((state) => state.tasks);
  const addTask = useTaskStore((state) => state.addTask);
  return { tasks, addTask };
}

async function loadTasks(set: (partial: Partial<TaskState>) => void) {
  try {
    await migrateDb();
    await prepareReminders();
    const existing = getDb().select().from(taskTable).all();
    if (existing.length === 0) {
      for (const task of seedTasks()) {
        await rememberTask(task);
      }
    }
    set({ tasks: readTasks(), ready: true, error: null });
  } catch (error) {
    set({
      ready: true,
      error: error instanceof Error ? error.message : 'Could not open the on-device database.',
    });
  }
}

async function rememberTask(task: Task) {
  const noteUri = writeNote(task);
  const notificationId = await scheduleTaskReminder(task);
  getDb()
    .insert(taskTable)
    .values({
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
      people: JSON.stringify(task.people),
      extraPeople: task.extraPeople,
      scheduled: task.scheduled,
      starred: task.starred,
      kind: task.kind,
      notificationId,
      noteUri,
    })
    .run();
}

function readTasks() {
  return getDb()
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
    people: JSON.parse(row.people) as PersonId[],
    extraPeople: row.extraPeople,
    scheduled: row.scheduled,
    starred: row.starred,
    kind: row.kind as TaskKind,
  };
}

function draftToTask(draft: TaskDraft): Task {
  return {
    id: `task-${Date.now()}`,
    title: draft.title,
    description: draft.description,
    date: draft.date,
    start: draft.start,
    end: addMinutes(draft.start, 60),
    priority: draft.priority,
    status: 'todo',
    category: 'work',
    project: draft.project,
    tags: draft.tags,
    people: ['amira', 'jules'],
    extraPeople: 2,
    scheduled: true,
    starred: false,
    kind: 'task',
  };
}

function writeNote(task: Task) {
  try {
    return saveTaskNote(task);
  } catch {
    return null;
  }
}
