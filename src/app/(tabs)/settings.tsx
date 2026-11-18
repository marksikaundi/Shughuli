import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Layout, Palette, cardShadow } from '@/constants/palette';
import { useTasks } from '@/data/tasks';
import { countSavedNotes } from '@/lib/notes';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { tasks } = useTasks();
  const open = tasks.filter((task) => task.status !== 'done' && task.kind === 'task').length;
  const meetings = tasks.filter((task) => task.kind === 'meeting').length;
  const notes = countSavedNotes();
  const rows: { icon: IconName; label: string; value: string }[] = [
    { icon: 'bell', label: 'Reminders', value: Platform.OS === 'web' ? 'On this device' : 'Local only' },
    { icon: 'folder', label: 'Notes', value: notes == null ? 'On this device' : `${notes} saved` },
    { icon: 'clock', label: 'Focus hours', value: '9:00 – 1:00' },
  ];

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + Layout.tabClearance,
          paddingHorizontal: Layout.padding,
        }}>
        <Text style={styles.kicker}>On this device</Text>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.stats}>
          <Stat value={String(open)} label="Open tasks" />
          <Stat value={String(meetings)} label="Meetings" />
          <Stat value="72%" label="This week" />
        </View>

        <View style={styles.card}>
          {rows.map((row, index) => (
            <View key={row.label} style={[styles.row, index < rows.length - 1 && styles.rowBorder]}>
              <View style={styles.rowIcon}>
                <Icon name={row.icon} size={16} color={Palette.ink} />
              </View>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  stats: {
    marginTop: 22,
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    flex: 1,
    backgroundColor: Palette.white,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    ...cardShadow,
  },
  statValue: {
    color: Palette.ink,
    fontSize: 18,
    fontWeight: 700,
  },
  statLabel: {
    marginTop: 2,
    color: Palette.muted,
    fontSize: 12,
    fontWeight: 600,
  },
  card: {
    marginTop: 16,
    backgroundColor: Palette.white,
    borderRadius: 24,
    ...cardShadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.line,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F6F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    color: Palette.ink,
    fontSize: 15,
    fontWeight: 600,
  },
  rowValue: {
    color: Palette.muted,
    fontSize: 14,
  },
});
