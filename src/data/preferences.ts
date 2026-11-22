import type { Priority } from '@/data/model';
import { isSelectableLanguage } from '@/i18n/languages';
import type { DateFormat, ReminderSound, RuntimePrefs, TimeFormat, WeekStart } from '@/lib/runtime-prefs';

export const ACCENTS = [
  { id: 'lime', color: '#C8F06E', ring: '#C8F06E' },
  { id: 'blue', color: '#5B8DEF', ring: '#8EB4FF' },
  { id: 'rose', color: '#E58B86', ring: '#F3A19C' },
  { id: 'violet', color: '#A78BDB', ring: '#C9B6F4' },
] as const;

export const APP_TINTS = [
  { id: 'coral', color: '#E15B52' },
  { id: 'lime', color: '#C8F06E' },
  { id: 'blue', color: '#5B8DEF' },
  { id: 'rose', color: '#E58B86' },
  { id: 'violet', color: '#A78BDB' },
  { id: 'moonstone', color: '#8AA4BE' },
  { id: 'tangerine', color: '#E39A45' },
  { id: 'lavender', color: '#B7A4E6' },
  { id: 'blueberry', color: '#6E8FE8' },
  { id: 'kale', color: '#7DAF86' },
  { id: 'raspberry', color: '#E58B9A' },
] as const;

export const COLOR_THEMES = [
  { id: 'shughuli', tint: 'coral', color: '#E15B52', ink: '#E15B52', wash: '#2A2A2A', pro: false },
  { id: 'moonstone', tint: 'moonstone', color: '#8AA4BE', ink: '#A9B8C9', wash: '#2A3038', pro: false },
  { id: 'tangerine', tint: 'tangerine', color: '#E39A45', ink: '#E8A15A', wash: '#322C28', pro: false },
  { id: 'lavender', tint: 'lavender', color: '#B7A4E6', ink: '#C4B4EE', wash: '#2E2C36', pro: true },
  { id: 'blueberry', tint: 'blueberry', color: '#6E8FE8', ink: '#8AA6F0', wash: '#2A2E38', pro: true },
  { id: 'kale', tint: 'kale', color: '#7DAF86', ink: '#9BC49A', wash: '#2A322C', pro: true },
  { id: 'raspberry', tint: 'raspberry', color: '#E58B9A', ink: '#E89AAB', wash: '#322A2E', pro: true },
] as const;

export type AccentId = (typeof ACCENTS)[number]['id'];
export type AppTintId = (typeof APP_TINTS)[number]['id'];
export type ColorThemeId = (typeof COLOR_THEMES)[number]['id'];
export const QUICK_ADD_ACTIONS = ['project', 'date', 'assignee', 'attachment', 'priority', 'reminders', 'labels', 'deadline', 'location'] as const;
export const QUICK_ADD_PRO: readonly QuickAddAction[] = ['deadline', 'location'];
export type QuickAddAction = (typeof QUICK_ADD_ACTIONS)[number];
export type ThemeChoice = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'default' | 'large';
export type CompletedVisibility = 'show' | 'dim' | 'hide';
export type TimerSound = 'chime' | 'bell' | 'none';
export type Language = 'system' | string;
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
  weeklyGoal: number;
  useKarma: boolean;
  goalCelebrations: boolean;
  daysOff: number[];
  vacationMode: boolean;
  completedVisibility: CompletedVisibility;
  taskReminders: boolean;
  snoozeMinutes: number;
  urgentAlerts: 'off' | 'time';
  habitReminders: boolean;
  dailyPlanning: boolean;
  focusNotifications: boolean;
  endOfDayReview: boolean;
  onboardingAssistant: boolean;
  notificationSound: ReminderSound;
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
  languagePicked: boolean;
  timeFormat: TimeFormat;
  dateFormat: DateFormat;
  lastBackupAt: string | null;
  appTint: AppTintId;
  colorTheme: ColorThemeId;
  syncTheme: boolean;
  showTabLabels: boolean;
  showInboxTab: boolean;
  showTodayTab: boolean;
  showUpcomingTab: boolean;
  quickAddPriority: boolean;
  quickAddProject: boolean;
  quickAddDate: boolean;
  quickAddLabels: boolean;
  quickAddDescription: boolean;
  quickAddIncluded: QuickAddAction[];
  quickAddSeen: boolean;
  homeView: 'inbox' | 'today' | 'upcoming';
  syncHomeView: boolean;
  detectDates: boolean;
  resetSubtasks: boolean;
  autoAcceptInvites: boolean;
  timeZone: string;
  nextWeekday: number;
  weekendDay: number;
  webLinks: 'app' | 'browser';
  completeTone: 'none' | 'chime' | 'bell';
  rightSwipe: 'select' | 'schedule' | 'complete' | 'none';
  leftSwipe: 'select' | 'schedule' | 'complete' | 'none';
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
  weeklyGoal: 30,
  useKarma: true,
  goalCelebrations: true,
  daysOff: [0, 6],
  vacationMode: false,
  completedVisibility: 'hide',
  taskReminders: true,
  snoozeMinutes: 15,
  urgentAlerts: 'off',
  habitReminders: false,
  dailyPlanning: false,
  focusNotifications: true,
  endOfDayReview: false,
  onboardingAssistant: false,
  notificationSound: 'system',
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
  language: 'system',
  languagePicked: false,
  timeFormat: '12',
  dateFormat: 'dmy',
  lastBackupAt: null,
  appTint: 'coral',
  colorTheme: 'shughuli',
  syncTheme: true,
  showTabLabels: true,
  showInboxTab: true,
  showTodayTab: true,
  showUpcomingTab: true,
  quickAddPriority: false,
  quickAddProject: true,
  quickAddDate: true,
  quickAddLabels: true,
  quickAddDescription: false,
  quickAddIncluded: ['project', 'date', 'assignee'],
  quickAddSeen: false,
  homeView: 'today',
  syncHomeView: true,
  detectDates: true,
  resetSubtasks: true,
  autoAcceptInvites: true,
  timeZone: '',
  nextWeekday: 1,
  weekendDay: 6,
  webLinks: 'app',
  completeTone: 'chime',
  rightSwipe: 'select',
  leftSwipe: 'schedule',
};

