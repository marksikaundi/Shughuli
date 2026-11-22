export type WeekStart = 'monday' | 'sunday';
export type TimeFormat = '12' | '24';
export type DateFormat = 'dmy' | 'mdy' | 'ymd';

export type ReminderSound = 'system' | 'chime' | 'bell' | 'none';

export type RuntimePrefs = {
  weekStartsOn: WeekStart;
  timeFormat: TimeFormat;
  dateFormat: DateFormat;
  defaultDuration: number;
  taskReminders: boolean;
  notificationSound: ReminderSound;
  notificationVibration: boolean;
  hideSensitive: boolean;
  snoozeMinutes: number;
  urgentAlerts: 'off' | 'time';
  timeZone: string;
  nextWeekday: number;
  weekendDay: number;
  resetSubtasks: boolean;
  completeTone: 'none' | 'chime' | 'bell';
};

const runtime: RuntimePrefs = {
  weekStartsOn: 'monday',
  timeFormat: '12',
  dateFormat: 'dmy',
  defaultDuration: 60,
  taskReminders: true,
  notificationSound: 'system',
  notificationVibration: true,
  hideSensitive: false,
  snoozeMinutes: 15,
  urgentAlerts: 'off',
  timeZone: '',
  nextWeekday: 1,
  weekendDay: 6,
  resetSubtasks: true,
  completeTone: 'chime',
};

export function getRuntimePrefs() {
  return runtime;
}

export function setRuntimePrefs(next: RuntimePrefs) {
  Object.assign(runtime, next);
}
