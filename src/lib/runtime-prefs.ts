export type WeekStart = 'monday' | 'sunday';
export type TimeFormat = '12' | '24';
export type DateFormat = 'dmy' | 'mdy' | 'ymd';

export type RuntimePrefs = {
  weekStartsOn: WeekStart;
  timeFormat: TimeFormat;
  dateFormat: DateFormat;
  defaultDuration: number;
  taskReminders: boolean;
  notificationSound: boolean;
  notificationVibration: boolean;
  hideSensitive: boolean;
};

const runtime: RuntimePrefs = {
  weekStartsOn: 'monday',
  timeFormat: '12',
  dateFormat: 'dmy',
  defaultDuration: 60,
  taskReminders: true,
  notificationSound: true,
  notificationVibration: true,
  hideSensitive: false,
};

export function getRuntimePrefs() {
  return runtime;
}

export function setRuntimePrefs(next: RuntimePrefs) {
  Object.assign(runtime, next);
}
