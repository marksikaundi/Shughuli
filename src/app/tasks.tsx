import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Screen, useNightStatus } from '@/components/screen';
import { TaskLine } from '@/components/task-line';
import { Night } from '@/constants/night';
import { Layout } from '@/constants/palette';
import { toDateKey, useTasks, type Task } from '@/data/tasks';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

export default function TasksScreen() {
  useNightStatus();
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ project?: string }>();
  const project = typeof params.project === 'string' ? params.project : '';
  const { tasks, setTaskStatus } = useTasks();
  const visibility = usePreferencesStore((state) => state.prefs.completedVisibility);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const items = useMemo(() => {
    const today = toDateKey(new Date());
    const wanted = project.trim().toLowerCase();
    return tasks
      .filter((task) => !wanted || task.project.trim().toLowerCase() === wanted)
      .filter((task) => visibility !== 'hide' || task.status !== 'done')
      .sort((a, b) => {
        const rank = dateRank(a.date, today) - dateRank(b.date, today);
        if (rank !== 0) return rank;
        const byDate = a.date < today ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
        return byDate || a.start.localeCompare(b.start) || a.title.localeCompare(b.title);
      });
  }, [project, tasks, visibility]);

  async function toggle(task: Task) {
    if (pendingId) return;
    setPendingId(task.id);
    try {
      await setTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done');
    } catch (error) {
      Alert.alert(text.tasks, error instanceof Error ? error.message : text.couldNotSaveTask);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Screen tone="night">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 36,
          paddingHorizontal: Layout.padding,
        }}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={text.back} hitSlop={8} onPress={() => router.back()}>
            <Icon name="back" size={22} color={Night.text} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {project || text.allTasks}
          </Text>
        </View>

        {items.length === 0 ? (
          <Text style={styles.empty}>{text.noTasksYet}</Text>
        ) : (
          <View style={styles.list}>
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
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    color: Night.text,
    fontSize: 20,
    fontWeight: 700,
  },
  empty: {
    marginTop: 28,
    color: Night.muted,
    fontSize: 15,
    fontWeight: 600,
  },
  list: {
    marginTop: 12,
  },
});
