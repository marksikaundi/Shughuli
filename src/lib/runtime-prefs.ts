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
};

export function getRuntimePrefs() {
  return runtime;
}

export function setRuntimePrefs(next: RuntimePrefs) {
  Object.assign(runtime, next);
}
