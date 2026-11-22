import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';

import { Icon } from '@/components/icon';
import { Palette, cardShadow } from '@/constants/palette';
import { startOfWeek, toDateKey, todayKey } from '@/data/model';
import { formatAccessibleDate, formatMonthYear, formatWeekday } from '@/i18n/format';
import type { TimeFormat, WeekStart } from '@/lib/runtime-prefs';
import { useCopy } from '@/lib/settings-copy';

const SLOT = 44;

export function DateCalendarPopup({
  visible,
  value,
  weekStartsOn,
  onClose,
  onSelect,
}: {
  visible: boolean;
  value: string;
  weekStartsOn: WeekStart;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => undefined}>
          {visible ? (
            <CalendarBody value={value} weekStartsOn={weekStartsOn} onClose={onClose} onSelect={onSelect} />
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CalendarBody({
  value,
  weekStartsOn,
  onClose,
  onSelect,
}: {
  value: string;
  weekStartsOn: WeekStart;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  const text = useCopy();
  const selected = keyToDate(value);
  const [cursor, setCursor] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const currentDay = todayKey();
  const monthLabel = formatMonthYear(cursor);
  const weekdays = weekdayLabels(weekStartsOn);
  const days = monthDays(cursor, weekStartsOn);

  function shiftMonth(amount: number) {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  return (
    <>
      <View style={styles.calendarHeader}>
        <Pressable accessibilityRole="button" accessibilityLabel={text.previousMonth} hitSlop={8} onPress={() => shiftMonth(-1)} style={styles.nav}>
          <Icon name="back" size={18} color={Palette.ink} />
        </Pressable>
        <Text style={styles.month}>{monthLabel}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={text.nextMonth} hitSlop={8} onPress={() => shiftMonth(1)} style={styles.nav}>
          <Icon name="chevron" size={18} color={Palette.ink} />
        </Pressable>
      </View>
      <View style={styles.weekdays}>
        {weekdays.map((label, index) => (
          <Text key={`${label}-${index}`} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {days.map((day) => {
          const key = toDateKey(day);
          const inMonth = day.getMonth() === cursor.getMonth();
          const active = key === value;
          const today = key === currentDay;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={formatAccessibleDate(day)}
              accessibilityState={{ selected: active }}
              onPress={() => {
                onSelect(key);
                onClose();
              }}
              style={styles.cell}>
              <View style={[styles.day, active && styles.dayActive, today && !active && styles.dayToday]}>
                <Text style={[styles.dayText, !inMonth && styles.dayOutside, active && styles.dayTextActive]}>{day.getDate()}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

export function TimePopup({
  visible,
  value,
  timeFormat,
  onClose,
  onSelect,
}: {
  visible: boolean;
  value: string;
  timeFormat: TimeFormat;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => undefined}>
          {visible ? <TimeBody value={value} timeFormat={timeFormat} onClose={onClose} onSelect={onSelect} /> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function TimeBody({
  value,
  timeFormat,
  onClose,
  onSelect,
}: {
  value: string;
  timeFormat: TimeFormat;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  const text = useCopy();
  const parsed = splitClock(value);
  const [hour, setHour] = useState(timeFormat === '24' ? parsed.hour24 : parsed.hour12);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(parsed.period);
  const hours = timeFormat === '24' ? range(0, 23) : range(1, 12);
  const minutes = range(0, 59);

  function commit(nextHour: number, nextMinute: number, nextPeriod: 'AM' | 'PM') {
    onSelect(joinClock(nextHour, nextMinute, nextPeriod, timeFormat));
  }

  return (
    <>
      <Text style={styles.timeTitle}>{text.time}</Text>
      <View style={styles.columns}>
        <TimeColumn
          label={text.hour}
          values={hours}
          selected={hour}
          format={(item) => (timeFormat === '24' ? pad(item) : String(item))}
          onSelect={(item) => {
            setHour(item);
            commit(item, minute, period);
          }}
        />
        <TimeColumn
          label={text.minute}
          values={minutes}
          selected={minute}
          format={pad}
          onSelect={(item) => {
            setMinute(item);
            commit(hour, item, period);
          }}
        />
        {timeFormat === '12' ? (
          <View style={styles.periodColumn}>
            <Text style={styles.columnLabel}> </Text>
            {(['AM', 'PM'] as const).map((item) => {
              const active = period === item;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    setPeriod(item);
                    commit(hour, minute, item);
                  }}
                  style={[styles.period, active && styles.slotOn]}>
                  <Text style={[styles.slotText, active && styles.slotTextOn]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.done}>
        <Text style={styles.doneText}>Done</Text>
      </Pressable>
    </>
  );
}

function TimeColumn({
  label,
  values,
  selected,
  format,
  onSelect,
}: {
  label: string;
  values: number[];
  selected: number;
  format: (value: number) => string;
  onSelect: (value: number) => void;
}) {
  const ref = useRef<ScrollViewInstance>(null);
  const initialIndex = useRef(values.indexOf(selected));

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      ref.current?.scrollTo({ y: Math.max(0, initialIndex.current * SLOT - SLOT), animated: false });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      <ScrollView ref={ref} style={styles.columnScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        {values.map((item) => {
          const active = item === selected;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(item)}
              style={[styles.slot, active && styles.slotOn]}>
              <Text style={[styles.slotText, active && styles.slotTextOn]}>{format(item)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function monthDays(cursor: Date, weekStartsOn: WeekStart) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = startOfWeek(first, weekStartsOn);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function weekdayLabels(weekStartsOn: WeekStart) {
  const sunday = new Date(2024, 0, 7);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + (weekStartsOn === 'sunday' ? index : index + 1));
    return formatWeekday(date);
  });
}

function keyToDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function splitClock(value: string) {
  const [hourPart, minutePart] = value.split(':');
  const hour24 = clamp(Number(hourPart) || 0, 0, 23);
  const minute = clamp(Number(minutePart) || 0, 0, 59);
  return {
    hour24,
    hour12: hour24 % 12 || 12,
    minute,
    period: hour24 >= 12 ? ('PM' as const) : ('AM' as const),
  };
}

function joinClock(hour: number, minute: number, period: 'AM' | 'PM', timeFormat: TimeFormat) {
  const nextHour = timeFormat === '24' ? hour : (hour % 12) + (period === 'PM' ? 12 : 0);
  return `${pad(nextHour)}:${pad(minute)}`;
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(22, 22, 22, 0.45)',
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    ...cardShadow,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nav: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.wash,
  },
  month: {
    color: Palette.ink,
    fontSize: 17,
    fontWeight: 700,
  },
  weekdays: {
    marginTop: 14,
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    color: Palette.faint,
    fontSize: 12,
    fontWeight: 700,
  },
  grid: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayActive: {
    backgroundColor: Palette.ink,
  },
  dayToday: {
    backgroundColor: Palette.lime,
  },
  dayText: {
    color: Palette.ink,
    fontSize: 14,
    fontWeight: 600,
  },
  dayOutside: {
    color: Palette.faint,
  },
  dayTextActive: {
    color: Palette.white,
  },
  timeTitle: {
    textAlign: 'center',
    color: Palette.ink,
    fontSize: 17,
    fontWeight: 700,
  },
  columns: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  column: {
    flex: 1,
  },
  periodColumn: {
    width: 72,
  },
  columnLabel: {
    height: 18,
    textAlign: 'center',
    color: Palette.faint,
    fontSize: 12,
    fontWeight: 700,
  },
  columnScroll: {
    height: SLOT * 5,
    marginTop: 6,
  },
  slot: {
    height: SLOT,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotOn: {
    backgroundColor: Palette.ink,
  },
  slotText: {
    color: Palette.ink,
    fontSize: 16,
    fontWeight: 700,
  },
  slotTextOn: {
    color: Palette.white,
  },
  period: {
    height: SLOT,
    marginTop: 6,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.wash,
  },
  done: {
    marginTop: 16,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: {
    color: Palette.white,
    fontSize: 15,
    fontWeight: 700,
  },
});
