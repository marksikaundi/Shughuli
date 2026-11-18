import type { Priority } from '@/data/model';
import type { DateFormat, RuntimePrefs, TimeFormat, WeekStart } from '@/lib/runtime-prefs';

export const ACCENTS = [
  { id: 'lime', color: '#C8F06E', ring: '#C8F06E' },
  { id: 'blue', color: '#5B8DEF', ring: '#8EB4FF' },
  { id: 'rose', color: '#E58B86', ring: '#F3A19C' },
  { id: 'violet', color: '#A78BDB', ring: '#C9B6F4' },
] as const;

export type AccentId = (typeof ACCENTS)[number]['id'];
export type ThemeChoice = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'default' | 'large';
export type CompletedVisibility = 'show' | 'dim' | 'hide';
export type TimerSound = 'chime' | 'bell' | 'none';
export type Language = 'en' | 'sw';
export type LockTimeout = 0 | 1 | 5 | 15;

export type Preferences = {
  theme: ThemeChoice;
  accent: AccentId;
  fontSize: FontSize;
  reduceMotion: boolean;
  weekStartsOn: WeekStart;
  planningStart: string;
  defaultPriority: Priority;
  defaultDuration: number;
  dailyGoal: number;
  completedVisibility: CompletedVisibility;
  taskReminders: boolean;
  habitReminders: boolean;
  dailyPlanning: boolean;
  focusNotifications: boolean;
  endOfDayReview: boolean;
  notificationSound: boolean;
  notificationVibration: boolean;
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  keepAwake: boolean;
  timerSound: TimerSound;
  appLockEnabled: boolean;
  useBiometrics: boolean;
  lockTimeout: LockTimeout;
  hideSensitive: boolean;
  displayName: string;
  avatarColor: AccentId;
  avatarUri: string | null;
  language: Language;
  timeFormat: TimeFormat;
  dateFormat: DateFormat;
  lastBackupAt: string | null;
};

export const defaultPreferences: Preferences = {
  theme: 'light',
  accent: 'lime',
  fontSize: 'default',
  reduceMotion: false,
  weekStartsOn: 'monday',
  planningStart: '08:00',
  defaultPriority: 'low',
  defaultDuration: 60,
  dailyGoal: 5,
  completedVisibility: 'hide',
  taskReminders: true,
  habitReminders: false,
  dailyPlanning: false,
  focusNotifications: true,
  endOfDayReview: false,
  notificationSound: true,
  notificationVibration: true,
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  keepAwake: true,
  timerSound: 'chime',
  appLockEnabled: false,
  useBiometrics: false,
  lockTimeout: 1,
  hideSensitive: false,
  displayName: '',
  avatarColor: 'lime',
  avatarUri: null,
  language: 'en',
  timeFormat: '12',
  dateFormat: 'dmy',
  lastBackupAt: null,
};

export function accentById(id: AccentId) {
  return ACCENTS.find((item) => item.id === id) ?? ACCENTS[0];
}

export function runtimeFromPreferences(prefs: Preferences): RuntimePrefs {
  return {
    weekStartsOn: prefs.weekStartsOn,
    timeFormat: prefs.timeFormat,
    dateFormat: prefs.dateFormat,
    defaultDuration: prefs.defaultDuration,
    taskReminders: prefs.taskReminders,
    notificationSound: prefs.notificationSound,
    notificationVibration: prefs.notificationVibration,
    hideSensitive: prefs.hideSensitive,
  };
}

