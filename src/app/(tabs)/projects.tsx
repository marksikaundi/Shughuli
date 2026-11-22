import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TodayMark } from '@/components/night-empty';
import { Screen, useNightStatus } from '@/components/screen';
import { TaskLine } from '@/components/task-line';
import { Night } from '@/constants/night';
import { Layout } from '@/constants/palette';
import { toDateKey, useTasks, type Task } from '@/data/tasks';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

export default function TodayScreen() {
  useNightStatus();
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const { tasks, setTaskStatus } = useTasks();
  const visibility = usePreferencesStore((state) => state.prefs.completedVisibility);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const today = toDateKey(new Date());

  const items = useMemo(() => {
    return tasks
      .filter((task) => task.date === today)
      .filter((task) => visibility !== 'hide' || task.status !== 'done')
      .sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
  }, [tasks, today, visibility]);

  async function toggle(task: Task) {
    if (pendingId) return;
    setPendingId(task.id);
    try {
      await setTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done');
    } catch (error) {
      Alert.alert(text.today, error instanceof Error ? error.message : text.couldNotSaveTask);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Screen tone="night">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + Layout.tabClearance,
          },
          items.length === 0 && styles.contentEmpty,
        ]}>
        <Text style={styles.title}>{text.today}</Text>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <TodayMark />
            <Text style={styles.emptyTitle}>{text.todayPrompt}</Text>
            <Text style={styles.emptyBody}>{text.todayPromptBody}</Text>
          </View>
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

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: Layout.padding,
  },
  contentEmpty: {
    paddingBottom: 120,
  },
  title: {
    color: Night.text,
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: -0.6,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  emptyTitle: {
    marginTop: 28,
    color: Night.text,
    fontSize: 20,
    fontWeight: 700,
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: 8,
    color: Night.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  list: {
    marginTop: 18,
  },
});
