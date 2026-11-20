import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { Icon, IconButton } from '@/components/icon';
import { ProgressRing } from '@/components/progress-ring';
import { Screen } from '@/components/screen';
import { TaskCard } from '@/components/task-card';
import { Layout, Palette, cardShadow } from '@/constants/palette';
import { toDateKey, useTasks, type TaskStatus } from '@/data/tasks';
import { accentById } from '@/data/preferences';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

const FILTERS: Exclude<TaskStatus, 'done'>[] = ['todo', 'in_progress', 'in_review'];

export default function HomeScreen() {
  const text = useCopy();
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

  const statusLabel: Record<TaskStatus, string> = {
    todo: text.todo,
    in_progress: text.inProgress,
    in_review: text.inReview,
    done: text.done,
  };
  const filterIds: TaskStatus[] = visibility === 'hide' ? [...FILTERS] : [...FILTERS, 'done'];
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
              accessibilityLabel={text.addTask}
              onPress={() => router.push('/add-task')}
            />
            <IconButton icon="bell" accessibilityLabel={text.settings} onPress={() => router.push('/settings')} />
          </View>
        </View>

        <Text style={styles.headline}>{text.headline}</Text>

        {tasks.length === 0 ? (
          <EmptyState
            title={text.dayOpenTitle}
            body={text.dayOpenBody}
            actionLabel={text.addTask}
            onAction={() => router.push('/add-task')}
            style={styles.firstEmpty}
          />
        ) : (
          <>
            <View style={styles.progressCard}>
              <ProgressRing progress={progress} color={accentById(accent).ring} />
              <View style={styles.stats}>
                <Stat icon="grid" value={String(todayTasks.length)} label={text.totalTask} />
                <Stat icon="done" value={String(completed)} label={text.completedTask} />
                <Stat icon="pending" value={String(todaysTasks.length)} label={text.pendingTask} />
              </View>
            </View>

            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>{text.todaysTasks}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={text.viewAllTasks} onPress={() => router.push('/tasks')} hitSlop={8}>
                <Text style={styles.viewAll}>{text.viewAll}</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
              style={styles.filterScroll}>
              {filterIds.map((id) => {
                const selected = activeFilter === id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => setFilter(id)}
                    style={[styles.chip, selected && styles.chipSelected]}>
                    <Text style={[styles.chipCount, selected && styles.chipCountSelected]}>{counts[id]}</Text>
                    <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{statusLabel[id]}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.list}>
              {visible.length === 0 ? (
                <EmptyState
                  compact
                  title={text.nothingInListTitle}
                  body={text.nothingInListBody}
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
});