export function accentById(id: AccentId) {
  return ACCENTS.find((item) => item.id === id) ?? ACCENTS[0];
}

export function appTintById(id: AppTintId) {
  return APP_TINTS.find((item) => item.id === id) ?? APP_TINTS[0];
}

export function colorThemeById(id: ColorThemeId) {
  return COLOR_THEMES.find((item) => item.id === id) ?? COLOR_THEMES[0];
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
    snoozeMinutes: prefs.snoozeMinutes,
    urgentAlerts: prefs.urgentAlerts,
    timeZone: prefs.timeZone,
    nextWeekday: prefs.nextWeekday,
    weekendDay: prefs.weekendDay,
    resetSubtasks: prefs.resetSubtasks,
    completeTone: prefs.completeTone,
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
    weeklyGoal: clamp(input.weeklyGoal, 1, 100, defaultPreferences.weeklyGoal),
    useKarma: bool(input.useKarma, defaultPreferences.useKarma),
    goalCelebrations: bool(input.goalCelebrations, defaultPreferences.goalCelebrations),
    daysOff: dayList(input.daysOff),
    vacationMode: bool(input.vacationMode, defaultPreferences.vacationMode),
    completedVisibility: oneOf(
      input.completedVisibility,
      ['show', 'dim', 'hide'] as const,
      defaultPreferences.completedVisibility,
    ),
    taskReminders: bool(input.taskReminders, defaultPreferences.taskReminders),
    snoozeMinutes: oneOfMinutes(input.snoozeMinutes),
    urgentAlerts: input.urgentAlerts === 'time' ? 'time' : 'off',
    habitReminders: bool(input.habitReminders, defaultPreferences.habitReminders),
    dailyPlanning: bool(input.dailyPlanning, defaultPreferences.dailyPlanning),
    focusNotifications: bool(input.focusNotifications, defaultPreferences.focusNotifications),
    endOfDayReview: bool(input.endOfDayReview, defaultPreferences.endOfDayReview),
    onboardingAssistant: bool(input.onboardingAssistant, defaultPreferences.onboardingAssistant),
    notificationSound: soundChoice(input.notificationSound),
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
    language: languageChoice(input),
    languagePicked: input.languagePicked === true || input.language === 'sw',
    timeFormat: oneOf(input.timeFormat, ['12', '24'] as const, defaultPreferences.timeFormat),
    dateFormat: oneOf(input.dateFormat, ['dmy', 'mdy', 'ymd'] as const, defaultPreferences.dateFormat),
    lastBackupAt: typeof input.lastBackupAt === 'string' ? input.lastBackupAt : null,
    appTint: oneOf(input.appTint, APP_TINTS.map((item) => item.id), defaultPreferences.appTint),
    colorTheme: oneOf(input.colorTheme, COLOR_THEMES.map((item) => item.id), defaultPreferences.colorTheme),
    syncTheme: bool(input.syncTheme, defaultPreferences.syncTheme),
    showTabLabels: bool(input.showTabLabels, defaultPreferences.showTabLabels),
    showInboxTab: bool(input.showInboxTab, defaultPreferences.showInboxTab),
    showTodayTab: bool(input.showTodayTab, defaultPreferences.showTodayTab),
    showUpcomingTab: bool(input.showUpcomingTab, defaultPreferences.showUpcomingTab),
    ...quickAddFields(input),
    homeView: oneOf(input.homeView, ['inbox', 'today', 'upcoming'] as const, defaultPreferences.homeView),
    syncHomeView: bool(input.syncHomeView, defaultPreferences.syncHomeView),
    detectDates: bool(input.detectDates, defaultPreferences.detectDates),
    resetSubtasks: bool(input.resetSubtasks, defaultPreferences.resetSubtasks),
    autoAcceptInvites: bool(input.autoAcceptInvites, defaultPreferences.autoAcceptInvites),
    timeZone: typeof input.timeZone === 'string' ? input.timeZone : defaultPreferences.timeZone,
    nextWeekday: weekdayNumber(input.nextWeekday, defaultPreferences.nextWeekday),
    weekendDay: input.weekendDay === 0 || input.weekendDay === 5 || input.weekendDay === 6 ? input.weekendDay : defaultPreferences.weekendDay,
    webLinks: input.webLinks === 'browser' ? 'browser' : 'app',
    completeTone: oneOf(input.completeTone, ['none', 'chime', 'bell'] as const, defaultPreferences.completeTone),
    rightSwipe: oneOf(input.rightSwipe, ['select', 'schedule', 'complete', 'none'] as const, defaultPreferences.rightSwipe),
    leftSwipe: oneOf(input.leftSwipe, ['select', 'schedule', 'complete', 'none'] as const, defaultPreferences.leftSwipe),
  };
}

