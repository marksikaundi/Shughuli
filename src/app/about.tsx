import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

import { IconButton } from '@/components/icon';
import { Screen } from '@/components/screen';
import { SettingsRow, SettingsSection } from '@/components/settings/controls';
import { Layout } from '@/constants/palette';
import { useScreenStatusBar, useSettingsTheme } from '@/hooks/use-settings-theme';
import { useCopy } from '@/lib/settings-copy';

const LICENSES = [
  ['Expo', 'MIT'],
  ['React', 'MIT'],
  ['React Native', 'MIT'],
  ['Expo Router', 'MIT'],
  ['Drizzle ORM', 'Apache-2.0'],
  ['Zustand', 'MIT'],
  ['expo-sqlite', 'MIT'],
  ['expo-notifications', 'MIT'],
  ['expo-secure-store', 'MIT'],
] as const;

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const theme = useSettingsTheme();
  const text = useCopy();
  const [feedback, setFeedback] = useState('');
  const [open, setOpen] = useState(false);
  useScreenStatusBar(theme.dark);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen>
      {theme.dark ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.canvas }]} /> : null}
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: Layout.padding,
        }}>
        <View style={styles.header}>
          <IconButton icon="back" accessibilityLabel={text.close} onPress={() => router.back()} />
          <Text style={[styles.title, { color: theme.colors.ink, fontSize: 28 * theme.scale }]}>{text.about}</Text>
        </View>
        <Text style={[styles.body, { color: theme.colors.muted, fontSize: 15 * theme.scale }]}>{text.aboutBody}</Text>
        <SettingsSection title={text.version}>
          <SettingsRow icon="info" label="Shughuli" value={version} border={false} />
        </SettingsSection>
        <SettingsSection title={text.features}>
          {[text.featureTasks, text.featureCalendar, text.featureNotes, text.featureReminders, text.featureBackup].map((item, index, list) => (
            <View key={item} style={[styles.feature, index < list.length - 1 && { borderBottomColor: theme.colors.line, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <Text style={{ color: theme.colors.ink, fontSize: 15 * theme.scale, fontWeight: 600 }}>{item}</Text>
            </View>
          ))}
        </SettingsSection>
        <SettingsSection title={text.licenses} footer={text.licensesIntro}>
          {LICENSES.map(([name, license], index) => (
            <SettingsRow key={name} icon="doc" label={name} value={license} border={index < LICENSES.length - 1} />
          ))}
        </SettingsSection>
        <SettingsSection title={text.about}>
          <SettingsRow icon="star" label={text.rate} onPress={() => Alert.alert(text.rate, text.rateBody)} />
          <SettingsRow icon="share" label={text.feedback} border={false} onPress={() => setOpen(true)} />
        </SettingsSection>
        {open ? (
          <View style={[styles.feedback, { backgroundColor: theme.colors.card }]}>
            <TextInput
              value={feedback}
              onChangeText={setFeedback}
              placeholder={text.feedbackPlaceholder}
              placeholderTextColor={theme.colors.faint}
              multiline
              style={[styles.input, { color: theme.colors.ink, fontSize: 16 * theme.scale }]}
            />
            <View style={styles.actions}>
              <Pressable onPress={() => setOpen(false)}>
                <Text style={{ color: theme.colors.muted, fontWeight: 700 }}>{text.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const message = feedback.trim();
                  if (!message) return;
                  void Share.share({ title: 'Shughuli', message: `Shughuli feedback\n\n${message}` }).finally(() => {
                    setFeedback('');
                    setOpen(false);
                  });
                }}>
                <Text style={{ color: theme.colors.ink, fontWeight: 700 }}>{text.send}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontWeight: 700,
    letterSpacing: -0.6,
  },
  body: {
    marginTop: 16,
    lineHeight: 22,
  },
  feature: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  feedback: {
    marginTop: 16,
    borderRadius: 24,
    padding: 16,
  },
  input: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  actions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 18,
  },
});
