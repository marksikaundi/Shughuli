import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { IconButton } from '@/components/icon';
import { Screen } from '@/components/screen';
import { TaskCard } from '@/components/task-card';
import { Layout, Palette, cardShadow } from '@/constants/palette';
import { formatDate, toDateKey, useTasks, type Task, type TaskStatus } from '@/data/tasks';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

const FILTERS: (TaskStatus | 'all')[] = ['all', 'todo', 'in_progress', 'in_review', 'done'];

export default function TasksScreen() {
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const { tasks } = useTasks();
  const visibility = usePreferencesStore((state) => state.prefs.completedVisibility);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const filters = visibility === 'hide' ? FILTERS.filter((item) => item !== 'done') : FILTERS;
  const statusLabel: Record<TaskStatus | 'all', string> = {
    all: text.all,
    todo: text.todo,
    in_progress: text.inProgress,
    in_review: text.inReview,
    done: text.done,
  };
  const activeFilter = visibility === 'hide' && filter === 'done' ? 'all' : filter;

  const groups = useMemo(() => {
    const today = toDateKey(new Date());
    const visible = tasks.filter((task) => {
      if (visibility === 'hide' && task.status === 'done') return false;
      if (activeFilter !== 'all' && task.status !== activeFilter) return false;
      return true;
    });
    const byDate = new Map<string, Task[]>();
    for (const task of visible) {
      const bucket = byDate.get(task.date) ?? [];
      bucket.push(task);
      byDate.set(task.date, bucket);
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => {
        const rank = dateRank(a, today) - dateRank(b, today);
        if (rank !== 0) return rank;
        return a < today ? b.localeCompare(a) : a.localeCompare(b);
      })
      .map(([date, items]) => ({
        date,
        label: dateLabel(date, today, text),
        items: items.sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title)),
      }));
  }, [activeFilter, tasks, text, visibility]);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 36,
          paddingHorizontal: Layout.padding,
        }}>
        <View style={styles.header}>
          <IconButton icon="back" accessibilityLabel={text.back} onPress={() => router.back()} />
          <IconButton
            icon="plus"
            variant="dark"
            accessibilityLabel={text.addTask}
            onPress={() => router.push('/add-task')}
          />
        </View>
        <Text style={styles.title}>{text.tasks}</Text>
        <Text style={styles.lead}>{text.tasksLead}</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          style={styles.filterScroll}>
          {filters.map((item) => {
            const selected = activeFilter === item;
            return (
              <Pressable
                key={item}
                onPress={() => setFilter(item)}
                style={[styles.chip, selected && styles.chipSelected]}>
                <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{statusLabel[item]}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {groups.length === 0 ? (
          <EmptyState
            title={text.noTasksYet}
            body={text.noTasksBody}
            actionLabel={text.addTask}
            onAction={() => router.push('/add-task')}
            style={styles.empty}
          />
        ) : (
          groups.map((group) => (
            <View key={group.date} style={styles.group}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              <View style={styles.list}>
                {group.items.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function dateRank(date: string, today: string) {
  if (date === today) return 0;
  if (date > today) return 1;
  return 2;
}

function dateLabel(date: string, today: string, text: ReturnType<typeof useCopy>) {
  if (date === today) return text.today;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date === toDateKey(tomorrow)) return text.tomorrow;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date === toDateKey(yesterday)) return text.yesterday;
  const [year, month, day] = date.split('-').map(Number);
  return formatDate(new Date(year, month - 1, day));
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    marginTop: 22,
    color: Palette.ink,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: 700,
    letterSpacing: -0.8,
  },
  lead: {
    marginTop: 8,
    color: Palette.muted,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: 500,
  },
  filterScroll: {
    marginTop: 18,
    marginHorizontal: -Layout.padding,
  },
  filters: {
    paddingHorizontal: Layout.padding,
    gap: 10,
  },
  chip: {
    backgroundColor: Palette.white,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...cardShadow,
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  chipSelected: {
    backgroundColor: Palette.ink,
  },
  chipLabel: {
    color: Palette.ink,
    fontSize: 14,
    fontWeight: 600,
  },
  chipLabelSelected: {
    color: Palette.white,
  },
  empty: {
    marginTop: 22,
  },
  group: {
    marginTop: 22,
  },
  groupLabel: {
    color: Palette.ink,
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 12,
  },
  list: {
    gap: 12,
  },
});
