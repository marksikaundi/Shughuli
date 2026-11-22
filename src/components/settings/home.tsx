import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Screen } from '@/components/screen';
import { settingsStyles, useSave } from '@/components/settings/page';
import { Night } from '@/constants/night';
import { Layout } from '@/constants/palette';
import { ACCENTS, accentById } from '@/data/preferences';
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

export function SettingsHome({ onClose }: { onClose?: () => void }) {
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();
  const [connecting, setConnecting] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const themeLabel = prefs.theme === 'dark' ? text.themeDark : prefs.theme === 'system' ? text.themeSystem : text.themeLight;
  const letter = (prefs.displayName.trim() || 'S').charAt(0).toUpperCase();
  const avatarColor = accentById(prefs.avatarColor).color;

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
          <SettingRow icon="palette" label={text.theme} value={themeLabel} onPress={() => router.push('/settings/appearance')} />
          <SettingRow icon="personCircle" label={text.avatar} onPress={() => setAvatarOpen(true)} last />
        </View>

        <Text style={styles.section}>{text.productivity}</Text>
        <View style={styles.card}>
          <SettingRow icon="arrow" label={text.productivity} onPress={() => router.push('/settings/productivity')} />
          <SettingRow icon="alarm" label={text.reminders} onPress={() => router.push('/settings/productivity')} />
          <SettingRow icon="bell" label={text.notifications} onPress={() => router.push('/settings/productivity')} />
          <SettingRow icon="timer" label={text.focus} onPress={() => router.push('/settings/focus')} last />
        </View>

        <View style={styles.card}>
          <SettingRow icon="shield" label={text.privacy} onPress={() => router.push('/settings/privacy')} />
          <SettingRow icon="storage" label={text.data} onPress={() => router.push('/settings/data')} />
          <SettingRow icon="help" label={text.helpFeedback} onPress={() => router.push('/about')} />
          <SettingRow icon="info" label={text.about} onPress={() => router.push('/about')} last />
        </View>
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
    backgroundColor: '#2A2A2A',
    overflow: 'hidden',
  },
  section: {
    marginTop: 26,
    marginBottom: -8,
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
    fontSize: 15,
    fontWeight: 600,
  },
  pressed: {
    opacity: 0.72,
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
