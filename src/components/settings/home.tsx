import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Screen } from '@/components/screen';
import { settingsStyles, useSave } from '@/components/settings/page';
import { Night } from '@/constants/night';
import { Layout } from '@/constants/palette';
import { ACCENTS, accentById } from '@/data/preferences';
import { useProjects } from '@/data/projects';
import { useTasks } from '@/data/tasks';
import {
  calendarAccessGranted,
  connectGoogleCalendar,
  pullGoogleEvents,
  readCalendarLink,
  syncAllTasks,
} from '@/lib/google-calendar';
import { chooseAvatar, removeAvatar } from '@/lib/device-data';
import { getCopy, useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';
import { useTaskStore } from '@/store/tasks';

const DOTS = ['#E15B52', '#5B8DEF', '#C8F06E', '#E7A23A', '#A78BDB'];

export function SettingsHome({ onClose }: { onClose?: () => void }) {
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const [query, setQuery] = useState('');
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const themeLabel = prefs.theme === 'dark' ? text.themeDark : prefs.theme === 'system' ? text.themeSystem : text.themeLight;
  const letter = (prefs.displayName.trim() || 'S').charAt(0).toUpperCase();
  const avatarColor = accentById(prefs.avatarColor).color;
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
          paddingHorizontal: 16,
        }}>
        <View style={styles.header}>
          <View style={styles.side} />
          <Text style={styles.title}>{text.settings}</Text>
          {onClose ? (
            <Pressable accessibilityRole="button" accessibilityLabel={text.save} onPress={onClose} style={styles.check}>
              <Icon name="check" size={16} color={Night.text} />
            </Pressable>
          ) : (
            <View style={styles.side} />
          )}
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
              <Pressable key={project.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/tasks', params: { project: project.name } })} style={styles.result}>
                <Text style={styles.resultTitle}>{project.name}</Text>
              </Pressable>
            ))}
            {matches.map((task) => (
              <Pressable key={task.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/add-task', params: { id: task.id } })} style={styles.result}>
                <Text style={styles.resultTitle}>{task.title}</Text>
                {task.project.trim() ? <Text style={styles.resultMeta}>{task.project}</Text> : null}
              </Pressable>
            ))}
            {projectMatches.length === 0 && matches.length === 0 ? <Text style={styles.emptySearch}>{text.noTasksYet}</Text> : null}
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <SettingRow icon="personCircle" label={text.avatar} onPress={() => setAvatarOpen(true)} />
              <SettingRow icon="calendar" label={connecting ? text.googleCalendar : text.connectGoogle} onPress={() => void connectCalendar()} last />
            </View>

            <Text style={styles.section}>{text.personal}</Text>
            <View style={styles.card}>
              <SettingRow icon="palette" label={text.appearance} value={themeLabel} onPress={() => router.push('/settings/appearance')} last />
            </View>

            <Text style={styles.section}>{text.productivity}</Text>
            <View style={styles.card}>
              <SettingRow icon="done" label={text.productivity} onPress={() => router.push('/settings/productivity')} />
              <SettingRow icon="alarm" label={text.reminders} onPress={() => router.push('/settings/productivity')} />
              <SettingRow icon="bell" label={text.notifications} onPress={() => router.push('/settings/productivity')} />
              <SettingRow icon="timer" label={text.focus} onPress={() => router.push('/settings/focus')} last />
            </View>

            <View style={[styles.card, styles.cardGap]}>
              <SettingRow icon="shield" label={text.privacy} onPress={() => router.push('/settings/privacy')} />
              <SettingRow icon="storage" label={text.data} onPress={() => router.push('/settings/data')} />
              <SettingRow icon="help" label={text.helpResources} onPress={() => router.push('/about')} />
              <SettingRow icon="info" label={text.about} onPress={() => router.push('/about')} last />
            </View>

            <View style={styles.sectionHead}>
              <Text style={styles.section}>{text.myProjects}</Text>
              <View style={styles.sectionActions}>
                <Pressable accessibilityRole="button" accessibilityLabel={text.addProject} hitSlop={8} onPress={() => router.push('/add-project')}>
                  <Icon name="plus" size={20} color={Night.muted} />
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityState={{ expanded: projectsOpen }} hitSlop={8} onPress={() => setProjectsOpen((open) => !open)}>
                  <View style={{ transform: [{ rotate: projectsOpen ? '0deg' : '180deg' }] }}>
                    <Icon name="chevronDown" size={18} color={Night.muted} />
                  </View>
                </Pressable>
              </View>
            </View>
            {projectsOpen && projects.length > 0 ? (
              <View style={styles.card}>
                {projects.map((project, index) => (
                  <SettingRow
                    key={project.id}
                    dot={DOTS[index % DOTS.length]}
                    label={project.name}
                    last={index === projects.length - 1}
                    onPress={() => router.push({ pathname: '/tasks', params: { project: project.name } })}
                  />
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <Modal visible={avatarOpen} transparent animationType="fade" onRequestClose={() => setAvatarOpen(false)}>
        <Pressable style={[settingsStyles.overlay, styles.overlay]} onPress={() => setAvatarOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>{text.avatar}</Text>
            <View style={settingsStyles.dots}>
              {ACCENTS.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => void save({ avatarColor: item.id })}
                  style={[settingsStyles.dot, { backgroundColor: item.color }, prefs.avatarColor === item.id && styles.dotOn]}
                />
              ))}
            </View>
            <View style={styles.avatarPreview}>
              <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                {prefs.avatarUri ? <Image source={{ uri: prefs.avatarUri }} style={styles.avatarImage} contentFit="cover" /> : <Text style={styles.avatarLetter}>{letter}</Text>}
              </View>
            </View>
            <Pressable
              style={styles.sheetRow}
              onPress={() => {
                void chooseAvatar()
                  .then((uri) => {
                    if (uri) void save({ avatarUri: uri });
                  })
                  .catch(() => Alert.alert(text.avatar, text.photoFailed));
              }}>
              <Text style={styles.sheetText}>{text.choosePhoto}</Text>
            </Pressable>
            {prefs.avatarUri ? (
              <Pressable
                style={styles.sheetRow}
                onPress={() => {
                  void removeAvatar().catch(() => Alert.alert(text.avatar, text.photoFailed));
                }}>
                <Text style={styles.sheetDanger}>{text.removePhoto}</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => setAvatarOpen(false)} style={styles.sheetRow}>
              <Text style={styles.sheetMuted}>{text.close}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function SettingRow({
  icon,
  dot,
  label,
  value,
  onPress,
  last = false,
}: {
  icon?: IconName;
  dot?: string;
  label: string;
  value?: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        {icon ? <Icon name={icon} size={22} color={Night.accent} /> : <View style={[styles.projectDot, { backgroundColor: dot }]} />}
        <Text style={styles.rowLabel} numberOfLines={1}>
          {label}
        </Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        <Icon name="chevron" size={16} color={Night.faint} />
      </Pressable>
      {last ? null : <View style={styles.rowLine} />}
    </View>
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
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: {
    width: 36,
  },
  title: {
    color: Night.text,
    fontSize: 17,
    fontWeight: 700,
  },
  check: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Night.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    marginTop: 14,
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
  card: {
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    overflow: 'hidden',
  },
  cardGap: {
    marginTop: 22,
  },
  section: {
    marginTop: 22,
    marginBottom: -6,
    color: Night.muted,
    fontSize: 16,
    fontWeight: 700,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 22,
  },
  row: {
    minHeight: 54,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rowLine: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 50,
    backgroundColor: '#3A3A3A',
  },
  rowLabel: {
    flex: 1,
    color: Night.text,
    fontSize: 16,
    fontWeight: 600,
  },
  rowValue: {
    color: Night.muted,
    fontSize: 15,
    fontWeight: 600,
  },
  projectDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  pressed: {
    opacity: 0.72,
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
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#2A2A2A',
    paddingTop: 18,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  sheetTitle: {
    color: Night.text,
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 8,
  },
  dotOn: {
    borderColor: Night.text,
  },
  avatarPreview: {
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
  },
  avatarLetter: {
    color: '#161616',
    fontSize: 22,
    fontWeight: 700,
  },
  sheetRow: {
    minHeight: 48,
    justifyContent: 'center',
  },
  sheetText: {
    color: Night.text,
    fontWeight: 700,
  },
  sheetDanger: {
    color: Night.accent,
    fontWeight: 700,
  },
  sheetMuted: {
    color: Night.muted,
    fontWeight: 700,
  },
});
