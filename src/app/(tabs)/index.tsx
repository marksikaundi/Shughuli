import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { Icon, IconButton } from '@/components/icon';
import { ProgressRing } from '@/components/progress-ring';
import { Screen } from '@/components/screen';
import { Layout, Palette, cardShadow } from '@/constants/palette';
import { formatClock, toDateKey, useTasks, type Task, type TaskStatus } from '@/data/tasks';
import { accentById } from '@/data/preferences';
import { usePreferencesStore } from '@/store/preferences';

const FILTERS: { id: Exclude<TaskStatus, 'done'>; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'in_review', label: 'In Review' },
];

const PRIORITY_TONE = {
  high: { bg: Palette.dangerSoft, text: Palette.danger, label: 'High Priority' },
  medium: { bg: '#FFF1DE', text: '#C56A12', label: 'Medium Priority' },
  low: { bg: '#EEF8DC', text: Palette.limeDeep, label: 'Low Priority' },
} as const;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { tasks } = useTasks();
  const visibility = usePreferencesStore((state) => state.prefs.completedVisibility);
  const dailyGoal = usePreferencesStore((state) => state.prefs.dailyGoal);
  const accent = usePreferencesStore((state) => state.prefs.accent);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('todo');
  const today = toDateKey(new Date());

  const todayTasks = useMemo(
    () => tasks.filter((task) => task.date === today && task.kind === 'task'),
    [tasks, today],
  );
  const todaysTasks = useMemo(
    () => todayTasks.filter((task) => task.status !== 'done'),
    [todayTasks],
  );
  const completed = todayTasks.length - todaysTasks.length;
  const progress = dailyGoal <= 0 ? 0 : Math.min(1, completed / dailyGoal);

  const counts = useMemo(() => {
    return {
      todo: todayTasks.filter((task) => task.status === 'todo').length,
      in_progress: todayTasks.filter((task) => task.status === 'in_progress').length,
      in_review: todayTasks.filter((task) => task.status === 'in_review').length,
      done: todayTasks.filter((task) => task.status === 'done').length,
    };
  }, [todayTasks]);

  const filters: { id: TaskStatus; label: string }[] =
    visibility === 'hide' ? [...FILTERS] : [...FILTERS, { id: 'done', label: 'Done' }];
  const source = visibility === 'hide' ? todaysTasks : todayTasks;
  const activeFilter = visibility === 'hide' && filter === 'done' ? 'todo' : filter;
  const visible = activeFilter === 'all' ? source : source.filter((task) => task.status === activeFilter);

  return (
    <Screen>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + Layout.tabClearance,
          paddingHorizontal: Layout.padding,
        }}>
        <View style={styles.topRow}>
          <Text style={styles.logo}>Shughuli</Text>
          <View style={styles.actions}>
            <IconButton
              icon="plus"
              variant="dark"
              accessibilityLabel="Add task"
              onPress={() => router.push('/add-task')}
            />
            <IconButton icon="bell" accessibilityLabel="Settings" onPress={() => router.push('/settings')} />
          </View>
        </View>

        <Text style={styles.headline}>{"Let's Make\nToday Productive"}</Text>

        {tasks.length === 0 ? (
          <EmptyState
            title="Your day is open"
            body="Add a task and it will show up here with its time and priority."
            actionLabel="Add a task"
            onAction={() => router.push('/add-task')}
            style={styles.firstEmpty}
          />
        ) : (
          <>
            <View style={styles.progressCard}>
              <ProgressRing progress={progress} color={accentById(accent).ring} />
              <View style={styles.stats}>
                <Stat icon="grid" value={String(todayTasks.length)} label="Total Task" />
                <Stat icon="done" value={String(completed)} label="Completed Task" />
                <Stat icon="pending" value={String(todaysTasks.length)} label="Pending Task" />
              </View>
            </View>

            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Today&apos;s Tasks</Text>
              <Pressable onPress={() => setFilter('all')} hitSlop={8}>
                <Text style={styles.viewAll}>View All</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
              style={styles.filterScroll}>
              {filters.map((item) => {
                const selected = activeFilter === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setFilter(item.id)}
                    style={[styles.chip, selected && styles.chipSelected]}>
                    <Text style={[styles.chipCount, selected && styles.chipCountSelected]}>{counts[item.id]}</Text>
                    <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.list}>
              {visible.length === 0 ? (
                <EmptyState
                  compact
                  title="Nothing in this list"
                  body="Tasks with this status will show up here."
                />
              ) : (
                visible.map((task) => <TaskCard key={task.id} task={task} />)
              )}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Stat({ icon, value, label }: { icon: 'grid' | 'done' | 'pending'; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <Icon name={icon} size={14} color={Palette.white} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TaskCard({ task }: { task: Task }) {
  const tone = PRIORITY_TONE[task.priority];
  const timeFormat = usePreferencesStore((state) => state.prefs.timeFormat);
  const visibility = usePreferencesStore((state) => state.prefs.completedVisibility);
  const dimmed = visibility === 'dim' && task.status === 'done';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${task.title}`}
      onPress={() => router.push({ pathname: '/add-task', params: { id: task.id } })}
      style={[styles.card, dimmed && styles.dimmed]}>
      <View style={styles.cardTop}>
        <View style={[styles.priority, { backgroundColor: tone.bg }]}>
          <View style={[styles.priorityDot, { backgroundColor: tone.text }]} />
          <Text style={[styles.priorityText, { color: tone.text }]}>{tone.label}</Text>
        </View>
        <View style={styles.arrow}>
          <Icon name="arrow" size={14} color={Palette.ink} />
        </View>
      </View>
      <Text style={styles.cardTitle}>{task.title}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.timeRow}>
          <Icon name="clock" size={14} color={Palette.muted} />
          <Text style={styles.time}>
            {formatClock(task.start, timeFormat)} - {formatClock(task.end, timeFormat)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    color: Palette.ink,
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: -0.7,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  headline: {
    marginTop: 22,
    color: Palette.ink,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: 700,
    letterSpacing: -0.8,
  },
  firstEmpty: {
    marginTop: 28,
  },
  progressCard: {
    marginTop: 20,
    backgroundColor: Palette.progress,
    borderRadius: 28,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stats: {
    flex: 1,
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    color: Palette.white,
    fontSize: 16,
    fontWeight: 700,
  },
  statLabel: {
    color: '#C8C8CC',
    fontSize: 13,
    flexShrink: 1,
  },
  sectionRow: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: Palette.ink,
    fontSize: 18,
    fontWeight: 700,
  },
  viewAll: {
    color: Palette.muted,
    fontSize: 14,
    fontWeight: 600,
  },
  filterScroll: {
    marginTop: 14,
    marginHorizontal: -Layout.padding,
  },
  filters: {
    paddingHorizontal: Layout.padding,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.white,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...cardShadow,
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  chipSelected: {
    backgroundColor: Palette.limeChip,
  },
  chipCount: {
    color: Palette.ink,
    fontSize: 14,
    fontWeight: 700,
  },
  chipCountSelected: {
    color: Palette.ink,
  },
  chipLabel: {
    color: Palette.muted,
    fontSize: 14,
    fontWeight: 600,
  },
  chipLabelSelected: {
    color: Palette.ink,
  },
  list: {
    marginTop: 16,
    gap: 12,
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: 26,
    padding: 16,
    ...cardShadow,
  },
  dimmed: {
    opacity: 0.45,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priority: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 600,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    marginTop: 14,
    color: Palette.ink,
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: -0.3,
  },
  cardFooter: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  time: {
    color: Palette.muted,
    fontSize: 13,
    fontWeight: 500,
  },
});
