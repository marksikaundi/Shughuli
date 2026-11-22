import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { InboxMark } from '@/components/night-empty';
import { Screen, useNightStatus } from '@/components/screen';
import { TaskLine } from '@/components/task-line';
import { Layout } from '@/constants/palette';
import { Night } from '@/constants/night';
import { useTasks, type Task } from '@/data/tasks';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

export default function InboxScreen() {
  useNightStatus();
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const { tasks, setTaskStatus } = useTasks();
  const visibility = usePreferencesStore((state) => state.prefs.completedVisibility);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [sort, setSort] = useState<'date' | 'name'>('date');
  const [menu, setMenu] = useState(false);

  const items = useMemo(() => {
    return tasks
      .filter((task) => task.project.trim() === '')
      .filter((task) => visibility !== 'hide' || task.status !== 'done')
      .sort((a, b) =>
        sort === 'name'
          ? a.title.localeCompare(b.title)
          : a.date.localeCompare(b.date) || a.start.localeCompare(b.start) || a.title.localeCompare(b.title),
      );
  }, [sort, tasks, visibility]);

  async function toggle(task: Task) {
    if (pendingId) return;
    setPendingId(task.id);
    try {
      await setTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done');
    } catch (error) {
      Alert.alert(text.inbox, error instanceof Error ? error.message : text.couldNotSaveTask);
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
        <View style={styles.header}>
          <Text style={styles.title}>{text.inbox}</Text>
          <View style={styles.pill}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={text.sortByDate}
              onPress={() => {
                setSort('date');
                setMenu(false);
              }}
              style={styles.pillButton}>
              <Icon name="viewList" size={18} color={Night.text} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={text.more}
              onPress={() => setMenu((open) => !open)}
              style={styles.pillButton}>
              <Icon name="more" size={18} color={Night.text} />
            </Pressable>
          </View>
        </View>
        {menu ? (
          <View style={styles.menu}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setSort('date');
                setMenu(false);
              }}
              style={styles.menuRow}>
              <Text style={[styles.menuText, sort === 'date' && styles.menuTextOn]}>{text.sortByDate}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setSort('name');
                setMenu(false);
              }}
              style={styles.menuRow}>
              <Text style={[styles.menuText, sort === 'name' && styles.menuTextOn]}>{text.sortByName}</Text>
            </Pressable>
          </View>
        ) : null}
        {items.length === 0 ? (
          <View style={styles.empty}>
            <InboxMark />
            <Text style={styles.emptyTitle}>{text.captureTitle}</Text>
            <Text style={styles.emptyBody}>{text.captureBody}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    color: Night.text,
    fontSize: 34,
    fontWeight: 700,
    letterSpacing: -0.8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 2,
  },
  pillButton: {
    width: 38,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    alignSelf: 'flex-end',
    marginTop: 8,
    minWidth: 140,
    borderRadius: 14,
    backgroundColor: '#2C2C2C',
    overflow: 'hidden',
  },
  menuRow: {
    minHeight: 42,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  menuText: {
    color: Night.text,
    fontSize: 15,
    fontWeight: 600,
  },
  menuTextOn: {
    color: '#C4B5FD',
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
