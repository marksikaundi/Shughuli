import * as Calendar from 'expo-calendar';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { taskMoment, type Task } from '@/data/model';

const FILE_NAME = 'calendar.json';
const CALENDAR_TITLE = 'Shughuli';
const TASK_PROPERTY = 'private:shughuliTaskId';

type Links = {
  calendarId: string;
  account: string;
  events: Record<string, string>;
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

export async function connectGoogleCalendar() {
  if (Platform.OS === 'web') {
    throw new Error('Google Calendar connects on the phone, using the Google account signed in there.');
  }

  const permission = await Calendar.requestCalendarPermissions();
  if (!permission.granted) {
    throw new Error('Allow calendar access so Shughuli can add tasks to Google Calendar.');
  }

  const calendar = await ensureShughuliCalendar();
  const account = calendar.ownerAccount || calendar.source?.name || 'Google';
  const current = (await readLinks()) ?? { calendarId: calendar.id, account, events: {} };
  current.calendarId = calendar.id;
  current.account = account;
  await writeLinks(current);
  return current;
}

export async function syncAllTasks(tasks: Task[]) {
  if (Platform.OS === 'web') return;
  const links = await readLinks();
  if (!links) return;
  const permission = await Calendar.getCalendarPermissions();
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
  const permission = await Calendar.getCalendarPermissions();
  if (!permission.granted) return [];

  const calendars = (await Calendar.getCalendars(Calendar.EntityTypes.EVENT)).filter(isGoogle);
  if (calendars.length === 0) return [];
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  const mirrored = new Set(Object.values(links.events));
  const events = await Calendar.listEvents(calendars, start, end);
  return events
    .filter((event) => !mirrored.has(event.id))
    .map((event) => ({
      id: `google-${event.id}`,
      title: event.title || 'Untitled',
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
      const event = await Calendar.ExpoCalendarEvent.get(existingId);
      await event.update(details);
      return;
    } catch {
      delete links.events[task.id];
    }
  }

  try {
    const calendar = await Calendar.ExpoCalendar.get(links.calendarId);
    const created = await calendar.createEvent(details);
    if (Platform.OS === 'android') {
      await created.setExtendedProperty(TASK_PROPERTY, task.id).catch(() => undefined);
    }
    links.events[task.id] = created.id;
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
    const event = await Calendar.ExpoCalendarEvent.get(eventId);
    await event.delete();
  } catch {
    // The event may already have been removed in Google Calendar.
  }
}

async function ensureShughuliCalendar() {
  const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
  const google = calendars.filter((calendar) => isGoogle(calendar) && calendar.allowsModifications);
  if (google.length === 0) {
    throw new Error('Add the Google account in this phone’s Calendar settings, then connect again.');
  }

  const existing = google.find((calendar) => calendar.title === CALENDAR_TITLE);
  if (existing) return existing;

  const host = google.find((calendar) => calendar.isPrimary) ?? google[0];
  try {
    return await Calendar.createCalendar({
      title: CALENDAR_TITLE,
      color: '#5B8DEF',
      entityType: Calendar.EntityTypes.EVENT,
      source: host.source,
      sourceId: host.sourceId,
      name: 'shughuli',
      ownerAccount: host.ownerAccount ?? host.source?.name,
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });
  } catch {
    return host;
  }
}

function isGoogle(calendar: Calendar.ExpoCalendar) {
  const type = String(calendar.source?.type ?? '').toLowerCase();
  const account = `${calendar.source?.name ?? ''} ${calendar.ownerAccount ?? ''}`.toLowerCase();
  return type.includes('google') || account.includes('@gmail.') || account.includes('@googlemail.') || account.includes('@google.');
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
    return { calendarId: parsed.calendarId, account: parsed.account, events: parsed.events ?? {} };
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
