import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Screen } from '@/components/screen';
import { TextPrompt } from '@/components/settings/controls';
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
  const [nameOpen, setNameOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  useScreenStatusBar(theme.dark);
  const letter = prefs.displayName.trim().charAt(0).toUpperCase() || 'S';
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
            <Pressable accessibilityRole="button" accessibilityLabel={text.displayName} onPress={() => setNameOpen(true)}>
              <Text style={[styles.name, { color: theme.colors.ink, fontSize: 22 * theme.scale }]}>{prefs.displayName || text.yourName}</Text>
            </Pressable>
            <Text style={[styles.kicker, { color: theme.colors.muted, fontSize: 14 * theme.scale }]}>{text.onDevice}</Text>
          </View>
        </View>

        <View style={styles.list}>
          {destinations.map((item) => (
            <Pressable
              key={item.href}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => router.push(item.href)}
              style={({ pressed }) => [styles.destination, { backgroundColor: theme.colors.card }, pressed && styles.pressed]}>
              <View style={[styles.mark, { backgroundColor: theme.colors.icon }]}>
                <Icon name={item.icon} size={20} color={theme.colors.ink} />
              </View>
              <View style={styles.destinationCopy}>
                <Text style={[styles.destinationTitle, { color: theme.colors.ink, fontSize: 17 * theme.scale }]}>{item.label}</Text>
                <Text style={[styles.destinationNote, { color: theme.colors.muted, fontSize: 13 * theme.scale, lineHeight: 18 * theme.scale }]}>{item.note}</Text>
              </View>
              <Icon name="chevron" size={16} color={theme.colors.faint} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <TextPrompt
        visible={nameOpen}
        title={text.displayName}
        initial={prefs.displayName}
        placeholder={text.namePlaceholder}
        onClose={() => setNameOpen(false)}
        onSave={(displayName) => {
          setNameOpen(false);
          void save({ displayName });
        }}
      />
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
  list: {
    marginTop: 18,
    gap: 10,
  },
  destination: {
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...cardShadow,
  },
  mark: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationCopy: {
    flex: 1,
    gap: 2,
  },
  destinationTitle: {
    fontWeight: 700,
  },
  destinationNote: {
    fontWeight: 500,
  },
  pressed: {
    opacity: 0.86,
  },
});
