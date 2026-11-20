import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { IconButton } from '@/components/icon';
import { Screen } from '@/components/screen';
import { TaskSummaryCard } from '@/components/task-summary-card';
import { Layout, Palette } from '@/constants/palette';
import { toDateKey, useTasks } from '@/data/tasks';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

export default function TasksScreen() {
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const { tasks } = useTasks();
  const visibility = usePreferencesStore((state) => state.prefs.completedVisibility);

  const items = useMemo(() => {
    const today = toDateKey(new Date());
    return tasks
      .filter((task) => visibility !== 'hide' || task.status !== 'done')
      .sort((a, b) => {
        const rank = dateRank(a.date, today) - dateRank(b.date, today);
        if (rank !== 0) return rank;
        const byDate = a.date < today ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
        return byDate || a.start.localeCompare(b.start) || a.title.localeCompare(b.title);
      });
  }, [tasks, visibility]);

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
          <IconButton icon="bell" accessibilityLabel={text.settings} onPress={() => router.push('/settings')} />
          <View pointerEvents="none" style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{text.allTasks}</Text>
          </View>
        </View>

        {items.length === 0 ? (
          <EmptyState
            title={text.noTasksYet}
            body={text.noTasksBody}
            actionLabel={text.addTask}
            onAction={() => router.push('/add-task')}
            style={styles.empty}
          />
        ) : (
          <View style={styles.list}>
            {items.map((task) => (
              <TaskSummaryCard key={task.id} task={task} />
            ))}
          </View>
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

const styles = StyleSheet.create({
  header: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Palette.ink,
    fontSize: 17,
    fontWeight: 700,
  },
  empty: {
    marginTop: 28,
  },
  list: {
    marginTop: 22,
    gap: 12,
  },
});
