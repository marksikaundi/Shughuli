import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Night } from '@/constants/night';
import { Layout } from '@/constants/palette';
import {
  calendarAccessGranted,
  connectGoogleCalendar,
  pullGoogleEvents,
  readCalendarLink,
  stampCalendarSync,
  syncAllTasks,
} from '@/lib/google-calendar';
import { fill, getCopy, useCopy } from '@/lib/settings-copy';
import { useTaskStore } from '@/store/tasks';

export function SettingsHome({ onClose }: { onClose?: () => void }) {
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const [connecting, setConnecting] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    void readCalendarLink().then((link) => setSyncedAt(link?.syncedAt ?? null));
  }, []);

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
      setSyncedAt(await stampCalendarSync());
    } catch (error) {
      Alert.alert(text.googleCalendar, error instanceof Error ? error.message : text.googleConnectFailed);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <Screen tone="night">
      <ScrollView
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

        <View style={styles.card}>
          <SettingRow icon="settings" label={text.general} onPress={() => router.push('/settings/appearance')} />
          <SettingRow icon="calendar" label={text.tabCalendar} onPress={() => void connectCalendar()} last />
        </View>

        <Text style={styles.section}>{text.personalization}</Text>
        <View style={styles.card}>
          <SettingRow icon="palette" label={text.theme} value="Shughuli" onPress={() => router.push('/settings/appearance')} />
          <SettingRow icon="appIcon" label={text.appIcon} value="Shughuli" onPress={() => openItem('appIcon')} />
          <SettingRow icon="list" label={text.navigation} onPress={() => openItem('navigation')} />
          <SettingRow icon="plusBox" label={text.quickAdd} onPress={() => openItem('quickAdd')} last />
        </View>

        <Text style={styles.section}>{text.productivity}</Text>
        <View style={styles.card}>
          <SettingRow icon="trend" label={text.productivity} onPress={() => router.push('/settings/productivity')} />
          <SettingRow icon="alarm" label={text.reminders} onPress={() => router.push('/settings/productivity')} />
          <SettingRow icon="bell" label={text.notificationRow} onPress={() => router.push('/settings/productivity')} last />
        </View>

        <View style={styles.card}>
          <SettingRow icon="wave" mark={<SiriMark />} label={text.siri} onPress={() => openItem('siri')} last />
        </View>

        <View style={styles.card}>
          <SettingRow icon="help" label={text.helpFeedback} onPress={() => router.push('/about')} />
          <SettingRow icon="info" label={text.aboutRow} onPress={() => router.push('/about')} />
          <SettingRow icon="gift" label={text.whatsNew} onPress={() => openItem('whatsNew')} />
          <SettingRow
            icon="sync"
            label={text.sync}
            note={fill(text.lastSuccessfulSync, { when: syncedAt ? timeAgo(syncedAt, text) : text.never })}
            onPress={() => void connectCalendar()}
            last
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function openItem(id: 'appIcon' | 'navigation' | 'quickAdd' | 'siri' | 'whatsNew') {
  router.push({ pathname: '/settings/item', params: { id } });
}

function timeAgo(iso: string, text: ReturnType<typeof useCopy>) {
  const elapsed = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(elapsed) || elapsed < 0) return text.syncJustNow;
  const minutes = Math.round(elapsed / 60000);
  if (minutes < 1) return text.syncJustNow;
  if (minutes < 60) return fill(minutes === 1 ? text.syncMinuteAgo : text.syncMinutesAgo, { count: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return fill(hours === 1 ? text.syncHourAgo : text.syncHoursAgo, { count: hours });
  const days = Math.round(hours / 24);
  return fill(days === 1 ? text.syncDayAgo : text.syncDaysAgo, { count: days });
}

function SiriMark() {
  return (
    <View style={styles.siri}>
      <View style={[styles.blob, styles.blobA]} />
      <View style={[styles.blob, styles.blobB]} />
      <View style={[styles.blob, styles.blobC]} />
    </View>
  );
}

function SettingRow({
  icon,
  mark,
  label,
  value,
  note,
  onPress,
  last = false,
}: {
  icon: IconName;
  mark?: ReactNode;
  label: string;
  value?: string;
  note?: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        {mark ?? <Icon name={icon} size={22} color={Night.accent} />}
        <View style={styles.rowText}>
          <Text style={styles.rowLabel} numberOfLines={1}>
            {label}
          </Text>
          {note ? (
            <Text style={styles.rowNote} numberOfLines={2}>
              {note}
            </Text>
          ) : null}
        </View>
        {value ? (
          <Text style={styles.rowValue} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
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
  card: {
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: Night.row,
    overflow: 'hidden',
  },
  section: {
    marginTop: 26,
    marginBottom: -6,
    marginLeft: 4,
    color: Night.muted,
    fontSize: 16,
    fontWeight: 700,
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
  rowText: {
    flex: 1,
  },
  rowLabel: {
    color: Night.text,
    fontSize: 16,
    fontWeight: 600,
  },
  rowNote: {
    marginTop: 2,
    color: Night.faint,
    fontSize: 12,
    fontWeight: 500,
  },
  siri: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: '#141414',
  },
  blob: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  blobA: {
    backgroundColor: '#7B61FF',
    top: -2,
    left: -1,
  },
  blobB: {
    backgroundColor: '#3DDCFF',
    bottom: -3,
    left: 2,
  },
  blobC: {
    backgroundColor: '#FF5A7A',
    top: 4,
    right: -3,
  },
  rowValue: {
    maxWidth: 120,
    color: Night.muted,
    fontSize: 16,
    fontWeight: 500,
  },
  pressed: {
    opacity: 0.72,
  },
});
