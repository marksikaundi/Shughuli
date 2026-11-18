import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { PersonId } from '@/data/people';

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskCategory = 'work' | 'personal';
export type Priority = 'low' | 'medium' | 'high';

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
  kind: 'task' | 'meeting';
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

type TasksContextValue = {
  tasks: Task[];
  addTask: (draft: TaskDraft) => void;
};

const TasksContext = createContext<TasksContextValue | null>(null);

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

export function TasksProvider({ children }: { children: ReactNode }) {
  const today = toDateKey(new Date());
  const [tasks, setTasks] = useState<Task[]>(() => seedTasks(today));

  const value = useMemo<TasksContextValue>(
    () => ({
      tasks,
      addTask: (draft) => {
        setTasks((current) => [
          {
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
          },
          ...current,
        ]);
      },
    }),
    [tasks],
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const value = useContext(TasksContext);
  if (!value) {
    throw new Error('useTasks must be used within TasksProvider');
  }
  return value;
}

function addMinutes(value: string, minutes: number) {
  const [hourPart, minutePart] = value.split(':');
  const total = Number(hourPart) * 60 + Number(minutePart) + minutes;
  const hour = Math.floor(total / 60) % 24;
  const minute = total % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function seedTasks(today: string): Task[] {
  return [
    {
      id: 'meeting',
      title: 'Meeting with Client',
      description: 'Client meeting to review project progress, align on goals, and plan upcoming tasks',
      date: today,
      start: '09:00',
      end: '10:00',
      priority: 'high',
      status: 'todo',
      category: 'work',
      project: 'Website Redesign',
      tags: ['Work'],
      people: ['amira', 'jules'],
      extraPeople: 4,
      scheduled: true,
      starred: true,
      kind: 'meeting',
    },
    {
      id: 'landing',
      title: 'Design Landing page',
      description: 'Design the new landing page for the product launch.',
      date: today,
      start: '10:30',
      end: '11:30',
      priority: 'high',
      status: 'todo',
      category: 'work',
      project: 'Website Redesign',
      tags: ['Design', 'UI/UX'],
      people: ['amira', 'jules'],
      extraPeople: 4,
      scheduled: false,
      starred: true,
      kind: 'task',
    },
    {
      id: 'checklist',
      title: 'Write launch checklist',
      description: 'List the remaining blocks before the homepage ships.',
      date: today,
      start: '12:15',
      end: '13:00',
      priority: 'medium',
      status: 'todo',
      category: 'work',
      project: 'Website Redesign',
      tags: ['Work'],
      people: ['leo'],
      extraPeople: 1,
      scheduled: false,
      starred: false,
      kind: 'task',
    },
    {
      id: 'slides',
      title: 'Prepare slide deck',
      description: 'Pull the latest screens into the Friday review deck.',
      date: today,
      start: '14:00',
      end: '15:00',
      priority: 'low',
      status: 'todo',
      category: 'work',
      project: 'Mobile App',
      tags: ['Work'],
      people: ['noah'],
      extraPeople: 0,
      scheduled: false,
      starred: false,
      kind: 'task',
    },
    {
      id: 'references',
      title: 'Collect references',
      description: 'Save layout references for the personal site refresh.',
      date: today,
      start: '16:30',
      end: '17:00',
      priority: 'medium',
      status: 'todo',
      category: 'personal',
      project: 'Brand System',
      tags: ['Design'],
      people: ['leo', 'noah'],
      extraPeople: 0,
      scheduled: false,
      starred: false,
      kind: 'task',
    },
    {
      id: 'dribbble',
      title: 'Next Month Dribbble Short Design',
      description: 'Short shot for the upcoming Dribbble series.',
      date: today,
      start: '11:00',
      end: '13:30',
      priority: 'medium',
      status: 'in_progress',
      category: 'work',
      project: 'Brand System',
      tags: ['Design'],
      people: ['amira'],
      extraPeople: 4,
      scheduled: true,
      starred: false,
      kind: 'task',
    },
    {
      id: 'motion',
      title: 'Refine motion specs',
      description: 'Note the timing for the hero and card transitions.',
      date: today,
      start: '15:10',
      end: '16:00',
      priority: 'medium',
      status: 'in_progress',
      category: 'work',
      project: 'Mobile App',
      tags: ['UI/UX'],
      people: ['jules'],
      extraPeople: 1,
      scheduled: false,
      starred: false,
      kind: 'task',
    },
    {
      id: 'illustrations',
      title: 'Review illustrations',
      description: 'Check the new spot illustrations against the type.',
      date: today,
      start: '13:40',
      end: '14:20',
      priority: 'low',
      status: 'in_review',
      category: 'personal',
      project: 'Brand System',
      tags: ['Design'],
      people: ['amira', 'leo'],
      extraPeople: 0,
      scheduled: false,
      starred: false,
      kind: 'task',
    },
    {
      id: 'header',
      title: 'QA the header',
      description: 'Walk the nav states on a small phone.',
      date: today,
      start: '17:15',
      end: '17:45',
      priority: 'high',
      status: 'in_review',
      category: 'work',
      project: 'Website Redesign',
      tags: ['UI/UX'],
      people: ['noah'],
      extraPeople: 2,
      scheduled: false,
      starred: false,
      kind: 'task',
    },
    {
      id: 'a11y',
      title: 'Accessibility notes',
      description: 'Write contrast and focus notes for the landing page.',
      date: today,
      start: '18:00',
      end: '18:40',
      priority: 'medium',
      status: 'in_review',
      category: 'work',
      project: 'Website Redesign',
      tags: ['Work'],
      people: ['jules', 'leo'],
      extraPeople: 0,
      scheduled: false,
      starred: true,
      kind: 'task',
    },
  ];
}
