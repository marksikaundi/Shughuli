import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { TodayMark } from '@/components/night-empty';
import { Screen, useNightStatus } from '@/components/screen';
import { TaskLine } from '@/components/task-line';
import { Night } from '@/constants/night';
import { Layout } from '@/constants/palette';
import { todayKey, useTasks, type Task } from '@/data/tasks';
import { formatLocale } from '@/i18n/format';
import { fill, useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

type TodayLayout = 'list' | 'board';

export default function TodayScreen() {
  useNightStatus();
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const { tasks, setTaskStatus } = useTasks();
  const visibility = usePreferencesStore((state) => state.prefs.completedVisibility);
  const [layout, setLayout] = useState<TodayLayout>('list');
  const [menu, setMenu] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const today = todayKey();
  const heading = todayHeading(today);

  const items = useMemo(() => {
    return tasks
      .filter((task) => task.date === today)
      .filter((task) => visibility !== 'hide' || task.status !== 'done')
      .sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
  }, [tasks, today, visibility]);

  const columns = [
    { id: 'high', title: text.highPriority, tasks: items.filter((task) => task.priority === 'high') },
    { id: 'medium', title: text.mediumPriority, tasks: items.filter((task) => task.priority === 'medium') },
    { id: 'low', title: text.lowPriority, tasks: items.filter((task) => task.priority === 'low') },
  ];
  const countLabel = items.length === 1 ? fill(text.taskCountOne, { count: items.length }) : fill(text.taskCountOther, { count: items.length });

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

  function chooseLayout(next: TodayLayout) {
    setLayout(next);
    setMenu(false);
  }

  function open(task: Task) {
    router.push({ pathname: '/add-task', params: { id: task.id } });
  }

  return (
    <Screen tone="night">
      <View style={[styles.page, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + Layout.tabClearance }]}>
        <View style={styles.tools}>
          <View style={styles.pill}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={layout === 'list' ? text.boardLayout : text.listLayout}
              onPress={() => setLayout(layout === 'list' ? 'board' : 'list')}
              style={[styles.iconButton, styles.iconButtonOn]}>
              <Icon name={layout === 'list' ? 'viewList' : 'grid'} size={18} color={Night.text} />
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

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, items.length === 0 && styles.contentEmpty]}>
          <Text style={styles.title}>{text.today}</Text>
          <Text style={styles.count}>{countLabel}</Text>
          <Text style={styles.dayLabel}>{heading}</Text>

          {items.length === 0 ? (
            <View style={styles.empty}>
              <TodayMark />
              <Text style={styles.emptyTitle}>{text.todayPrompt}</Text>
              <Text style={styles.emptyBody}>{text.todayPromptBody}</Text>
            </View>
          ) : layout === 'board' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.board}>
              {columns.map((column) => (
                <View key={column.id} style={styles.column}>
                  <Text style={styles.columnTitle}>{column.title}</Text>
                  {column.tasks.map((task) => (
                    <TaskLine key={task.id} agenda task={task} busy={pendingId === task.id} onToggle={() => void toggle(task)} onOpen={() => open(task)} />
                  ))}
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.list}>
              {items.map((task) => (
                <TaskLine key={task.id} agenda task={task} busy={pendingId === task.id} onToggle={() => void toggle(task)} onOpen={() => open(task)} />
              ))}
            </View>
          )}
        </ScrollView>

        {menu ? <Pressable accessibilityRole="button" accessibilityLabel={text.close} onPress={() => setMenu(false)} style={styles.backdrop} /> : null}
        {menu ? (
          <View style={styles.menu}>
            <LayoutRow label={text.listLayout} selected={layout === 'list'} onPress={() => chooseLayout('list')} />
            <LayoutRow label={text.boardLayout} selected={layout === 'board'} onPress={() => chooseLayout('board')} />
          </View>
        ) : null}
      </View>
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

function todayHeading(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  return `${date.getDate()} ${formatLocale(date, { month: 'short' })} · ${formatLocale(date, { weekday: 'long' })}`;
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: Layout.padding,
  },
  tools: {
    minHeight: 40,
    alignItems: 'flex-end',
  },
  pill: {
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
  contentEmpty: {
    flexGrow: 1,
  },
  title: {
    marginTop: 18,
    color: Night.text,
    fontSize: 34,
    fontWeight: 700,
    letterSpacing: -0.8,
  },
  count: {
    marginTop: 2,
    color: Night.muted,
    fontSize: 15,
    fontWeight: 500,
  },
  dayLabel: {
    marginTop: 22,
    color: Night.text,
    fontSize: 17,
    fontWeight: 700,
  },
  list: {
    marginTop: 4,
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
  board: {
    paddingTop: 16,
    gap: 12,
  },
  column: {
    width: 260,
    borderRadius: 16,
    backgroundColor: '#242424',
    padding: 12,
  },
  columnTitle: {
    marginBottom: 8,
    color: Night.text,
    fontSize: 16,
    fontWeight: 700,
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
    top: 48,
    right: 0,
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
});
