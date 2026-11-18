import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { Icon, IconButton } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Layout, Palette, cardShadow } from '@/constants/palette';
import { useTasks } from '@/data/tasks';

const TINTS = [Palette.lime, Palette.medium, '#C9B6F4'];

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const { tasks } = useTasks();
  const projects = useMemo(() => {
    const names = [...new Set(tasks.map((task) => task.project.trim()).filter(Boolean))];
    return names.map((name, index) => {
      const items = tasks.filter((task) => task.project === name && task.kind === 'task');
      const done = items.filter((task) => task.status === 'done').length;
      return {
        name,
        open: items.length - done,
        done,
        total: items.length,
        tint: TINTS[index % TINTS.length],
      };
    });
  }, [tasks]);

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
            accessibilityLabel="Add task"
            onPress={() => router.push('/add-task')}
          />
        </View>

        {projects.length === 0 ? (
          <EmptyState
            icon="folder"
            title="No projects yet"
            body="Name a project when you add a task, and it will show up here."
            actionLabel="Add a task"
            onAction={() => router.push('/add-task')}
            style={styles.empty}
          />
        ) : (
          <View style={styles.list}>
            {projects.map((project) => {
              const progress = project.total === 0 ? 0 : project.done / project.total;
              return (
                <View key={project.name} style={styles.card}>
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
});
