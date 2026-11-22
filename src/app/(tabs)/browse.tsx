import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Screen, useNightStatus } from '@/components/screen';
import { Night } from '@/constants/night';
import { Layout } from '@/constants/palette';
import { accentById } from '@/data/preferences';
import { useProjects } from '@/data/projects';
import { useTasks } from '@/data/tasks';
import {
  calendarAccessGranted,
  connectGoogleCalendar,
  pullGoogleEvents,
  readCalendarLink,
  syncAllTasks,
} from '@/lib/google-calendar';
import { getCopy, useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';
import { useTaskStore } from '@/store/tasks';

const DOTS = ['#E15B52', '#5B8DEF', '#C8F06E', '#E7A23A', '#A78BDB'];

export default function BrowseScreen() {
  useNightStatus();
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const prefs = usePreferencesStore((state) => state.prefs);
  const [query, setQuery] = useState('');
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const name = prefs.displayName.trim() || 'Shughuli';
  const letter = name.charAt(0).toUpperCase();
  const avatar = accentById(prefs.avatarColor).color;
  const needle = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!needle) return [];
    return tasks
      .filter((task) => task.title.toLowerCase().includes(needle) || task.project.toLowerCase().includes(needle))
      .slice(0, 20);
  }, [needle, tasks]);

  const projectMatches = useMemo(() => {
    if (!needle) return [];
    return projects.filter((project) => project.name.toLowerCase().includes(needle));
  }, [needle, projects]);

  async function connectCalendar() {
    if (connecting) return;
    let granted = false;
    try {
      granted = await calendarAccessGranted();
    } catch {
      granted = false;
    }
    const consent = granted || (await confirmCalendarAccess());
    if (!consent) return;
    setConnecting(true);
    try {
      await connectGoogleCalendar(true);
      await pullGoogleEvents((incoming) => useTaskStore.getState().importTasks(incoming));
      await syncAllTasks(useTaskStore.getState().tasks);
      await readCalendarLink();
    } catch (error) {
      Alert.alert(text.googleCalendar, error instanceof Error ? error.message : text.googleConnectFailed);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <Screen tone="night">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + Layout.tabClearance,
          paddingHorizontal: Layout.padding,
        }}>
        <View style={styles.header}>
          <View style={styles.identity}>
            <View style={[styles.avatar, { backgroundColor: avatar }]}>
              {prefs.avatarUri ? (
                <Image source={{ uri: prefs.avatarUri }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Text style={styles.avatarLetter}>{letter}</Text>
              )}
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={text.settings} hitSlop={8} onPress={() => router.push('/settings')}>
            <Icon name="settings" size={22} color={Night.text} />
          </Pressable>
        </View>

        <View style={styles.search}>
          <Icon name="search" size={18} color={Night.accent} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={text.searchTasks}
            placeholderTextColor={Night.muted}
            style={styles.searchInput}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        {needle ? (
          <View style={styles.results}>
            {projectMatches.map((project) => (
              <Pressable
                key={project.id}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/tasks', params: { project: project.name } })}
                style={styles.result}>
                <Text style={styles.resultTitle}>{project.name}</Text>
              </Pressable>
            ))}
            {matches.map((task) => (
              <Pressable
                key={task.id}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/add-task', params: { id: task.id } })}
                style={styles.result}>
                <Text style={styles.resultTitle}>{task.title}</Text>
                {task.project.trim() ? <Text style={styles.resultMeta}>{task.project}</Text> : null}
              </Pressable>
            ))}
            {projectMatches.length === 0 && matches.length === 0 ? <Text style={styles.emptySearch}>{text.noTasksYet}</Text> : null}
          </View>
        ) : (
          <>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{text.myProjects}</Text>
              <View style={styles.sectionActions}>
                <Pressable accessibilityRole="button" accessibilityLabel={text.addProject} hitSlop={8} onPress={() => router.push('/add-project')}>
                  <Icon name="plus" size={20} color={Night.muted} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: projectsOpen }}
                  hitSlop={8}
                  onPress={() => setProjectsOpen((open) => !open)}>
                  <View style={{ transform: [{ rotate: projectsOpen ? '0deg' : '180deg' }] }}>
                    <Icon name="chevronDown" size={18} color={Night.muted} />
                  </View>
                </Pressable>
              </View>
            </View>

            {projectsOpen
              ? projects.map((project, index) => (
                  <MenuRow
                    key={project.id}
                    label={project.name}
                    dot={DOTS[index % DOTS.length]}
                    onPress={() => router.push({ pathname: '/tasks', params: { project: project.name } })}
                  />
                ))
              : null}

            <MenuRow icon="help" label={text.helpResources} onPress={() => router.push('/about')} />
            <MenuRow
              icon="calendar"
              label={connecting ? text.googleCalendar : text.connectGoogle}
              onPress={() => void connectCalendar()}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function MenuRow({
  icon,
  label,
  dot,
  onPress,
}: {
  icon?: IconName;
  label: string;
  dot?: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
      {icon ? <Icon name={icon} size={18} color={Night.accent} /> : null}
      <Text style={styles.rowLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function confirmCalendarAccess() {
  const text = getCopy();
  return new Promise<boolean>((resolve) => {
    Alert.alert(
      text.googleCalendar,
      text.googleConsent,
      [
        { text: text.notNow, style: 'cancel', onPress: () => resolve(false) },
        { text: text.confirm, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 32,
    height: 32,
  },
  avatarLetter: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: 700,
  },
  name: {
    flex: 1,
    color: Night.text,
    fontSize: 18,
    fontWeight: 700,
  },
  search: {
    marginTop: 18,
    height: 48,
    borderRadius: 12,
    backgroundColor: Night.row,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    color: Night.text,
    fontSize: 16,
    fontWeight: 600,
    paddingVertical: 0,
  },
  sectionHead: {
    marginTop: 26,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: Night.text,
    fontSize: 20,
    fontWeight: 700,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  row: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: Night.row,
    marginTop: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowLabel: {
    flex: 1,
    color: Night.text,
    fontSize: 16,
    fontWeight: 600,
  },
  results: {
    marginTop: 16,
    gap: 8,
  },
  result: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: Night.row,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  resultTitle: {
    color: Night.text,
    fontSize: 16,
    fontWeight: 600,
  },
  resultMeta: {
    marginTop: 2,
    color: Night.muted,
    fontSize: 13,
    fontWeight: 500,
  },
  emptySearch: {
    color: Night.muted,
    fontSize: 15,
    fontWeight: 600,
  },
  pressed: {
    opacity: 0.8,
  },
});
