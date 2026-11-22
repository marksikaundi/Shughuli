import * as Calendar from 'expo-calendar/legacy';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { taskMoment, toDateKey, type Task } from '@/data/model';
import { getCopy } from '@/i18n/translate';

const FILE_NAME = 'calendar.json';
const CALENDAR_TITLE = 'Shughuli';

type Links = {
  calendarId: string;
  account: string;
  events: Record<string, string>;
  syncedAt?: string;
};

export type GoogleScheduleItem = {
  id: string;
  title: string;
  start: string;
  end: string;
};

let writing: Promise<unknown> = Promise.resolve();

function enqueue<T>(job: () => Promise<T>) {
  const run = writing.then(job, job);
  writing = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function readCalendarLink() {
  return readLinks();
}

export async function stampCalendarSync() {
  const current = await readLinks();
  if (!current) return null;
  current.syncedAt = new Date().toISOString();
  await writeLinks(current);
  return current.syncedAt;
}

export async function calendarAccessGranted() {
  if (Platform.OS === 'web') return false;
  const permission = await Calendar.getCalendarPermissionsAsync();
  return permission.granted;
}

export async function connectGoogleCalendar(consent = false) {
  if (Platform.OS === 'web') {
    throw new Error(getCopy().googlePhoneOnly);
  }

  const existing = await Calendar.getCalendarPermissionsAsync();
  if (!existing.granted) {
    if (!consent) {
      throw new Error(getCopy().agreeCalendar);
    }
    const permission = await Calendar.requestCalendarPermissionsAsync();
    if (!permission.granted) {
      throw new Error(getCopy().allowCalendar);
    }
  }

  const calendar = await ensureShughuliCalendar();
  const account = calendar.ownerAccount || calendar.source?.name || 'Google';
  const current = (await readLinks()) ?? { calendarId: calendar.id, account, events: {} };
  current.calendarId = calendar.id;
  current.account = account;
  await writeLinks(current);
  return current;
}

export async function pullGoogleEvents(save: (tasks: Task[]) => Promise<void>) {
  const links = await readLinks();
  if (!links || Platform.OS === 'web') return;
  const permission = await Calendar.getCalendarPermissionsAsync();
  if (!permission.granted) return;

  const calendars = (await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)).filter(isGoogle);
  if (calendars.length === 0) return;

  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setFullYear(end.getFullYear() + 1);
  end.setHours(23, 59, 59, 999);
  const known = new Set(Object.values(links.events));
  const events = await Calendar.getEventsAsync(
    calendars.map((calendar) => calendar.id),
    start,
    end,
  );
  const incoming: Task[] = [];

  events.forEach((event, index) => {
    if (!event.id || known.has(event.id)) return;
    const task = eventToTask(event, incoming.length + index);
    known.add(event.id);
    links.events[task.id] = event.id;
    incoming.push(task);
  });

  if (incoming.length > 0) await save(incoming);
  await writeLinks(links);
}

export async function syncAllTasks(tasks: Task[]) {
  if (Platform.OS === 'web') return;
  const links = await readLinks();
  if (!links) return;
  const permission = await Calendar.getCalendarPermissionsAsync();
  if (!permission.granted) return;
  for (const task of tasks) {
    await syncTaskToCalendar(task);
  }
}

export function syncTaskToCalendar(task: Task) {
  return enqueue(() => upsertTask(task));
}

export function removeTaskFromCalendar(taskId: string) {
  return enqueue(() => dropTask(taskId));
}

export function clearSyncedEvents() {
  return enqueue(async () => {
    const links = await readLinks();
    if (!links) return;
    for (const eventId of Object.values(links.events)) {
      await deleteEvent(eventId);
    }
    links.events = {};
    await writeLinks(links);
  });
}

export async function googleEventsOn(date: Date): Promise<GoogleScheduleItem[]> {
  if (Platform.OS === 'web') return [];
  const links = await readLinks();
  if (!links) return [];
  const permission = await Calendar.getCalendarPermissionsAsync();
  if (!permission.granted) return [];

  const calendars = (await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)).filter(isGoogle);
  if (calendars.length === 0) return [];
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  const mirrored = new Set(Object.values(links.events));
  const events = await Calendar.getEventsAsync(
    calendars.map((calendar) => calendar.id),
    start,
    end,
  );
  return events
    .filter((event) => !mirrored.has(event.id))
    .map((event) => ({
      id: `google-${event.id}`,
      title: event.title || getCopy().untitled,
      start: clockFrom(event.startDate),
      end: clockFrom(event.endDate),
    }))
    .sort((a, b) => a.start.localeCompare(b.start));
}

