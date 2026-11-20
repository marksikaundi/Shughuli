import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { Icon, IconButton } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Layout, Palette, cardShadow } from '@/constants/palette';
import { formatClock, formatDate, toDateKey, useTasks, type Task } from '@/data/tasks';
import { fill, useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

export default function TasksScreen() {
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const { tasks } = useTasks();
  const visibility = usePreferencesStore((state) => state.prefs.completedVisibility);
  const timeFormat = usePreferencesStore((state) => state.prefs.timeFormat);

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
            <Text style={styles.headerTitle}>{text.tasks}</Text>
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
              <TaskRow key={task.id} task={task} today={toDateKey(new Date())} timeFormat={timeFormat} text={text} />
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

function TaskRow({
  task,
  today,
  timeFormat,
  text,
}: {
  task: Task;
  today: string;
  timeFormat: '12' | '24';
  text: ReturnType<typeof useCopy>;
}) {
  const kind = task.kind === 'meeting' ? text.meet : task.category === 'personal' ? text.categoryPersonal : text.work;
  const detail = [task.project.trim(), dateLabel(task.date, today, text), formatClock(task.start, timeFormat)]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={fill(text.editNamed, { name: task.title })}
      onPress={() => router.push({ pathname: '/add-task', params: { id: task.id } })}
      style={({ pressed }) => [styles.card, task.status === 'done' && styles.cardDone, pressed && styles.pressed]}>
      <View style={styles.cardCopy}>
        <View style={styles.kindRow}>
          <Icon name={task.kind === 'meeting' ? 'video' : 'check'} size={14} color={Palette.muted} />
          <Text style={styles.kind}>{kind}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {task.title}
        </Text>
        <Text style={styles.cardDetail} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <View style={styles.arrow}>
        <Icon name="arrow" size={16} color={Palette.white} />
      </View>
    </Pressable>
  );
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.white,
    borderRadius: 24,
    padding: 16,
    ...cardShadow,
  },
  cardDone: {
    opacity: 0.55,
  },
  cardCopy: {
    flex: 1,
    gap: 6,
  },
  kindRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kind: {
    color: Palette.muted,
    fontSize: 13,
    fontWeight: 600,
  },
  cardTitle: {
    color: Palette.ink,
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: -0.3,
  },
  cardDetail: {
    color: Palette.muted,
    fontSize: 13,
    fontWeight: 500,
  },
  arrow: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
});
