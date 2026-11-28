import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Screen, useNightStatus } from '@/components/screen';
import { Night } from '@/constants/night';
import { en, type SettingsCopy } from '@/i18n/messages';
import { getCatalogId, useCopy } from '@/lib/settings-copy';

type Block = { title?: string; body: string };

export default function LegalScreen() {
  useNightStatus();
  const insets = useSafeAreaInsets();
  const text = useCopy();
  const params = useLocalSearchParams<{ doc?: string }>();
  const doc = typeof params.doc === 'string' ? params.doc : 'privacy';
  const page = pageFor(doc, text);
  const english = pageFor(doc, en);
  const showingEnglish = getCatalogId() !== 'en' && page.blocks.map((block) => block.body).join('\n') === english.blocks.map((block) => block.body).join('\n');

  return (
    <Screen tone="night">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 36,
          paddingHorizontal: 16,
        }}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={text.close} onPress={() => router.back()} style={styles.back}>
            <Icon name="back" size={18} color={Night.text} />
          </Pressable>
          <Text style={styles.title} numberOfLines={2}>
            {page.title}
          </Text>
          <View style={styles.backSpacer} />
        </View>

        {showingEnglish ? <Text style={styles.note}>{text.legalEnglishNote}</Text> : null}

        {page.blocks.map((block) => (
          <View key={block.title ?? block.body.slice(0, 24)} style={styles.card}>
            {block.title ? <Text style={styles.cardTitle}>{block.title}</Text> : null}
            <Text style={styles.body}>{block.body}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

function pageFor(doc: string, text: SettingsCopy): { title: string; blocks: Block[] } {
  if (doc === 'terms') return { title: text.termsOfService, blocks: [{ body: text.termsBody }] };
  if (doc === 'security') return { title: text.securityPolicy, blocks: [{ body: text.securityBody }] };
  if (doc === 'licenses') return { title: text.acknowledgments, blocks: [{ body: text.licensesIntro }] };
  if (doc === 'website') return { title: text.visitSite, blocks: [{ body: text.websiteBody }] };
  if (doc === 'hiring') return { title: text.weAreHiring, blocks: [{ body: text.hiringBody }] };
  return { title: text.privacyPolicy, blocks: [{ body: text.privacyBody }] };
}

const styles = StyleSheet.create({
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3A3A3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
    width: 36,
    height: 36,
  },
  title: {
    flex: 1,
    color: Night.text,
    fontSize: 17,
    fontWeight: 700,
    textAlign: 'center',
  },
  note: {
    marginTop: 18,
    color: Night.muted,
    fontSize: 14,
    fontWeight: 600,
    textAlign: 'center',
  },
  card: {
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: Night.row,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  cardTitle: {
    marginBottom: 6,
    color: Night.text,
    fontSize: 16,
    fontWeight: 700,
  },
  body: {
    color: Night.text,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
});