function quickAddFields(input: Partial<Preferences>) {
  const known = new Set<string>(QUICK_ADD_ACTIONS);
  const saved = Array.isArray(input.quickAddIncluded) ? input.quickAddIncluded.filter((item): item is QuickAddAction => typeof item === 'string' && known.has(item)) : null;
  const customized = input.quickAddPriority === false || input.quickAddDate === false || input.quickAddProject === false;
  const seen = input.quickAddSeen === true;
  const base = saved
    ? uniqueActions(saved)
    : customized
      ? uniqueActions([
          'project',
          ...(input.quickAddDate === false ? [] : (['date'] as const)),
          ...(input.quickAddPriority === false ? [] : (['priority'] as const)),
        ])
      : uniqueActions(['project', 'date', 'assignee']);
  const legacy = base.join(',') === 'project,date' || base.join(',') === 'project,date,priority';
  const included = !seen && legacy ? uniqueActions(['project', 'date', 'assignee']) : base;
  if (!included.includes('project')) included.unshift('project');
  if (included[0] !== 'project') {
    included.splice(included.indexOf('project'), 1);
    included.unshift('project');
  }
  return {
    quickAddIncluded: included,
    quickAddProject: true,
    quickAddDate: included.includes('date'),
    quickAddPriority: included.includes('priority'),
    quickAddLabels: bool(input.quickAddLabels, defaultPreferences.quickAddLabels),
    quickAddDescription: bool(input.quickAddDescription, defaultPreferences.quickAddDescription),
    quickAddSeen: seen || (!legacy),
  };
}

function uniqueActions(items: QuickAddAction[]) {
  const next: QuickAddAction[] = [];
  for (const item of items) if (!next.includes(item)) next.push(item);
  return next;
}

function languageChoice(input: Partial<Preferences>): Language {
  const code = typeof input.language === 'string' ? input.language : '';
  const picked = input.languagePicked === true || code === 'sw';
  if (!picked) return 'system';
  if (code === 'system' || code === 'en' || isSelectableLanguage(code)) return code;
  return 'system';
}

function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function oneOfMinutes(value: unknown) {
  return value === 5 || value === 15 || value === 30 || value === 60 ? value : 15;
}

function weekdayNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 6 ? value : fallback;
}

function bool(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function dayList(value: unknown) {
  if (!Array.isArray(value)) return [0, 6];
  const days = value.filter((item): item is number => typeof item === 'number' && Number.isInteger(item) && item >= 0 && item <= 6);
  return [...new Set(days)];
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

function soundChoice(value: unknown): ReminderSound {
  if (value === false || value === 'none') return 'none';
  if (value === 'chime' || value === 'bell' || value === 'system') return value;
  return 'system';
}

function timeout(value: unknown): LockTimeout {
  return value === 0 || value === 1 || value === 5 || value === 15 ? value : defaultPreferences.lockTimeout;
}

function text(value: unknown, max: number) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}
