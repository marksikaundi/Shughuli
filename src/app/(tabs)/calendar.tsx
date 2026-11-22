import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Screen, useNightStatus } from '@/components/screen';
import { TaskLine } from '@/components/task-line';
import { Night } from '@/constants/night';
import { Layout } from '@/constants/palette';
import { startOfWeek, toDateKey, todayKey, useTasks, type Task } from '@/data/tasks';
import { formatLocale, formatMonthYear } from '@/i18n/format';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

export default function UpcomingScreen() {
  useNightStatus();
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const { tasks, setTaskStatus } = useTasks();
  const weekStartsOn = usePreferencesStore((state) => state.prefs.weekStartsOn);
  const visibility = usePreferencesStore((state) => state.prefs.completedVisibility);
  const [selected, setSelected] = useState(() => new Date());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const today = todayKey();
  const tomorrow = shiftKey(today, 1);

  const weekStart = useMemo(() => startOfWeek(selected, weekStartsOn), [selected, weekStartsOn]);
  const week = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const days = useMemo(() => Array.from({ length: 14 }, (_, index) => addDays(weekStart, index)), [weekStart]);
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

  return (
    <Screen tone="night">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + Layout.tabClearance,
          paddingHorizontal: Layout.padding,
        }}>
        <Text style={styles.title}>{text.upcoming}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={formatMonthYear(selected)}
          onPress={() => setSelected((date) => addDays(date, 7))}
          style={styles.month}>
          <Text style={styles.monthText}>{formatMonthYear(selected)}</Text>
          <Icon name="chevronDown" size={16} color={Night.text} />
        </Pressable>

        <View style={styles.week}>
          {week.map((date) => {
            const key = toDateKey(date);
            const active = key === toDateKey(selected);
            return (
              <Pressable key={key} accessibilityRole="button" onPress={() => setSelected(date)} style={styles.day}>
                <Text style={styles.dayName}>{formatLocale(date, { weekday: 'narrow' })}</Text>
                <View style={[styles.dayNumber, active && styles.dayNumberActive]}>
                  <Text style={[styles.dayNumberText, active && styles.dayNumberTextActive]}>{date.getDate()}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.rule} />

        {days.map((date) => {
          const key = toDateKey(date);
          const items = byDay.get(key) ?? [];
          const label =
            key === today ? `${heading(date)} · ${text.today}` : key === tomorrow ? `${heading(date)} · ${text.tomorrow}` : heading(date);
          return (
            <View key={key} style={styles.block}>
              <Text style={styles.dayLabel}>{label}</Text>
              {items.map((task) => (
                <TaskLine
                  key={task.id}
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
    </Screen>
  );
}

function heading(date: Date) {
  return formatLocale(date, { weekday: 'long', day: 'numeric', month: 'short' });
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

function shiftKey(key: string, days: number) {
  const [year, month, day] = key.split('-').map(Number);
  return toDateKey(addDays(new Date(year, (month || 1) - 1, day || 1), days));
}

const styles = StyleSheet.create({
  title: {
    color: Night.text,
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: -0.6,
  },
  month: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  monthText: {
    color: Night.text,
    fontSize: 18,
    fontWeight: 700,
  },
  week: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    width: 36,
    alignItems: 'center',
    gap: 8,
  },
  dayName: {
    color: Night.muted,
    fontSize: 12,
    fontWeight: 600,
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
    fontSize: 15,
    fontWeight: 600,
  },
  dayNumberTextActive: {
    color: Night.text,
    fontWeight: 700,
  },
  rule: {
    marginTop: 12,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Night.line,
  },
  block: {
    paddingTop: 18,
  },
  dayLabel: {
    color: Night.text,
    fontSize: 16,
    fontWeight: 700,
  },
});
