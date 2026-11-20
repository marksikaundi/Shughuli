import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Layout, Palette } from '@/constants/palette';
import { accentById } from '@/data/preferences';
import { formatClock, toDateKey, useTasks, type Task } from '@/data/tasks';
import { formatLocale, formatScheduleDay } from '@/i18n/format';
import { fill, useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

export default function TodoScreen() {
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const { tasks, setTaskStatus } = useTasks();
  const timeFormat = usePreferencesStore((state) => state.prefs.timeFormat);
  const accent = accentById(usePreferencesStore((state) => state.prefs.accent));
  const markColor = inkOn(accent.color);
  const tint = `${accent.color}24`;
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const today = toDateKey(new Date());
  const tomorrow = shiftDate(today, 1);
  const yesterday = shiftDate(today, -1);
  const heroDate = formatLocale(dateFromKey(today), { day: 'numeric', month: 'long', year: 'numeric' });

  const sections = useMemo(() => {
    const todos = tasks.filter((task) => task.kind === 'task');
    return groupByDay(todos, {
      today,
      tomorrow,
      yesterday,
      todayLabel: text.today,
      tomorrowLabel: text.tomorrow,
      yesterdayLabel: text.yesterday,
    });
  }, [tasks, today, tomorrow, yesterday, text.today, text.tomorrow, text.yesterday]);

  const featuredId = sections.find((section) => section.key === today)?.items.find((task) => task.status !== 'done')?.id;

  async function toggle(task: Task) {
    if (pendingId) return;
    setPendingId(task.id);
    try {
      await setTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done');
    } catch (error) {
      Alert.alert(text.todo, error instanceof Error ? error.message : text.couldNotSaveTask);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 18,
          paddingBottom: insets.bottom + Layout.tabClearance,
          paddingHorizontal: Layout.padding,
        }}>
        <Text style={styles.kicker}>{text.today},</Text>
        <Text style={styles.date}>{heroDate}</Text>

        {sections.length === 0 ? (
          <EmptyState icon="check" title={text.noTasksYet} body={text.noTasksBody} style={styles.empty} />
        ) : (
          sections.map((section) => {
            const collapsed = closed[section.key] === true;
            return (
              <View key={section.key} style={styles.section}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: !collapsed }}
                  onPress={() => setClosed((current) => ({ ...current, [section.key]: !collapsed }))}
                  style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{section.label}</Text>
                  <View style={[styles.count, { backgroundColor: tint }]}>
                    <Text style={styles.countText}>{section.items.length}</Text>
                  </View>
                  <View style={styles.spacer} />
                  <View style={{ transform: [{ rotate: collapsed ? '0deg' : '180deg' }] }}>
                    <Icon name="chevronDown" size={18} color={Palette.faint} />
                  </View>
                </Pressable>

                {collapsed
                  ? null
                  : section.items.map((task) => {
                      const done = task.status === 'done';
                      const featured = task.id === featuredId;
                      const when = `${section.label}  ${formatClock(task.start, timeFormat)}`;
                      return (
                        <View key={task.id} style={[styles.item, featured && { backgroundColor: tint }]}>
                          <Pressable
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: done, disabled: pendingId === task.id }}
                            accessibilityLabel={task.title}
                            disabled={pendingId === task.id}
                            hitSlop={8}
                            onPress={() => void toggle(task)}
                            style={[
                              styles.box,
                              done && { backgroundColor: accent.color, borderColor: accent.color },
                            ]}>
                            {done ? <Icon name="check" size={13} color={markColor} /> : null}
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={fill(text.editNamed, { name: task.title })}
                            onPress={() => router.push({ pathname: '/add-task', params: { id: task.id } })}
                            style={styles.copy}>
                            <Text style={[styles.title, done && styles.titleDone]} numberOfLines={2}>
                              {task.title}
                            </Text>
                            <View style={[styles.pill, { backgroundColor: featured ? 'rgba(255,255,255,0.72)' : tint }]}>
                              <Text style={styles.pillText}>{when}</Text>
                            </View>
                          </Pressable>
                        </View>
                      );
                    })}
              </View>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

function groupByDay(
  tasks: Task[],
  labels: {
    today: string;
    tomorrow: string;
    yesterday: string;
    todayLabel: string;
    tomorrowLabel: string;
    yesterdayLabel: string;
  },
) {
  const byDate = new Map<string, Task[]>();
  for (const task of tasks) {
    const items = byDate.get(task.date) ?? [];
    items.push(task);
    byDate.set(task.date, items);
  }

  const rank = (date: string) => (date === labels.today ? 0 : date > labels.today ? 1 : 2);
  return [...byDate.keys()]
    .sort((a, b) => {
      const difference = rank(a) - rank(b);
      if (difference !== 0) return difference;
      return rank(a) === 2 ? b.localeCompare(a) : a.localeCompare(b);
    })
    .map((date) => ({
      key: date,
      label:
        date === labels.today
          ? labels.todayLabel
          : date === labels.tomorrow
            ? labels.tomorrowLabel
            : date === labels.yesterday
              ? labels.yesterdayLabel
              : formatScheduleDay(dateFromKey(date)),
      items: (byDate.get(date) ?? []).sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title)),
    }));
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function shiftDate(key: string, days: number) {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function inkOn(hex: string) {
  const value = hex.replace('#', '');
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.72 ? Palette.ink : Palette.white;
}

const styles = StyleSheet.create({
  kicker: {
    color: Palette.muted,
    fontSize: 16,
    fontWeight: 600,
  },
  date: {
    marginTop: 4,
    color: Palette.ink,
    fontSize: 34,
    fontWeight: 700,
    letterSpacing: -0.8,
  },
  empty: {
    marginTop: 28,
  },
  section: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    color: Palette.ink,
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: -0.3,
  },
  count: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: Palette.ink,
    fontSize: 12,
    fontWeight: 700,
  },
  spacer: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 22,
  },
  box: {
    width: 22,
    height: 22,
    marginTop: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#C9C4D0',
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 8,
  },
  title: {
    color: Palette.ink,
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: -0.2,
  },
  titleDone: {
    color: Palette.muted,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pillText: {
    color: Palette.ink,
    fontSize: 12,
    fontWeight: 700,
  },
});
