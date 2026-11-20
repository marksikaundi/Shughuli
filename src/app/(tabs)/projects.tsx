import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { Icon, IconButton } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Layout, Palette, cardShadow } from '@/constants/palette';
import { useProjects } from '@/data/projects';
import { useTasks, type Task } from '@/data/tasks';

type Board = 'all' | 'active' | 'done';

const BOARDS: { id: Board; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'all', label: 'All' },
  { id: 'done', label: 'Done' },
];

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const { tasks } = useTasks();
  const { projects: saved } = useProjects();
  const [board, setBoard] = useState<Board>('active');

  const projects = useMemo(() => {
    return saved.map((project) => {
      const items = tasks
        .filter((task) => task.kind === 'task' && task.project.trim().toLowerCase() === project.name.toLowerCase())
        .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
      const done = items.filter((task) => task.status === 'done').length;
      const upcoming = items.filter((task) => task.status !== 'done').slice(0, 3);
      return {
        id: project.id,
        name: project.name,
        open: items.length - done,
        done,
        total: items.length,
        upcoming,
      };
    });
  }, [saved, tasks]);

  const openTasks = projects.reduce((sum, project) => sum + project.open, 0);
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
            <Text style={styles.title}>Projects</Text>
            {projects.length > 0 ? (
              <Text style={styles.subtitle}>
                {projects.length} {projects.length === 1 ? 'project' : 'projects'} · {openTasks} open
              </Text>
            ) : null}
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
            <View style={styles.segment}>
              {BOARDS.map((item) => {
                const selected = board === item.id;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setBoard(item.id)}
                    style={[styles.segmentItem, selected && styles.segmentItemOn]}>
                    <Text style={[styles.segmentText, selected && styles.segmentTextOn]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>

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

function ProjectCard({
  project,
}: {
  project: {
    id: string;
    name: string;
    open: number;
    done: number;
    total: number;
    upcoming: Task[];
  };
}) {
  const progress = project.total === 0 ? 0 : project.done / project.total;
  const status =
    project.total === 0 ? 'No tasks yet' : project.open === 0 ? 'All done' : `${project.open} open · ${project.done} done`;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.name} numberOfLines={2}>
          {project.name}
        </Text>
        <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
      </View>
      <Text style={styles.status}>{status}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>

      {project.upcoming.length > 0 ? (
        <View style={styles.tasks}>
          {project.upcoming.map((task) => (
            <Pressable
              key={task.id}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${task.title}`}
              onPress={() => router.push({ pathname: '/add-task', params: { id: task.id } })}
              style={({ pressed }) => [styles.task, pressed && styles.pressed]}>
              <View style={styles.mark} />
              <Text style={styles.taskTitle} numberOfLines={1}>
                {task.title}
              </Text>
              <Icon name="chevron" size={14} color={Palette.faint} />
            </Pressable>
          ))}
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add task to ${project.name}`}
        onPress={() => router.push({ pathname: '/add-task', params: { project: project.name } })}
        style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
        <Icon name="plus" size={14} color={Palette.ink} />
        <Text style={styles.addText}>Add task</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    paddingTop: 4,
  },
  title: {
    color: Palette.ink,
    fontSize: 34,
    fontWeight: 700,
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 6,
    color: Palette.muted,
    fontSize: 15,
    fontWeight: 600,
  },
  empty: {
    marginTop: 22,
  },
  segment: {
    marginTop: 22,
    flexDirection: 'row',
    backgroundColor: Palette.white,
    borderRadius: 18,
    padding: 4,
    ...cardShadow,
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  segmentItem: {
    flex: 1,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemOn: {
    backgroundColor: Palette.ink,
  },
  segmentText: {
    color: Palette.muted,
    fontSize: 14,
    fontWeight: 700,
  },
  segmentTextOn: {
    color: Palette.white,
  },
  list: {
    marginTop: 16,
    gap: 12,
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: 24,
    padding: 16,
    ...cardShadow,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  name: {
    flex: 1,
    color: Palette.ink,
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: -0.4,
  },
  percent: {
    color: Palette.ink,
    fontSize: 16,
    fontWeight: 700,
  },
  status: {
    marginTop: 4,
    color: Palette.muted,
    fontSize: 13,
    fontWeight: 600,
  },
  track: {
    marginTop: 14,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F1F4',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Palette.ink,
  },
  tasks: {
    marginTop: 8,
  },
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 40,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.line,
  },
  mark: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Palette.faint,
  },
  taskTitle: {
    flex: 1,
    color: Palette.ink,
    fontSize: 15,
    fontWeight: 600,
  },
  add: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 2,
  },
  addText: {
    color: Palette.ink,
    fontSize: 14,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.7,
  },
});
