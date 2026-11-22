import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Screen, useNightStatus } from '@/components/screen';
import { TaskLine } from '@/components/task-line';
import { Night } from '@/constants/night';
import { Layout } from '@/constants/palette';
import { startOfWeek, toDateKey, todayKey, useTasks, type Task } from '@/data/tasks';
import { formatLocale } from '@/i18n/format';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

type AgendaLayout = 'list' | 'calendar';

export default function UpcomingScreen() {
  useNightStatus();
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const { tasks, setTaskStatus } = useTasks();
  const weekStartsOn = usePreferencesStore((state) => state.prefs.weekStartsOn);
  const visibility = usePreferencesStore((state) => state.prefs.completedVisibility);
  const [selected, setSelected] = useState(() => keyToDate(todayKey()));
  const [layout, setLayout] = useState<AgendaLayout>('list');
  const [menu, setMenu] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const today = todayKey();
  const tomorrow = shiftKey(today, 1);
  const selectedKey = toDateKey(selected);

  const weekStart = useMemo(() => startOfWeek(selected, weekStartsOn), [selected, weekStartsOn]);
  const week = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const listStartKey = selectedKey > today ? selectedKey : today;
  const days = Array.from({ length: 18 }, (_, index) => addDays(keyToDate(listStartKey), index));
  const byDay = useMemo(() => {
    const grouped = new Map<string, Task[]>();
    for (const task of tasks) {
      if (visibility === 'hide' && task.status === 'done') continue;
      const list = grouped.get(task.date) ?? [];
      list.push(task);
      grouped.set(task.date, list);
    }
    for (const list of grouped.values()) {
      list.sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
    }
    return grouped;
  }, [tasks, visibility]);

  async function toggle(task: Task) {
    if (pendingId) return;
    setPendingId(task.id);
    try {
      await setTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done');
    } catch (error) {
      Alert.alert(text.upcoming, error instanceof Error ? error.message : text.couldNotSaveTask);
    } finally {
      setPendingId(null);
    }
  }

  function chooseLayout(next: AgendaLayout) {
    setLayout(next);
    setMenu(false);
  }

  function pickMonth(month: number) {
    const now = keyToDate(today);
    const next = selected.getFullYear() === now.getFullYear() && month === now.getMonth() ? now : new Date(selected.getFullYear(), month, 1);
    setSelected(next);
    setMonthOpen(false);
  }

  const monthLabel = `${formatLocale(selected, { month: 'short' })} ${selected.getFullYear()}`;

  return (
    <Screen tone="night">
      <View style={[styles.page, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + Layout.tabClearance }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{text.upcoming}</Text>
          <View style={styles.pill}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={layout === 'list' ? text.calendarLayout : text.listLayout}
              onPress={() => setLayout(layout === 'list' ? 'calendar' : 'list')}
              style={[styles.iconButton, styles.iconButtonOn]}>
              <Icon name={layout === 'list' ? 'month' : 'list'} size={18} color={Night.text} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={text.more}
              accessibilityState={{ expanded: menu }}
              onPress={() => setMenu((open) => !open)}
              style={styles.iconButton}>
              <Icon name="more" size={18} color={Night.text} />
            </Pressable>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Pressable accessibilityRole="button" accessibilityLabel={monthLabel} onPress={() => setMonthOpen(true)} style={styles.month}>
            <Text style={styles.monthText}>{monthLabel}</Text>
            <Icon name="chevron" size={16} color={Night.text} />
          </Pressable>

          {layout === 'calendar' ? (
            <MonthGrid
              selected={selected}
              week={week}
              marked={byDay}
              onSelect={setSelected}
            />
          ) : (
            <>
              <View style={styles.week}>
                {week.map((date) => {
                  const key = toDateKey(date);
                  const active = key === selectedKey;
                  return (
                    <Pressable key={key} accessibilityRole="button" onPress={() => setSelected(date)} style={styles.day}>
                      <Text style={styles.dayName}>{formatLocale(date, { weekday: 'narrow' }).slice(0, 1).toUpperCase()}</Text>
                      <View style={[styles.dayNumber, active && styles.dayNumberActive]}>
                        <Text style={[styles.dayNumberText, active && styles.dayNumberTextActive]}>{date.getDate()}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.marker} />
            </>
          )}

          {(layout === 'calendar' ? [selected] : days).map((date) => {
            const key = toDateKey(date);
            const items = byDay.get(key) ?? [];
            const label = heading(date, key, today, tomorrow, text.today, text.tomorrow);
            const quiet = items.length === 0 && key !== today;
            return (
              <View key={key} style={styles.block}>
                <View style={styles.dayHead}>
                  <Text style={[styles.dayLabel, quiet && styles.dayLabelQuiet]}>{label}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={text.addTask}
                    hitSlop={8}
                    onPress={() => router.push({ pathname: '/add-task', params: { date: key } })}
                    style={styles.add}>
                    <Icon name="plus" size={20} color={quiet ? '#9A9A9A' : Night.text} />
                  </Pressable>
                </View>
                {items.map((task) => (
                  <TaskLine
                    key={task.id}
                    agenda
                    task={task}
                    busy={pendingId === task.id}
                    onToggle={() => void toggle(task)}
                    onOpen={() => router.push({ pathname: '/add-task', params: { id: task.id } })}
                  />
                ))}
              </View>
            );
          })}
        </ScrollView>

        {menu ? <Pressable accessibilityRole="button" accessibilityLabel={text.close} onPress={() => setMenu(false)} style={styles.backdrop} /> : null}
        {menu ? (
          <View style={styles.menu}>
            <LayoutRow label={text.listLayout} selected={layout === 'list'} onPress={() => chooseLayout('list')} />
            <LayoutRow label={text.calendarLayout} selected={layout === 'calendar'} onPress={() => chooseLayout('calendar')} />
          </View>
        ) : null}
      </View>

      <MonthSheet year={selected.getFullYear()} month={selected.getMonth()} open={monthOpen} onClose={() => setMonthOpen(false)} onPick={pickMonth} />
    </Screen>
  );
}

function LayoutRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={styles.menuRow}>
      <Text style={styles.menuLabel}>{label}</Text>
      {selected ? <Icon name="check" size={16} color={Night.text} /> : null}
    </Pressable>
  );
}

function MonthGrid({
  selected,
  week,
  marked,
  onSelect,
}: {
  selected: Date;
  week: Date[];
  marked: Map<string, Task[]>;
  onSelect: (date: Date) => void;
}) {
  const year = selected.getFullYear();
  const month = selected.getMonth();
  const first = new Date(year, month, 1);
  const lead = week.findIndex((date) => date.getDay() === first.getDay());
  const blanks = lead < 0 ? 0 : lead;
  const count = new Date(year, month + 1, 0).getDate();
  const cells = [...Array.from({ length: blanks }, () => null), ...Array.from({ length: count }, (_, index) => new Date(year, month, index + 1))];

  return (
    <View style={styles.grid}>
      {week.map((date) => (
        <Text key={date.toISOString()} style={styles.gridName}>
          {formatLocale(date, { weekday: 'narrow' }).slice(0, 1).toUpperCase()}
        </Text>
      ))}
      {cells.map((date, index) => {
        const key = date ? toDateKey(date) : `blank-${index}`;
        const active = date ? key === toDateKey(selected) : false;
        const hasTasks = date ? (marked.get(toDateKey(date))?.length ?? 0) > 0 : false;
        return (
          <Pressable key={key} disabled={!date} accessibilityRole="button" onPress={() => date && onSelect(date)} style={styles.cell}>
            <View style={[styles.dayNumber, active && styles.dayNumberActive]}>
              {date ? <Text style={[styles.dayNumberText, active && styles.dayNumberTextActive]}>{date.getDate()}</Text> : null}
            </View>
            {hasTasks && !active ? <View style={styles.dot} /> : <View style={styles.dotSpacer} />}
          </Pressable>
        );
      })}
    </View>
  );
}

function MonthSheet({
  year,
  month,
  open,
  onClose,
  onPick,
}: {
  year: number;
  month: number;
  open: boolean;
  onClose: () => void;
  onPick: (month: number) => void;
}) {
  const text = useCopy();
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.sheetFill}>
        <Pressable accessibilityRole="button" accessibilityLabel={text.close} onPress={onClose} style={styles.sheetBackdrop} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{year}</Text>
          <View style={styles.months}>
            {Array.from({ length: 12 }, (_, index) => {
              const label = formatLocale(new Date(year, index, 1), { month: 'short' });
              const active = index === month;
              return (
                <Pressable key={label} accessibilityRole="button" onPress={() => onPick(index)} style={[styles.monthCell, active && styles.monthCellOn]}>
                  <Text style={[styles.monthCellText, active && styles.monthCellTextOn]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function heading(date: Date, key: string, today: string, tomorrow: string, todayLabel: string, tomorrowLabel: string) {
  const when = `${date.getDate()} ${formatLocale(date, { month: 'short' })}`;
  const weekday = formatLocale(date, { weekday: 'long' });
  if (key === today) return `${when} · ${todayLabel} · ${weekday}`;
  if (key === tomorrow) return `${when} · ${tomorrowLabel} · ${weekday}`;
  return `${when} · ${weekday}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

function shiftKey(key: string, days: number) {
  return toDateKey(addDays(keyToDate(key), days));
}

function keyToDate(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: Layout.padding,
  },
  header: {
    minHeight: 44,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    color: Night.text,
    fontSize: 17,
    fontWeight: 700,
  },
  pill: {
    position: 'absolute',
    right: 0,
    top: 4,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3A3A3A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  iconButton: {
    width: 34,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonOn: {
    backgroundColor: '#4A4A4A',
  },
  content: {
    paddingBottom: 24,
  },
  month: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  monthText: {
    color: Night.text,
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.3,
  },
  week: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    width: 36,
    alignItems: 'center',
    gap: 10,
  },
  dayName: {
    color: '#8A8A8A',
    fontSize: 13,
    fontWeight: 500,
  },
  dayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberActive: {
    backgroundColor: Night.accent,
  },
  dayNumberText: {
    color: Night.text,
    fontSize: 16,
    fontWeight: 500,
  },
  dayNumberTextActive: {
    fontWeight: 700,
  },
  marker: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    marginTop: 14,
    borderRadius: 2,
    backgroundColor: '#5A5A5A',
  },
  block: {
    paddingTop: 22,
  },
  dayHead: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  dayLabel: {
    flex: 1,
    color: Night.text,
    fontSize: 17,
    fontWeight: 700,
  },
  dayLabelQuiet: {
    color: '#A3A3A3',
  },
  add: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridName: {
    width: '14.28%',
    textAlign: 'center',
    color: '#8A8A8A',
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 8,
  },
  cell: {
    width: '14.28%',
    alignItems: 'center',
    marginBottom: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
    backgroundColor: Night.accent,
  },
  dotSpacer: {
    width: 4,
    height: 4,
    marginTop: 3,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  menu: {
    position: 'absolute',
    top: 52,
    right: Layout.padding,
    width: 180,
    borderRadius: 14,
    backgroundColor: '#2C2C2C',
    paddingVertical: 6,
  },
  menuRow: {
    minHeight: 44,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuLabel: {
    color: Night.text,
    fontSize: 16,
    fontWeight: 500,
  },
  sheetFill: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderRadius: 18,
    backgroundColor: '#2A2A2A',
    padding: 16,
  },
  sheetTitle: {
    color: Night.text,
    fontSize: 17,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 12,
  },
  months: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthCell: {
    width: '33.33%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  monthCellOn: {
    backgroundColor: Night.accent,
  },
  monthCellText: {
    color: Night.text,
    fontSize: 15,
    fontWeight: 600,
  },
  monthCellTextOn: {
    fontWeight: 700,
  },
});
