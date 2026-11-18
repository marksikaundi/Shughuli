import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

import { IconButton } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Layout, cardShadow } from '@/constants/palette';
import { useScreenStatusBar, useSettingsTheme } from '@/hooks/use-settings-theme';
import { useCopy } from '@/lib/settings-copy';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const theme = useSettingsTheme();
  const text = useCopy();
  useScreenStatusBar(theme.dark);
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const sections = [
    { title: text.aboutDayTitle, body: text.aboutDayBody },
    { title: text.aboutDeviceTitle, body: text.aboutDeviceBody },
    { title: text.aboutRemindersTitle, body: text.aboutRemindersBody },
    { title: text.aboutCopyTitle, body: text.aboutCopyBody },
  ];

  return (
    <Screen>
      {theme.dark ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.canvas }]} /> : null}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 36,
          paddingHorizontal: Layout.padding,
        }}>
        <IconButton icon="back" accessibilityLabel={text.close} onPress={() => router.back()} />
        <Text style={[styles.name, { color: theme.colors.ink, fontSize: 40 * theme.scale }]}>Shughuli</Text>
        <Text style={[styles.meaning, { color: theme.colors.ink, fontSize: 17 * theme.scale, lineHeight: 24 * theme.scale }]}>{text.aboutMeaning}</Text>
        <Text style={[styles.lead, { color: theme.colors.muted, fontSize: 16 * theme.scale, lineHeight: 24 * theme.scale }]}>{text.aboutBody}</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          {sections.map((section, index) => (
            <View
              key={section.title}
              style={[
                styles.section,
                index < sections.length - 1 && { borderBottomColor: theme.colors.line, borderBottomWidth: StyleSheet.hairlineWidth },
              ]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.ink, fontSize: 16 * theme.scale }]}>{section.title}</Text>
              <Text style={[styles.sectionBody, { color: theme.colors.muted, fontSize: 15 * theme.scale, lineHeight: 22 * theme.scale }]}>{section.body}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.version, { color: theme.colors.faint, fontSize: 13 * theme.scale }]}>
          {text.version} {version}
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: {
    marginTop: 28,
    fontWeight: 700,
    letterSpacing: -1.2,
  },
  meaning: {
    marginTop: 14,
    fontWeight: 600,
  },
  lead: {
    marginTop: 10,
  },
  card: {
    marginTop: 28,
    borderRadius: 24,
    ...cardShadow,
  },
  section: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontWeight: 700,
  },
  sectionBody: {
    marginTop: 4,
  },
  version: {
    marginTop: 22,
    fontWeight: 600,
  },
});
