import { router } from 'expo-router';
import { useState } from 'react';
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
  syncAllTasks,
} from '@/lib/google-calendar';
import { getCopy, useCopy } from '@/lib/settings-copy';
import { useTaskStore } from '@/store/tasks';

export function SettingsHome({ onClose }: { onClose?: () => void }) {
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const [connecting, setConnecting] = useState(false);

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
          <SettingRow icon="help" label={text.helpFeedback} onPress={() => router.push('/about')} />
          <SettingRow icon="info" label={text.aboutRow} onPress={() => router.push('/about')} />
          <SettingRow icon="gift" label={text.whatsNew} onPress={() => openItem('whatsNew')} last />
        </View>
      </ScrollView>
    </Screen>
  );
}

function openItem(id: 'appIcon' | 'navigation' | 'quickAdd' | 'whatsNew') {
  router.push({ pathname: '/settings/item', params: { id } });
}

function SettingRow({
  icon,
  label,
  value,
  onPress,
  last = false,
}: {
  icon: IconName;
  label: string;
  value?: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <Icon name={icon} size={22} color={Night.accent} />
        <Text style={styles.rowLabel} numberOfLines={1}>
          {label}
        </Text>
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
  rowLabel: {
    flex: 1,
    color: Night.text,
    fontSize: 16,
    fontWeight: 600,
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
