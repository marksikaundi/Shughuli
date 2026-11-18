import { create } from 'zustand';

import {
  defaultPreferences,
  runtimeFromPreferences,
  sanitizePreferences,
  type Preferences,
} from '@/data/preferences';
import { syncPlannedReminders } from '@/lib/planned-reminders';
import { readPreferences, writePreferences } from '@/lib/preferences-file';
import { setRuntimePrefs } from '@/lib/runtime-prefs';
import { useTaskStore } from '@/store/tasks';

type PreferencesState = {
  prefs: Preferences;
  ready: boolean;
  hydrate: () => Promise<void>;
  update: (patch: Partial<Preferences>) => Promise<void>;
  replace: (prefs: Preferences) => Promise<void>;
};

const NOTIFICATION_FIELDS: (keyof Preferences)[] = [
  'taskReminders',
  'dailyPlanning',
  'endOfDayReview',
  'notificationSound',
  'notificationVibration',
  'hideSensitive',
  'planningStart',
];

let hydrating: Promise<void> | null = null;
let writing: Promise<unknown> = Promise.resolve();

function enqueue(job: () => Promise<void>) {
  const run = writing.then(job, job);
  writing = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  prefs: defaultPreferences,
  ready: false,
  hydrate: () => {
    if (get().ready) return Promise.resolve();
    hydrating ??= loadPreferences(set).finally(() => {
      if (!get().ready) hydrating = null;
    });
    return hydrating;
  },
  update: (patch) => enqueue(() => commit(set, get, sanitizePreferences({ ...get().prefs, ...patch }))),
  replace: (prefs) => enqueue(() => commit(set, get, sanitizePreferences(prefs))),
}));

async function loadPreferences(set: (partial: Partial<PreferencesState>) => void) {
  const prefs = await readPreferences();
  setRuntimePrefs(runtimeFromPreferences(prefs));
  set({ prefs, ready: true });
  try {
    await syncPlannedReminders(prefs);
  } catch {
    // Opening the app still works if reminders cannot be scheduled.
  }
}

async function commit(
  set: (partial: Partial<PreferencesState>) => void,
  get: () => PreferencesState,
  next: Preferences,
) {
  const previous = get().prefs;
  setRuntimePrefs(runtimeFromPreferences(next));
  set({ prefs: next });
  try {
    await writePreferences(next);
    await syncIfNeeded(previous, next);
  } catch (error) {
    setRuntimePrefs(runtimeFromPreferences(previous));
    set({ prefs: previous });
    throw error;
  }
}

async function syncIfNeeded(previous: Preferences, next: Preferences) {
  const changed = NOTIFICATION_FIELDS.some((key) => previous[key] !== next[key]);
  if (!changed) return;
  await syncPlannedReminders(next);
  const tasksChanged =
    previous.taskReminders !== next.taskReminders ||
    previous.notificationSound !== next.notificationSound ||
    previous.notificationVibration !== next.notificationVibration ||
    previous.hideSensitive !== next.hideSensitive;
  if (tasksChanged) await useTaskStore.getState().syncReminders();
}
