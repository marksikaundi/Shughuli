import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '@/components/screen';
import { SettingsRow, SettingsSection, TextPrompt } from '@/components/settings/controls';
import { settingsStyles, useSave } from '@/components/settings/page';
import { ACCENTS } from '@/data/preferences';
import { Layout } from '@/constants/palette';
import { useScreenStatusBar, useSettingsTheme } from '@/hooks/use-settings-theme';
import { chooseAvatar, removeAvatar } from '@/lib/device-data';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';
import { useTaskStore } from '@/store/tasks';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useSettingsTheme();
  const text = useCopy();
  const prefs = usePreferencesStore((state) => state.prefs);
  const tasks = useTaskStore((state) => state.tasks.filter((task) => task.kind === 'task').length);
  const save = useSave();
  const [nameOpen, setNameOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  useScreenStatusBar(theme.dark);
  const letter = prefs.displayName.trim().charAt(0).toUpperCase() || 'S';
  const themeLabel = prefs.theme === 'dark' ? text.themeDark : prefs.theme === 'system' ? text.themeSystem : text.themeLight;
  const timeoutLabel =
    prefs.lockTimeout === 0 ? text.immediately : prefs.lockTimeout === 5 ? text.afterFive : prefs.lockTimeout === 15 ? text.afterFifteen : text.afterMinute;

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
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.kicker, { color: theme.colors.muted, fontSize: 13 * theme.scale }]}>{text.onDevice}</Text>
            <Text style={[styles.title, { color: theme.colors.ink, fontSize: 34 * theme.scale }]}>{text.settings}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={text.displayName} onPress={() => setNameOpen(true)}>
              <Text style={[styles.name, { color: theme.colors.muted, fontSize: 15 * theme.scale }]}>{prefs.displayName || text.yourName}</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text.avatar}
            onPress={() => setAvatarOpen(true)}
            style={[styles.avatar, { backgroundColor: ACCENTS.find((item) => item.id === prefs.avatarColor)?.color ?? '#C8F06E' }]}>
            {prefs.avatarUri ? (
              <Image source={{ uri: prefs.avatarUri }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Text style={styles.avatarLetter}>{letter}</Text>
            )}
          </Pressable>
        </View>

        <SettingsSection>
          <SettingsRow icon="palette" label={text.appearance} value={themeLabel} onPress={() => router.push('/settings/appearance')} />
          <SettingsRow
            icon="done"
            label={text.productivity}
            value={prefs.weekStartsOn === 'sunday' ? text.sunday : text.monday}
            onPress={() => router.push('/settings/productivity')}
          />
          <SettingsRow icon="timer" label={text.focus} value={`${prefs.workMinutes} ${text.minutes}`} onPress={() => router.push('/settings/focus')} />
          <SettingsRow
            icon="shield"
            label={text.privacy}
            value={prefs.appLockEnabled ? timeoutLabel : undefined}
            onPress={() => router.push('/settings/privacy')}
          />
          <SettingsRow icon="storage" label={text.data} value={String(tasks)} onPress={() => router.push('/settings/data')} />
          <SettingsRow icon="info" label={text.about} onPress={() => router.push('/about')} border={false} />
        </SettingsSection>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerCopy: {
    flex: 1,
  },
  kicker: {
    fontWeight: 600,
  },
  title: {
    marginTop: 4,
    fontWeight: 700,
    letterSpacing: -0.8,
  },
  name: {
    marginTop: 4,
    fontWeight: 600,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 64,
    height: 64,
  },
  avatarLetter: {
    fontSize: 26,
    fontWeight: 700,
    color: '#161616',
  },
});
