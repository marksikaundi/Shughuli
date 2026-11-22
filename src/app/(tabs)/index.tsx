import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconButton } from '@/components/icon';
import { Screen } from '@/components/screen';
import { TaskSummaryCard } from '@/components/task-summary-card';
import { Layout, Palette, cardShadow } from '@/constants/palette';
import { PEOPLE, type PersonId } from '@/data/people';
import { accentById } from '@/data/preferences';
import { useProjects } from '@/data/projects';
import { toDateKey, useTasks, type Task } from '@/data/tasks';
import { countPhrase, useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

const TILES = ['#E4F6EC', '#E4F0FB', '#FBF3D4', '#F8E6F2'];

export default function HomeScreen() {
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const accent = accentById(usePreferencesStore((state) => state.prefs.accent)).color;
  const today = toDateKey(new Date());

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

  const todayTasks = useMemo(() => tasks.filter((task) => task.date === today), [tasks, today]);
  const todayDone = todayTasks.filter((task) => task.status === 'done').length;
  const todayOpen = todayTasks.length - todayDone;
  const todayProgress = todayTasks.length === 0 ? 0 : todayDone / todayTasks.length;
  const todayLine =
    todayTasks.length === 0
      ? text.dayOpenTitle
      : todayOpen === 0
        ? text.allDone
        : countPhrase(todayOpen, { one: text.openOne, few: text.openFew, many: text.openMany, other: text.openOther });

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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text.today}
          onPress={() => router.navigate('/calendar')}
          style={({ pressed }) => [styles.today, pressed && styles.pressed]}>
          <View style={styles.todayRow}>
            <View style={styles.todayCopy}>
              <Text style={styles.todayLabel}>{text.today}</Text>
              <Text style={styles.todayLine}>{todayLine}</Text>
            </View>
            <View style={[styles.doneChip, { backgroundColor: accent }]}>
              <Text style={styles.doneCount}>{todayDone}</Text>
              <Text style={styles.doneLabel}>{text.done}</Text>
            </View>
          </View>
          <View style={styles.todayTrack}>
            <View style={[styles.todayFill, { width: `${todayProgress * 100}%`, backgroundColor: accent }]} />
          </View>
        </Pressable>

        <View style={styles.grid}>
          {tiles.map((tile, index) => (
            <ProjectTile key={tile.id} tile={tile} color={TILES[index % TILES.length]} accent={accent} addLabel={text.addTask} />
          ))}
          <View style={styles.cell}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={text.addProject}
              onPress={() => router.push('/add-project')}
              style={({ pressed }) => [styles.tile, styles.addTile, pressed && styles.pressed]}>
              <View style={styles.addMark}>
                <Icon name="plus" size={20} color={Palette.ink} />
              </View>
              <Text style={styles.addLabel}>{text.addProject}</Text>
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text.addTask}
            onPress={() => router.push('/add-task')}
            style={({ pressed }) => [styles.emptyCard, pressed && styles.pressed]}>
            <Text style={styles.emptyTitle}>{text.noTasksYet}</Text>
            <Text style={styles.emptyBody}>{text.noTasksBody}</Text>
          </Pressable>
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
  accent,
  addLabel,
}: {
  tile: { id: string; name: string; done: number; total: number; focus?: Task; people: PersonId[] };
  color: string;
  accent: string;
  addLabel: string;
}) {
  const progress = tile.total === 0 ? 0 : tile.done / tile.total;
  return (
    <View style={styles.cell}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tile.name}
        onPress={() => router.push({ pathname: '/add-task', params: { project: tile.name } })}
        style={({ pressed }) => [styles.tile, { backgroundColor: color }, pressed && styles.pressed]}>
        <View style={styles.tileTop}>
          <Text style={styles.project} numberOfLines={2}>
            {tile.name}
          </Text>
          <FaceRow ids={tile.people} />
        </View>
        <Text style={[styles.focus, !tile.focus && styles.focusEmpty]} numberOfLines={1}>
          {tile.focus?.title ?? addLabel}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: accent }]} />
          </View>
          <Text style={styles.count}>
            {tile.done}/{tile.total}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function FaceRow({ ids }: { ids: PersonId[] }) {
  const shown = ids.filter((id) => PEOPLE[id]).slice(0, 3);
  if (shown.length === 0) return null;
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
    marginTop: 18,
    color: Palette.ink,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: 700,
    letterSpacing: -1.1,
  },
  today: {
    marginTop: 20,
    backgroundColor: Palette.white,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    ...cardShadow,
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  todayCopy: {
    flex: 1,
    gap: 4,
  },
  todayLabel: {
    color: Palette.muted,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  todayLine: {
    color: Palette.ink,
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.4,
  },
  doneChip: {
    minWidth: 64,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  doneCount: {
    color: Palette.ink,
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: -0.3,
  },
  doneLabel: {
    color: Palette.ink,
    fontSize: 11,
    fontWeight: 700,
    opacity: 0.72,
  },
  todayTrack: {
    marginTop: 14,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(22,22,22,0.06)',
    overflow: 'hidden',
  },
  todayFill: {
    height: '100%',
    borderRadius: 3,
  },
  grid: {
    marginTop: 16,
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
    minHeight: 148,
    borderRadius: 22,
    padding: 14,
    justifyContent: 'space-between',
    gap: 12,
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  addTile: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D5D0D8',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  addMark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    color: Palette.ink,
    fontSize: 13,
    fontWeight: 700,
  },
  project: {
    flex: 1,
    color: Palette.ink,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: 700,
    letterSpacing: -0.3,
  },
  faces: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
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
  focus: {
    color: Palette.ink,
    fontSize: 13,
    fontWeight: 600,
    opacity: 0.72,
  },
  focusEmpty: {
    color: Palette.muted,
    fontWeight: 600,
    opacity: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(22,22,22,0.08)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  count: {
    color: Palette.ink,
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.55,
  },
  sectionRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: Palette.ink,
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: -0.3,
  },
  viewAll: {
    color: Palette.muted,
    fontSize: 14,
    fontWeight: 700,
  },
  list: {
    marginTop: 14,
    gap: 12,
  },
  emptyCard: {
    marginTop: 14,
    backgroundColor: Palette.white,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 6,
    ...cardShadow,
    shadowOpacity: 0.05,
    shadowRadius: 14,
  },
  emptyTitle: {
    color: Palette.ink,
    fontSize: 16,
    fontWeight: 700,
  },
  emptyBody: {
    color: Palette.muted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  pressed: {
    opacity: 0.84,
  },
});
