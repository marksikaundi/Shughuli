import type { PersonId } from '@/data/people';

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskCategory = 'work' | 'personal';
export type Priority = 'low' | 'medium' | 'high';
export type TaskKind = 'task' | 'meeting';

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
};

export type TaskDraft = {
  title: string;
  description: string;
  date: string;
  start: string;
  priority: Priority;
  project: string;
  tags: string[];
};

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfWeek(date: Date) {
  const copy = new Date(date);
  const weekday = copy.getDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function formatClock(value: string) {
  const [hourPart, minutePart] = value.split(':');
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const twelve = hour % 12 || 12;
  return `${twelve}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export function splitClock(value: string) {
  const clock = formatClock(value);
  const [time, suffix] = clock.split(' ');
  return { time, suffix };
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
