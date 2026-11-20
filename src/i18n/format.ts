import { getLocaleTag } from '@/i18n/translate';

export function formatLocale(date: Date, options: Intl.DateTimeFormatOptions) {
  const tag = getLocaleTag();
  try {
    return new Intl.DateTimeFormat(tag, options).format(date);
  } catch {
    return new Intl.DateTimeFormat('en', options).format(date);
  }
}

export function formatWeekday(date: Date) {
  return formatLocale(date, { weekday: 'short' });
}

export function formatMonthYear(date: Date) {
  return formatLocale(date, { month: 'long', year: 'numeric' });
}

export function formatScheduleDay(date: Date) {
  return formatLocale(date, { weekday: 'short', month: 'long', day: 'numeric' });
}

export function formatAccessibleDate(date: Date) {
  return formatLocale(date, { month: 'long', day: 'numeric', year: 'numeric' });
}
