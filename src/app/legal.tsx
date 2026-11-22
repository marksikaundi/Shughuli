import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Layout } from '@/constants/palette';
import { useScreenStatusBar, useSettingsTheme } from '@/hooks/use-settings-theme';
import { en, type SettingsCopy } from '@/i18n/messages';
import { getCatalogId, useCopy } from '@/lib/settings-copy';

export default function LegalScreen() {
  const insets = useSafeAreaInsets();
  const theme = useSettingsTheme();
  const text = useCopy();
  const params = useLocalSearchParams<{ doc?: string }>();
  const page = pageFor(typeof params.doc === 'string' ? params.doc : 'privacy', text);
  const english = pageFor(typeof params.doc === 'string' ? params.doc : 'privacy', en);
  const showingEnglish = getCatalogId() !== 'en' && page.body === english.body;
  useScreenStatusBar(theme.dark);

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
          <Text style={[styles.title, { color: theme.colors.ink, fontSize: 28 * theme.scale }]}>{page.title}</Text>
        </View>
        {showingEnglish ? (
          <Text style={[styles.note, { color: theme.colors.muted, fontSize: 14 * theme.scale }]}>{text.legalEnglishNote}</Text>
        ) : null}
        <Text style={[styles.body, { color: theme.colors.ink, fontSize: 16 * theme.scale, lineHeight: 24 * theme.scale }]}>{page.body}</Text>
      </ScrollView>
    </Screen>
  );
}

function pageFor(doc: string, text: SettingsCopy) {
  if (doc === 'terms') return { title: text.terms, body: text.termsBody };
  if (doc === 'security') return { title: text.securityPolicy, body: text.securityBody };
  if (doc === 'licenses') return { title: text.acknowledgments, body: text.licensesIntro };
  if (doc === 'changelog') return { title: text.viewChangelog, body: changelog(text) };
  if (doc === 'website') return { title: text.visitSite, body: text.websiteBody };
  if (doc === 'inspiration') return { title: text.visitInspiration, body: `${text.aboutMeaning}\n\n${text.aboutBody}` };
  if (doc === 'hiring') return { title: text.weAreHiring, body: text.hiringBody };
  return { title: text.privacyPolicy, body: text.privacyBody };
}

function changelog(text: SettingsCopy) {
  return [
    text.whatsNewBody,
    text.aboutMeaning,
    text.aboutBody,
    `${text.aboutDayTitle}\n${text.aboutDayBody}`,
    `${text.aboutDeviceTitle}\n${text.aboutDeviceBody}`,
    `${text.aboutRemindersTitle}\n${text.aboutRemindersBody}`,
    `${text.aboutCopyTitle}\n${text.aboutCopyBody}`,
  ].join('\n\n');
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    flex: 1,
    fontWeight: 700,
    letterSpacing: -0.6,
  },
  note: {
    marginTop: 16,
    fontWeight: 600,
  },
  body: {
    marginTop: 12,
  },
});