export function sanitizePreferences(value: unknown): Preferences {
  const input = value && typeof value === 'object' ? (value as Partial<Preferences>) : {};
  return {
    theme: oneOf(input.theme, ['light', 'dark', 'system'] as const, defaultPreferences.theme),
    accent: oneOf(input.accent, ACCENTS.map((item) => item.id), defaultPreferences.accent),
    fontSize: oneOf(input.fontSize, ['small', 'default', 'large'] as const, defaultPreferences.fontSize),
    reduceMotion: bool(input.reduceMotion, defaultPreferences.reduceMotion),
    weekStartsOn: oneOf(input.weekStartsOn, ['monday', 'sunday'] as const, defaultPreferences.weekStartsOn),
    planningStart: clock(input.planningStart, defaultPreferences.planningStart),
    defaultPriority: oneOf(input.defaultPriority, ['low', 'medium', 'high'] as const, defaultPreferences.defaultPriority),
    defaultDuration: clamp(input.defaultDuration, 15, 180, defaultPreferences.defaultDuration),
    dailyGoal: clamp(input.dailyGoal, 1, 20, defaultPreferences.dailyGoal),
    completedVisibility: oneOf(
      input.completedVisibility,
      ['show', 'dim', 'hide'] as const,
      defaultPreferences.completedVisibility,
    ),
    taskReminders: bool(input.taskReminders, defaultPreferences.taskReminders),
    habitReminders: bool(input.habitReminders, defaultPreferences.habitReminders),
    dailyPlanning: bool(input.dailyPlanning, defaultPreferences.dailyPlanning),
    focusNotifications: bool(input.focusNotifications, defaultPreferences.focusNotifications),
    endOfDayReview: bool(input.endOfDayReview, defaultPreferences.endOfDayReview),
    notificationSound: bool(input.notificationSound, defaultPreferences.notificationSound),
    notificationVibration: bool(input.notificationVibration, defaultPreferences.notificationVibration),
    workMinutes: clamp(input.workMinutes, 15, 60, defaultPreferences.workMinutes),
    shortBreakMinutes: clamp(input.shortBreakMinutes, 1, 20, defaultPreferences.shortBreakMinutes),
    longBreakMinutes: clamp(input.longBreakMinutes, 5, 45, defaultPreferences.longBreakMinutes),
    longBreakInterval: clamp(input.longBreakInterval, 2, 8, defaultPreferences.longBreakInterval),
    autoStartBreaks: bool(input.autoStartBreaks, defaultPreferences.autoStartBreaks),
    autoStartFocus: bool(input.autoStartFocus, defaultPreferences.autoStartFocus),
    keepAwake: bool(input.keepAwake, defaultPreferences.keepAwake),
    timerSound: oneOf(input.timerSound, ['chime', 'bell', 'none'] as const, defaultPreferences.timerSound),
    appLockEnabled: bool(input.appLockEnabled, defaultPreferences.appLockEnabled),
    useBiometrics: bool(input.useBiometrics, defaultPreferences.useBiometrics),
    lockTimeout: timeout(input.lockTimeout),
    hideSensitive: bool(input.hideSensitive, defaultPreferences.hideSensitive),
    displayName: text(input.displayName, 40),
    avatarColor: oneOf(input.avatarColor, ACCENTS.map((item) => item.id), defaultPreferences.avatarColor),
    avatarUri: typeof input.avatarUri === 'string' && input.avatarUri.length > 0 ? input.avatarUri : null,
    language: oneOf(input.language, ['en', 'sw'] as const, defaultPreferences.language),
    timeFormat: oneOf(input.timeFormat, ['12', '24'] as const, defaultPreferences.timeFormat),
    dateFormat: oneOf(input.dateFormat, ['dmy', 'mdy', 'ymd'] as const, defaultPreferences.dateFormat),
    lastBackupAt: typeof input.lastBackupAt === 'string' ? input.lastBackupAt : null,
  };
}

function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function bool(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const number = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.min(max, Math.max(min, number));
}

function clock(value: unknown, fallback: string) {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return fallback;
  const [hour, minute] = value.split(':').map(Number);
  if (hour > 23 || minute > 59) return fallback;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function timeout(value: unknown): LockTimeout {
  return value === 0 || value === 1 || value === 5 || value === 15 ? value : defaultPreferences.lockTimeout;
}

function text(value: unknown, max: number) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}
