import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconButton } from '@/components/icon';
import { Screen } from '@/components/screen';
import { TaskSummaryCard } from '@/components/task-summary-card';
import { Layout, Palette } from '@/constants/palette';
import { PEOPLE, type PersonId } from '@/data/people';
import { useProjects } from '@/data/projects';
import { useTasks, type Task } from '@/data/tasks';
import { useCopy } from '@/lib/settings-copy';

const TILES = ['#E7F6EE', '#E7F1FA', '#FBF6D8', '#F6E8F4'];

export default function HomeScreen() {
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const { tasks } = useTasks();
  const { projects } = useProjects();

  const tiles = useMemo(() => {
    return projects.map((project) => {
      const items = tasks
        .filter((task) => task.project.trim().toLowerCase() === project.name.trim().toLowerCase())
        .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
      const done = items.filter((task) => task.status === 'done').length;
      const focus = items.find((task) => task.status !== 'done') ?? items[0];
      const people = [...new Set(items.flatMap((task) => task.people))].slice(0, 3);
      return { id: project.id, name: project.name, done, total: items.length, focus, people };
    });
  }, [projects, tasks]);

  const recent = useMemo(() => {
    return tasks
      .filter((task) => task.status !== 'done')
      .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
      .slice(0, 3);
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
        <View style={styles.top}>
          <Text style={styles.logo}>Shughuli</Text>
          <IconButton icon="bell" accessibilityLabel={text.settings} onPress={() => router.push('/settings')} />
        </View>

        <Text style={styles.headline}>{text.headline}</Text>

        <View style={styles.grid}>
          {tiles.map((tile, index) => (
            <ProjectTile key={tile.id} tile={tile} color={TILES[index % TILES.length]} />
          ))}
          <View style={styles.cell}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={text.addProject}
              onPress={() => router.push('/add-project')}
              style={({ pressed }) => [styles.tile, styles.addTile, pressed && styles.pressed]}>
              <Icon name="plus" size={28} color={Palette.faint} />
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{text.recentTask}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={text.viewAllTasks} onPress={() => router.push('/tasks')} hitSlop={8}>
            <Text style={styles.viewAll}>{text.seeAll}</Text>
          </Pressable>
        </View>

        {recent.length === 0 ? (
          <Text style={styles.emptyRecent}>{text.noTasksYet}</Text>
        ) : (
          <View style={styles.list}>
            {recent.map((task) => (
              <TaskSummaryCard key={task.id} task={task} />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function ProjectTile({
  tile,
  color,
}: {
  tile: { id: string; name: string; done: number; total: number; focus?: Task; people: PersonId[] };
  color: string;
}) {
  const progress = tile.total === 0 ? 0 : tile.done / tile.total;
  return (
    <View style={styles.cell}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tile.name}
        onPress={() => router.push({ pathname: '/add-task', params: { project: tile.name } })}
        style={({ pressed }) => [styles.tile, { backgroundColor: color }, pressed && styles.pressed]}>
        <Text style={styles.project} numberOfLines={2}>
          {tile.name}
        </Text>
        <FaceRow ids={tile.people} />
        <View style={styles.metaRow}>
          <Text style={styles.focus} numberOfLines={1}>
            {tile.focus?.title ?? ' '}
          </Text>
          <Text style={styles.count}>
            {tile.done}/{tile.total}
          </Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>
      </Pressable>
    </View>
  );
}

function FaceRow({ ids }: { ids: PersonId[] }) {
  const shown = ids.filter((id) => PEOPLE[id]).slice(0, 3);
  if (shown.length === 0) return <View style={styles.faceSpace} />;
  return (
    <View style={styles.faces}>
      {shown.map((id, index) => (
        <View
          key={id}
          style={[
            styles.face,
            { backgroundColor: PEOPLE[id].color, marginLeft: index === 0 ? 0 : -8, zIndex: shown.length - index },
          ]}>
          <Text style={[styles.faceText, { color: PEOPLE[id].text }]}>{PEOPLE[id].initials.slice(0, 1)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  logo: {
    color: Palette.ink,
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: -0.7,
  },
  headline: {
    marginTop: 22,
    color: Palette.ink,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: 700,
    letterSpacing: -1,
  },
  grid: {
    marginTop: 18,
    marginHorizontal: -6,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  tile: {
    flex: 1,
    minHeight: 160,
    borderRadius: 22,
    padding: 14,
    justifyContent: 'space-between',
  },
  addTile: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D5D0D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  project: {
    color: Palette.ink,
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: -0.3,
  },
  faces: {
    flexDirection: 'row',
    marginTop: 10,
  },
  faceSpace: {
    height: 24,
    marginTop: 10,
  },
  face: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceText: {
    fontSize: 10,
    fontWeight: 700,
  },
  metaRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  focus: {
    flex: 1,
    color: Palette.muted,
    fontSize: 12,
    fontWeight: 600,
  },
  count: {
    color: Palette.muted,
    fontSize: 12,
    fontWeight: 700,
  },
  track: {
    marginTop: 8,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(22,22,22,0.08)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Palette.ink,
  },
  sectionRow: {
    marginTop: 28,
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
  list: {
    marginTop: 14,
    gap: 12,
  },
  emptyRecent: {
    marginTop: 14,
    color: Palette.muted,
    fontSize: 14,
    fontWeight: 600,
  },
  pressed: {
    opacity: 0.84,
  },
});
