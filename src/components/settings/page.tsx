import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Layout } from '@/constants/palette';
import type { Preferences } from '@/data/preferences';
import { formatClock, formatDate } from '@/data/model';
import { useScreenStatusBar, useSettingsTheme } from '@/hooks/use-settings-theme';
import { ensureReminderPermission } from '@/lib/reminders';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

export function SettingsPage({ title, children }: { title: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const theme = useSettingsTheme();
  const text = useCopy();
  useScreenStatusBar(theme.dark);

  return (
    <Screen>
      {theme.dark ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.canvas }]} /> : null}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + Layout.tabClearance,
          paddingHorizontal: Layout.padding,
        }}>
        <View style={styles.pageHeader}>
          <IconButton icon="back" accessibilityLabel={text.close} onPress={() => router.back()} />
          <Text style={[styles.pageTitle, { color: theme.colors.ink, fontSize: 28 * theme.scale }]}>{title}</Text>
        </View>
        {children}
      </ScrollView>
    </Screen>
  );
}

export function useSave() {
  const update = usePreferencesStore((state) => state.update);
  const text = useCopy();
  return async (patch: Partial<Preferences>) => {
    try {
      await update(patch);
    } catch {
      Alert.alert(text.settings, text.couldNotSave);
    }
  };
}

type ReminderKey = 'taskReminders' | 'habitReminders' | 'dailyPlanning' | 'focusNotifications' | 'endOfDayReview' | 'notificationVibration';

export function useReminderToggle() {
  const save = useSave();
  const text = useCopy();

  return async (key: ReminderKey, value: boolean) => {
    const needsPermission = value && key !== 'notificationVibration';
    if (needsPermission && Platform.OS !== 'web') {
      const allowed = await ensureReminderPermission();
      if (!allowed) {
        Alert.alert(text.notifications, text.permissionDenied);
        return;
      }
    }
    if (key === 'notificationVibration' && value && Platform.OS !== 'web') Vibration.vibrate(20);
    await save({ [key]: value });
  };
}

export function Stat({ value, label }: { value: string; label: string }) {
  const theme = useSettingsTheme();
  return (
    <View style={[settingsStyles.stat, { backgroundColor: theme.colors.icon }]}>
      <Text style={[settingsStyles.statValue, { color: theme.colors.ink, fontSize: 16 * theme.scale }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[settingsStyles.statLabel, { color: theme.colors.muted, fontSize: 12 * theme.scale }]}>{label}</Text>
    </View>
  );
}

export function formatWhen(iso: string | null, never: string) {
  if (!iso) return never;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return never;
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return `${formatDate(date)} ${formatClock(time)}`;
}

export function clockMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

export function minutesToClock(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export const settingsStyles = StyleSheet.create({
  block: {
    paddingTop: 16,
  },
  blockLabel: {
    marginLeft: 16,
    marginBottom: 8,
    fontWeight: 700,
  },
  dots: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  soundLabel: {
    marginLeft: 16,
    marginTop: 4,
    marginBottom: -4,
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  stat: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 700,
  },
  statLabel: {
    marginTop: 2,
    fontWeight: 600,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  sheetTitle: {
    fontWeight: 700,
    marginBottom: 8,
  },
  backupRow: {
    minHeight: 48,
    justifyContent: 'center',
  },
  pinScreen: {
    flex: 1,
  },
  pinClose: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 2,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pageTitle: {
    flex: 1,
    fontWeight: 700,
    letterSpacing: -0.6,
  },
});
