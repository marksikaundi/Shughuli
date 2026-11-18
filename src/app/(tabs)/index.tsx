import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, AvatarStack } from '@/components/avatar-stack';
import { Icon, IconButton } from '@/components/icon';
import { ProgressRing } from '@/components/progress-ring';
import { Screen } from '@/components/screen';
import { Layout, Palette, cardShadow } from '@/constants/palette';
import { PEOPLE } from '@/data/people';
import { formatClock, toDateKey, useTasks, type Task, type TaskStatus } from '@/data/tasks';

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
  const [filter, setFilter] = useState<TaskStatus | 'all'>('todo');
  const today = toDateKey(new Date());

  const todaysTasks = useMemo(
    () => tasks.filter((task) => task.date === today && task.kind === 'task' && task.status !== 'done'),
    [tasks, today],
  );

  const counts = useMemo(() => {
    return {
      todo: todaysTasks.filter((task) => task.status === 'todo').length,
      in_progress: todaysTasks.filter((task) => task.status === 'in_progress').length,
      in_review: todaysTasks.filter((task) => task.status === 'in_review').length,
    };
  }, [todaysTasks]);

  const visible = filter === 'all' ? todaysTasks : todaysTasks.filter((task) => task.status === filter);

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
          <View style={styles.identity}>
            <Avatar person={PEOPLE.olivia} size={46} />
            <View>
              <Text style={styles.hello}>{greeting()}</Text>
              <Text style={styles.name}>Olivia Reed</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <IconButton
              icon="plus"
              variant="dark"
              accessibilityLabel="Add task"
              onPress={() => router.push('/add-task')}
            />
            <IconButton icon="bell" accessibilityLabel="Notifications" onPress={() => router.push('/profile')} />
          </View>
        </View>

        <Text style={styles.headline}>{"Let's Make\nToday Productive"}</Text>

        <View style={styles.progressCard}>
          <ProgressRing progress={0.72} />
          <View style={styles.stats}>
            <Stat icon="grid" value="12" label="Total Task" />
            <Stat icon="done" value="12" label="Completed Task" />
            <Stat icon="pending" value="12" label="Pending Task" />
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
          {FILTERS.map((item) => {
            const selected = filter === item.id;
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
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing in this list</Text>
              <Text style={styles.emptyBody}>Tasks you add will show up here.</Text>
            </View>
          ) : (
            visible.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
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

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.priority, { backgroundColor: tone.bg }]}>
          <View style={[styles.priorityDot, { backgroundColor: tone.text }]} />
          <Text style={[styles.priorityText, { color: tone.text }]}>{tone.label}</Text>
        </View>
        <Pressable style={styles.arrow} accessibilityLabel={`Open ${task.title}`}>
          <Icon name="arrow" size={14} color={Palette.ink} />
        </Pressable>
      </View>
      <Text style={styles.cardTitle}>{task.title}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.timeRow}>
          <Icon name="clock" size={14} color={Palette.muted} />
          <Text style={styles.time}>
            {formatClock(task.start)} - {formatClock(task.end)}
          </Text>
        </View>
        <AvatarStack ids={task.people} extra={task.extraPeople} />
      </View>
    </View>
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
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hello: {
    color: Palette.ink,
    fontSize: 16,
    fontWeight: 700,
  },
  name: {
    color: Palette.muted,
    fontSize: 13,
    marginTop: 1,
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
  empty: {
    backgroundColor: Palette.white,
    borderRadius: 24,
    padding: 20,
    ...cardShadow,
  },
  emptyTitle: {
    color: Palette.ink,
    fontSize: 16,
    fontWeight: 700,
  },
  emptyBody: {
    marginTop: 4,
    color: Palette.muted,
    fontSize: 14,
  },
});
