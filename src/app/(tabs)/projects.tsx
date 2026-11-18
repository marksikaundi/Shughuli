import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconButton } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Layout, Palette, cardShadow } from '@/constants/palette';
import { useTasks } from '@/data/tasks';

const PROJECTS = [
  { name: 'Website Redesign', detail: 'Landing page, header, and launch checklist', tasks: 8, done: 5, tint: Palette.lime },
  { name: 'Mobile App', detail: 'Motion specs and the Friday review deck', tasks: 6, done: 2, tint: Palette.medium },
  { name: 'Brand System', detail: 'Dribbble series, type, and illustrations', tasks: 4, done: 3, tint: '#C9B6F4' },
];

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const { tasks } = useTasks();

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

        <View style={styles.list}>
          {PROJECTS.map((project) => {
            const live = tasks.filter((task) => task.project === project.name && task.status !== 'done').length;
            const progress = project.done / project.tasks;
            return (
              <View key={project.name} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.swatch, { backgroundColor: project.tint }]}>
                    <Icon name="folder" size={16} color={Palette.ink} />
                  </View>
                  <Text style={styles.count}>{live} open</Text>
                </View>
                <Text style={styles.name}>{project.name}</Text>
                <Text style={styles.detail}>{project.detail}</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: project.tint }]} />
                </View>
                <Text style={styles.meta}>
                  {project.done} of {project.tasks} milestones
                </Text>
              </View>
            );
          })}
        </View>
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
  detail: {
    marginTop: 4,
    color: Palette.muted,
    fontSize: 14,
    lineHeight: 20,
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
