import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { Icon, IconButton } from '@/components/icon';
import { ProgressRing } from '@/components/progress-ring';
import { Screen } from '@/components/screen';
import { Layout, Palette, cardShadow } from '@/constants/palette';
import { useProjects } from '@/data/projects';
import { useTasks, type Task } from '@/data/tasks';

const TINTS = [Palette.lime, Palette.blue, '#C9B6F4', Palette.high];

type Board = 'all' | 'active' | 'done';

const BOARDS: { id: Board; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'done', label: 'Done' },
];

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const { tasks } = useTasks();
  const { projects: saved } = useProjects();
  const [board, setBoard] = useState<Board>('all');

  const projects = useMemo(() => {
    return saved.map((project, index) => {
      const items = tasks
        .filter((task) => task.kind === 'task' && task.project.trim().toLowerCase() === project.name.toLowerCase())
        .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
      const done = items.filter((task) => task.status === 'done').length;
      const todo = items.filter((task) => task.status === 'todo').length;
      const doing = items.filter((task) => task.status === 'in_progress' || task.status === 'in_review').length;
      const upcoming = items.filter((task) => task.status !== 'done').slice(0, 2);
      return {
        id: project.id,
        name: project.name,
        open: items.length - done,
        done,
        todo,
        doing,
        total: items.length,
        upcoming,
        tint: TINTS[index % TINTS.length],
      };
    });
  }, [saved, tasks]);

  const totals = useMemo(() => {
    const open = projects.reduce((sum, project) => sum + project.open, 0);
    const done = projects.reduce((sum, project) => sum + project.done, 0);
    const total = projects.reduce((sum, project) => sum + project.total, 0);
    return { open, done, total, progress: total === 0 ? 0 : done / total };
  }, [projects]);

  const visible = projects.filter((project) => {
    if (board === 'active') return project.total === 0 || project.open > 0;
    if (board === 'done') return project.total > 0 && project.open === 0;
    return true;
  });

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + Layout.tabClearance,
          paddingHorizontal: Layout.padding,
        }}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>Workspace</Text>
            <Text style={styles.title}>Projects</Text>
          </View>
          <IconButton
            icon="plus"
            variant="dark"
            accessibilityLabel="Add project"
            onPress={() => router.push('/add-project')}
          />
        </View>

        {projects.length === 0 ? (
          <EmptyState
            icon="folder"
            title="No projects yet"
            body="Create a project you’re working on. When you add a task, you can assign it to that project."
            actionLabel="New project"
            onAction={() => router.push('/add-project')}
            style={styles.empty}
          />
        ) : (
          <>
            <View style={styles.overview}>
              <ProgressRing progress={totals.progress} size={104} stroke={10} />
              <View style={styles.overviewStats}>
                <OverviewStat icon="folder" value={String(projects.length)} label="Projects" />
                <OverviewStat icon="pending" value={String(totals.open)} label="Open tasks" />
                <OverviewStat icon="done" value={String(totals.done)} label="Done" />
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filters}>
              {BOARDS.map((item) => {
                const selected = board === item.id;
                const count =
                  item.id === 'active'
                    ? projects.filter((project) => project.total === 0 || project.open > 0).length
                    : item.id === 'done'
                      ? projects.filter((project) => project.total > 0 && project.open === 0).length
                      : projects.length;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setBoard(item.id)}
                    style={[styles.chip, selected && styles.chipSelected]}>
                    <Text style={styles.chipCount}>{count}</Text>
                    <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {visible.length === 0 ? (
              <EmptyState
                compact
                icon="folder"
                title={board === 'done' ? 'Nothing finished yet' : 'No active projects'}
                body={
                  board === 'done'
                    ? 'A project lands here once every task in it is done.'
                    : 'Projects you are still working on will show up here.'
                }
                style={styles.empty}
              />
            ) : (
              <View style={styles.list}>
                {visible.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function OverviewStat({ icon, value, label }: { icon: 'folder' | 'pending' | 'done'; value: string; label: string }) {
  return (
    <View style={styles.overviewStat}>
      <View style={styles.overviewIcon}>
        <Icon name={icon} size={14} color={Palette.white} />
      </View>
      <Text style={styles.overviewValue}>{value}</Text>
      <Text style={styles.overviewLabel}>{label}</Text>
    </View>
  );
}

function ProjectCard({
  project,
}: {
  project: {
    id: string;
    name: string;
    open: number;
    done: number;
    todo: number;
    doing: number;
    total: number;
    upcoming: Task[];
    tint: string;
  };
}) {
  const progress = project.total === 0 ? 0 : project.done / project.total;
  const percent = Math.round(progress * 100);

  return (
    <View style={styles.card}>
      <View style={[styles.rail, { backgroundColor: project.tint }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.identity}>
            <View style={[styles.swatch, { backgroundColor: project.tint }]}>
              <Icon name="folder" size={16} color={Palette.ink} />
            </View>
            <View style={styles.identityCopy}>
              <Text style={styles.name} numberOfLines={2}>
                {project.name}
              </Text>
              <Text style={styles.openLabel}>{project.total === 0 ? 'No tasks yet' : `${project.open} open`}</Text>
            </View>
          </View>
          <Text style={styles.percent}>{percent}%</Text>
        </View>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: project.tint }]} />
        </View>

        <View style={styles.metrics}>
          <Metric value={project.todo} label="To do" />
          <View style={styles.metricRule} />
          <Metric value={project.doing} label="Doing" />
          <View style={styles.metricRule} />
          <Metric value={project.done} label="Done" />
        </View>

        {project.upcoming.length > 0 ? (
          <View style={styles.upcoming}>
            {project.upcoming.map((task) => (
              <Pressable
                key={task.id}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${task.title}`}
                onPress={() => router.push({ pathname: '/add-task', params: { id: task.id } })}
                style={({ pressed }) => [styles.taskRow, pressed && styles.pressed]}>
                <View style={[styles.taskDot, { backgroundColor: project.tint }]} />
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {task.title}
                </Text>
                <Icon name="chevron" size={14} color={Palette.faint} />
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.quiet}>{project.total === 0 ? 'Add the first task for this project.' : 'Every task in this project is done.'}</Text>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add task to ${project.name}`}
          onPress={() => router.push({ pathname: '/add-task', params: { project: project.name } })}
          style={({ pressed }) => [styles.addTask, pressed && styles.pressed]}>
          <Icon name="plus" size={14} color={Palette.ink} />
          <Text style={styles.addTaskText}>Add task</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    paddingRight: 12,
  },
  kicker: {
    color: Palette.muted,
    fontSize: 13,
    fontWeight: 600,
  },
  title: {
    marginTop: 4,
    color: Palette.ink,
    fontSize: 34,
    fontWeight: 700,
    letterSpacing: -0.8,
  },
  empty: {
    marginTop: 22,
  },
  overview: {
    marginTop: 22,
    backgroundColor: Palette.progress,
    borderRadius: 28,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  overviewStats: {
    flex: 1,
    gap: 12,
  },
  overviewStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overviewIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewValue: {
    color: Palette.white,
    fontSize: 16,
    fontWeight: 700,
    minWidth: 18,
  },
  overviewLabel: {
    color: '#C8C8CC',
    fontSize: 13,
    fontWeight: 600,
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
    gap: 14,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Palette.white,
    borderRadius: 26,
    overflow: 'hidden',
    ...cardShadow,
  },
  rail: {
    width: 8,
  },
  cardBody: {
    flex: 1,
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCopy: {
    flex: 1,
  },
  name: {
    color: Palette.ink,
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: -0.3,
  },
  openLabel: {
    marginTop: 2,
    color: Palette.muted,
    fontSize: 13,
    fontWeight: 600,
  },
  percent: {
    color: Palette.ink,
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: -0.4,
  },
  track: {
    marginTop: 14,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F1F4',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  metrics: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F4F8',
    borderRadius: 16,
    paddingVertical: 10,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    color: Palette.ink,
    fontSize: 16,
    fontWeight: 700,
  },
  metricLabel: {
    marginTop: 2,
    color: Palette.muted,
    fontSize: 11,
    fontWeight: 600,
  },
  metricRule: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: Palette.line,
  },
  upcoming: {
    marginTop: 12,
    gap: 4,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 32,
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskTitle: {
    flex: 1,
    color: Palette.ink,
    fontSize: 14,
    fontWeight: 600,
  },
  quiet: {
    marginTop: 12,
    color: Palette.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 600,
  },
  addTask: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: Palette.limeChip,
  },
  addTaskText: {
    color: Palette.ink,
    fontSize: 13,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.85,
  },
});
