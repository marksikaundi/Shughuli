import type { PersonId } from '@/data/people';
import { getRuntimePrefs, type DateFormat, type TimeFormat, type WeekStart } from '@/lib/runtime-prefs';

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskCategory = 'work' | 'personal';
export type Priority = 'low' | 'medium' | 'high';
export type TaskKind = 'task' | 'meeting';

export type Subtask = {
  id: string;
  title: string;
  done: boolean;
};

export type TaskComment = {
  id: string;
  body: string;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  date: string;
  start: string;
  end: string;
  priority: Priority;
  status: TaskStatus;
  category: TaskCategory;
  project: string;
  tags: string[];
  people: PersonId[];
  extraPeople: number;
  scheduled: boolean;
  starred: boolean;
  kind: TaskKind;
  subtasks: Subtask[];
  comments: TaskComment[];
  sectionId: string | null;
};

export type TaskDraft = {
  title: string;
  description: string;
  date: string;
  start: string;
  priority: Priority;
  project: string;
  tags: string[];
  people?: PersonId[];
  subtasks?: Subtask[];
  comments?: TaskComment[];
  sectionId?: string | null;
};

export function todayKey() {
  const zone = getRuntimePrefs().timeZone;
  if (!zone) return toDateKey(new Date());
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;
    if (year && month && day) return `${year}-${month}-${day}`;
  } catch {
    // An unknown zone falls back to the phone clock.
  }
  return toDateKey(new Date());
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfWeek(date: Date, weekStartsOn: WeekStart = getRuntimePrefs().weekStartsOn) {
  const copy = new Date(date);
  const weekday = copy.getDay();
  const diff = weekStartsOn === 'sunday' ? -weekday : weekday === 0 ? -6 : 1 - weekday;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function formatClock(value: string, timeFormat: TimeFormat = getRuntimePrefs().timeFormat) {
  const [hourPart, minutePart] = value.split(':');
  const hour = Number(hourPart);
  const minute = String(Number(minutePart) || 0).padStart(2, '0');
  if (timeFormat === '24') return `${String(hour).padStart(2, '0')}:${minute}`;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const twelve = hour % 12 || 12;
  return `${twelve}:${minute} ${suffix}`;
}

export function splitClock(value: string, timeFormat: TimeFormat = getRuntimePrefs().timeFormat) {
  if (timeFormat === '24') return { time: formatClock(value, '24'), suffix: '' };
  const [time, suffix] = formatClock(value, '12').split(' ');
  return { time, suffix };
}

export function formatDate(date: Date, dateFormat: DateFormat = getRuntimePrefs().dateFormat) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  if (dateFormat === 'mdy') return `${month}/${day}/${year}`;
  if (dateFormat === 'ymd') return `${year}-${month}-${day}`;
  return `${day}/${month}/${year}`;
}

export function periodOf(value: string) {
  const hour = Number(value.slice(0, 2));
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

export function addMinutes(value: string, minutes: number) {
  const [hourPart, minutePart] = value.split(':');
  const total = Number(hourPart) * 60 + Number(minutePart) + minutes;
  const hour = Math.floor(total / 60) % 24;
  const minute = total % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function taskMoment(date: string, start: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = start.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}
