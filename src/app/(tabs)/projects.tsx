import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { Icon, IconButton } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Layout, Palette, cardShadow } from '@/constants/palette';
import { useProjects } from '@/data/projects';
import { useTasks } from '@/data/tasks';

const TINTS = [Palette.lime, Palette.medium, '#C9B6F4'];

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const { tasks } = useTasks();
  const { projects: saved } = useProjects();
  const projects = useMemo(() => {
    return saved.map((project, index) => {
      const items = tasks.filter(
        (task) => task.kind === 'task' && task.project.trim().toLowerCase() === project.name.toLowerCase(),
      );
      const done = items.filter((task) => task.status === 'done').length;
      return {
        id: project.id,
        name: project.name,
        open: items.length - done,
        done,
        total: items.length,
        tint: TINTS[index % TINTS.length],
      };
    });
  }, [saved, tasks]);

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
          <View>
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
          <View style={styles.list}>
            {projects.map((project) => {
              const progress = project.total === 0 ? 0 : project.done / project.total;
              return (
                <View key={project.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={[styles.swatch, { backgroundColor: project.tint }]}>
                      <Icon name="folder" size={16} color={Palette.ink} />
                    </View>
                    <Text style={styles.count}>{project.open} open</Text>
                  </View>
                  <Text style={styles.name}>{project.name}</Text>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: project.tint }]} />
                  </View>
                  <Text style={styles.meta}>
                    {project.done} of {project.total} done
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Add task to ${project.name}`}
                    onPress={() => router.push({ pathname: '/add-task', params: { project: project.name } })}
                    style={({ pressed }) => [styles.addTask, pressed && styles.pressed]}>
                    <Icon name="plus" size={14} color={Palette.ink} />
                    <Text style={styles.addTaskText}>Add task</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
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
  list: {
    marginTop: 22,
    gap: 14,
  },
  empty: {
    marginTop: 22,
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
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    color: Palette.muted,
    fontSize: 13,
    fontWeight: 600,
  },
  name: {
    marginTop: 14,
    color: Palette.ink,
    fontSize: 18,
    fontWeight: 700,
  },
  track: {
    marginTop: 16,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F1F4',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  meta: {
    marginTop: 8,
    color: Palette.faint,
    fontSize: 12,
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
    backgroundColor: Palette.lime,
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
