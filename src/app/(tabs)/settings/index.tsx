import * as Device from 'expo-device';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Screen } from '@/components/screen';
import { settingsStyles, useSave } from '@/components/settings/page';
import { ACCENTS } from '@/data/preferences';
import { Layout, cardShadow } from '@/constants/palette';
import { useScreenStatusBar, useSettingsTheme } from '@/hooks/use-settings-theme';
import { chooseAvatar, removeAvatar } from '@/lib/device-data';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useSettingsTheme();
  const text = useCopy();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();
  const [avatarOpen, setAvatarOpen] = useState(false);
  useScreenStatusBar(theme.dark);
  const deviceName = runningDeviceName(text.thisDevice);
  const letter = deviceName.trim().charAt(0).toUpperCase() || 'S';
  const destinations: { icon: IconName; label: string; note: string; href: '/settings/appearance' | '/settings/productivity' | '/settings/focus' | '/settings/privacy' | '/settings/data' | '/about' }[] = [
    { icon: 'palette', label: text.appearance, note: text.appearanceNote, href: '/settings/appearance' },
    { icon: 'done', label: text.productivity, note: text.productivityNote, href: '/settings/productivity' },
    { icon: 'timer', label: text.focus, note: text.focusNote, href: '/settings/focus' },
    { icon: 'shield', label: text.privacy, note: text.privacyNote, href: '/settings/privacy' },
    { icon: 'storage', label: text.data, note: text.dataNote, href: '/settings/data' },
    { icon: 'info', label: text.about, note: text.aboutNote, href: '/about' },
  ];

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
        <Text style={[styles.title, { color: theme.colors.ink, fontSize: 34 * theme.scale }]}>{text.settings}</Text>

        <View style={[styles.profile, { backgroundColor: theme.colors.card }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text.avatar}
            onPress={() => setAvatarOpen(true)}
            style={[styles.avatar, { backgroundColor: ACCENTS.find((item) => item.id === prefs.avatarColor)?.color ?? '#5B8DEF' }]}>
            {prefs.avatarUri ? (
              <Image source={{ uri: prefs.avatarUri }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Text style={styles.avatarLetter}>{letter}</Text>
            )}
          </Pressable>
          <View style={styles.profileCopy}>
            <Text numberOfLines={2} style={[styles.name, { color: theme.colors.ink, fontSize: 22 * theme.scale }]}>
              {deviceName}
            </Text>
            <Text style={[styles.kicker, { color: theme.colors.muted, fontSize: 14 * theme.scale }]}>{text.onDevice}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {destinations.map((item) => (
            <View key={item.href} style={styles.cell}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => router.push(item.href)}
                style={({ pressed }) => [styles.destination, { backgroundColor: theme.colors.card }, pressed && styles.pressed]}>
                <View style={[styles.mark, { backgroundColor: theme.colors.icon }]}>
                  <Icon name={item.icon} size={20} color={theme.colors.ink} />
                </View>
                <Text style={[styles.destinationTitle, { color: theme.colors.ink, fontSize: 16 * theme.scale }]}>{item.label}</Text>
                <Text numberOfLines={3} style={[styles.destinationNote, { color: theme.colors.muted, fontSize: 13 * theme.scale, lineHeight: 18 * theme.scale }]}>{item.note}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={avatarOpen} transparent animationType="fade" onRequestClose={() => setAvatarOpen(false)}>
        <Pressable style={[settingsStyles.overlay, { backgroundColor: theme.colors.overlay }]} onPress={() => setAvatarOpen(false)}>
          <Pressable style={[settingsStyles.sheet, { backgroundColor: theme.colors.card }]} onPress={() => undefined}>
            <Text style={[settingsStyles.sheetTitle, { color: theme.colors.ink, fontSize: 18 * theme.scale }]}>{text.avatar}</Text>
            <View style={settingsStyles.dots}>
              {ACCENTS.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => void save({ avatarColor: item.id })}
                  style={[settingsStyles.dot, { backgroundColor: item.color }, prefs.avatarColor === item.id && { borderColor: theme.colors.ink }]}
                />
              ))}
            </View>
            <Pressable
              style={settingsStyles.backupRow}
              onPress={() => {
                void chooseAvatar()
                  .then((uri) => {
                    if (uri) void save({ avatarUri: uri });
                  })
                  .catch(() => Alert.alert(text.avatar, text.photoFailed));
              }}>
              <Text style={{ color: theme.colors.ink, fontWeight: 700 }}>{text.choosePhoto}</Text>
            </Pressable>
            {prefs.avatarUri ? (
              <Pressable
                style={settingsStyles.backupRow}
                onPress={() => {
                  void removeAvatar().catch(() => Alert.alert(text.avatar, text.photoFailed));
                }}>
                <Text style={{ color: theme.colors.danger, fontWeight: 700 }}>{text.removePhoto}</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => setAvatarOpen(false)} style={settingsStyles.backupRow}>
              <Text style={{ color: theme.colors.muted, fontWeight: 700 }}>{text.close}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function runningDeviceName(fallback: string) {
  const name = Device.deviceName?.trim();
  if (name) return name;
  const model = [Device.manufacturer, Device.modelName].filter((part) => part?.trim()).join(' ');
  if (model) return model;
  const os = Device.osName?.trim();
  if (os) return os;
  return fallback;
}

const styles = StyleSheet.create({
  title: {
    fontWeight: 700,
    letterSpacing: -0.8,
  },
  profile: {
    marginTop: 20,
    borderRadius: 28,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...cardShadow,
  },
  profileCopy: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontWeight: 700,
    letterSpacing: -0.4,
  },
  kicker: {
    fontWeight: 600,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 72,
    height: 72,
  },
  avatarLetter: {
    fontSize: 28,
    fontWeight: 700,
    color: '#161616',
  },
  grid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  cell: {
    width: '50%',
    padding: 6,
  },
  destination: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
    ...cardShadow,
  },
  mark: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  destinationTitle: {
    fontWeight: 700,
    letterSpacing: -0.2,
  },
  destinationNote: {
    fontWeight: 500,
  },
  pressed: {
    opacity: 0.86,
  },
});