async function upsertTask(task: Task) {
  const links = await readLinks();
  if (!links || Platform.OS === 'web') return;
  if (!task.scheduled || task.status === 'done') {
    await dropTask(task.id, links);
    return;
  }

  const range = eventRange(task);
  const details = {
    title: task.title,
    startDate: range.start,
    endDate: range.end,
    notes: task.description.trim() || 'Scheduled in Shughuli',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    allDay: false,
  };
  const existingId = links.events[task.id];
  if (existingId) {
    try {
      await Calendar.updateEventAsync(existingId, details);
      return;
    } catch {
      delete links.events[task.id];
    }
  }

  try {
    const createdId = await Calendar.createEventAsync(links.calendarId, details);
    links.events[task.id] = createdId;
    await writeLinks(links);
  } catch {
    // The phone calendar can reject a write without losing the task in Shughuli.
  }
}

async function dropTask(taskId: string, known?: Links) {
  const links = known ?? (await readLinks());
  if (!links) return;
  const eventId = links.events[taskId];
  if (!eventId) return;
  await deleteEvent(eventId);
  delete links.events[taskId];
  await writeLinks(links);
}

async function deleteEvent(eventId: string) {
  try {
    await Calendar.deleteEventAsync(eventId);
  } catch {
    // The event may already have been removed in Google Calendar.
  }
}

async function ensureShughuliCalendar() {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const google = calendars.filter((calendar) => isGoogle(calendar) && calendar.allowsModifications);
  if (google.length === 0) {
    throw new Error(getCopy().addGoogleAccount);
  }

  const existing = google.find((calendar) => calendar.title === CALENDAR_TITLE);
  if (existing) return existing;

  const host = google.find((calendar) => calendar.isPrimary) ?? google[0];
  try {
    const id = await Calendar.createCalendarAsync({
      title: CALENDAR_TITLE,
      color: '#5B8DEF',
      entityType: Calendar.EntityTypes.EVENT,
      source: host.source,
      sourceId: host.sourceId,
      name: 'shughuli',
      ownerAccount: host.ownerAccount ?? host.source?.name,
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });
    const created = (await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)).find((calendar) => calendar.id === id);
    return created ?? { ...host, id, title: CALENDAR_TITLE };
  } catch {
    return host;
  }
}

function isGoogle(calendar: Calendar.Calendar) {
  const type = String(calendar.source?.type ?? '').toLowerCase();
  const account = `${calendar.source?.name ?? ''} ${calendar.ownerAccount ?? ''}`.toLowerCase();
  return type.includes('google') || account.includes('@gmail.') || account.includes('@googlemail.') || account.includes('@google.');
}

function eventToTask(event: Calendar.Event, index: number): Task {
  const start = asDate(event.startDate);
  const end = asDate(event.endDate);
  const sameDay = toDateKey(start) === toDateKey(end);
  let startClock = clockFrom(start);
  let endClock = sameDay ? clockFrom(end) : '23:59';
  if (event.allDay || endClock <= startClock) {
    startClock = '09:00';
    endClock = '10:00';
  }

  return {
    id: `task-g-${Date.now()}-${index}`,
    title: event.title?.trim() || getCopy().untitled,
    description: event.notes?.trim() || '',
    date: toDateKey(start),
    start: startClock,
    end: endClock,
    priority: 'medium',
    status: 'todo',
    category: 'personal',
    project: '',
    tags: [],
    people: [],
    extraPeople: 0,
    scheduled: true,
    starred: false,
    kind: 'task',
    subtasks: [],
    comments: [],
    sectionId: null,
  };
}

function asDate(value: string | Date | undefined) {
  if (value instanceof Date) return value;
  const date = new Date(value ?? '');
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function eventRange(task: Task) {
  const start = taskMoment(task.date, task.start);
  const end = taskMoment(task.date, task.end);
  if (end.getTime() <= start.getTime()) {
    return { start, end: new Date(start.getTime() + 60 * 60 * 1000) };
  }
  return { start, end };
}

function clockFrom(value: string | Date | undefined) {
  const date = value instanceof Date ? value : new Date(value ?? '');
  if (Number.isNaN(date.getTime())) return '09:00';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function linksFile() {
  return new File(new Directory(Paths.document, 'shughuli'), FILE_NAME);
}

async function readLinks(): Promise<Links | null> {
  try {
    const raw = Platform.OS === 'web' ? globalThis.localStorage?.getItem('shughuli.calendar') : linksFile().exists ? linksFile().textSync() : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Links>;
    if (!parsed.calendarId || !parsed.account) return null;
    return {
      calendarId: parsed.calendarId,
      account: parsed.account,
      events: parsed.events ?? {},
      syncedAt: typeof parsed.syncedAt === 'string' ? parsed.syncedAt : undefined,
    };
  } catch {
    return null;
  }
}

async function writeLinks(links: Links) {
  const payload = JSON.stringify(links);
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem('shughuli.calendar', payload);
    return;
  }
  const folder = new Directory(Paths.document, 'shughuli');
  if (!folder.exists) folder.create({ intermediates: true, idempotent: true });
  const file = linksFile();
  if (!file.exists) file.create();
  file.writeSync(payload);
}
