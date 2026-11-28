import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Screen, useNightStatus } from '@/components/screen';
import { Night } from '@/constants/night';
import { fill } from '@/i18n/translate';
import { openPlayReviews } from '@/lib/play-update';
import { useCopy } from '@/lib/settings-copy';

export default function HelpScreen() {
  useNightStatus();
  const insets = useSafeAreaInsets();
  const text = useCopy();
  const [open, setOpen] = useState<number | null>(0);
  const [query, setQuery] = useState('');
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const answers: { icon: IconName; q: string; a: string }[] = [
    { icon: 'plus', q: text.helpQ1, a: text.helpA1 },
    { icon: 'alarm', q: text.helpQ2, a: text.helpA2 },
    { icon: 'storage', q: text.helpQ3, a: text.helpA3 },
    { icon: 'calendar', q: text.helpQ4, a: text.helpA4 },
    { icon: 'palette', q: text.helpQ5, a: text.helpA5 },
  ];
  const needle = query.trim().toLowerCase();
  const searching = needle.length > 0;
  const results = answers
    .map((item, index) => ({ ...item, index }))
    .filter((item) => !searching || item.q.toLowerCase().includes(needle) || item.a.toLowerCase().includes(needle));

  return (
    <Screen tone="night">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 36,
          paddingHorizontal: 16,
        }}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={text.close} onPress={() => router.back()} style={styles.back}>
            <Icon name="back" size={18} color={Night.text} />
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {text.helpFeedback}
          </Text>
          <View style={styles.backSpacer} />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroGlow}>
            <View style={styles.heroBadge}>
              <Icon name="help" size={32} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.heroTitle}>{text.helpHeroTitle}</Text>
          <Text style={styles.heroBody}>{text.helpHeroBody}</Text>
        </View>

        <View style={styles.search}>
          <Icon name="search" size={18} color={Night.faint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={text.helpSearch}
            placeholderTextColor={Night.faint}
            selectionColor={Night.accent}
            returnKeyType="search"
            autoCorrect={false}
            style={styles.searchInput}
          />
          {searching ? (
            <Pressable accessibilityRole="button" accessibilityLabel={text.close} hitSlop={10} onPress={() => setQuery('')}>
              <Icon name="close" size={16} color={Night.muted} />
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.section}>{text.helpAnswersSection}</Text>
        {results.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="search" size={22} color={Night.faint} />
            <Text style={styles.emptyTitle}>{text.helpNoResults}</Text>
            <Text style={styles.emptyBody}>{text.helpNoResultsBody}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {results.map((item) => {
              const expanded = searching || open === item.index;
              return (
                <View key={item.q} style={[styles.card, expanded && styles.cardOpen]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    onPress={() => setOpen(open === item.index ? null : item.index)}
                    style={({ pressed }) => [styles.question, pressed && styles.pressed]}>
                    <View style={[styles.badge, expanded && styles.badgeOpen]}>
                      <Icon name={item.icon} size={18} color={expanded ? '#FFFFFF' : Night.accent} />
                    </View>
                    <Text style={styles.questionText}>{item.q}</Text>
                    <Icon name={expanded ? 'chevronDown' : 'chevron'} size={16} color={expanded ? Night.accent : Night.faint} />
                  </Pressable>
                  {expanded ? <Text style={styles.answer}>{item.a}</Text> : null}
                </View>
              );
            })}
          </View>
        )}

        {searching ? null : (
          <>
            <Text style={styles.section}>{text.helpMoreSection}</Text>
            <View style={styles.tiles}>
              <Tile
                icon="alarm"
                label={text.remindersNotWorking}
                onPress={() => router.push({ pathname: '/settings/productivity', params: { part: 'reminders' } })}
              />
              <Tile icon="lock" label={text.privacyPolicy} onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })} />
            </View>

            {Platform.OS === 'android' ? (
              <View style={styles.play}>
                <View style={styles.stars}>
                  {[0, 1, 2, 3, 4].map((star) => (
                    <Icon key={star} name="starFill" size={22} color="#FFFFFF" />
                  ))}
                </View>
                <Text style={styles.playTitle}>{text.helpPlayTitle}</Text>
                <Text style={styles.playBody}>{text.helpPlayBody}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={text.helpPlayReview}
                  onPress={() => void openPlayReviews().catch(() => undefined)}
                  style={({ pressed }) => [styles.review, pressed && styles.pressed]}>
                  <Text style={styles.reviewText}>{text.helpPlayReview}</Text>
                  <Icon name="arrow" size={16} color={Night.accent} />
                </Pressable>
              </View>
            ) : null}

            <Text style={styles.footer}>Shughuli · {fill(text.releaseVersion, { version })}</Text>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Tile({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      <View style={styles.badge}>
        <Icon name={icon} size={18} color={Night.accent} />
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
      <View style={styles.tileArrow}>
        <Icon name="arrow" size={14} color={Night.faint} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
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
  hero: {
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  heroGlow: {
    padding: 8,
    borderRadius: 44,
    backgroundColor: Night.accentSoft,
  },
  heroBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Night.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    marginTop: 16,
    color: Night.text,
    fontSize: 28,
    fontWeight: 800,
    textAlign: 'center',
  },
  heroBody: {
    marginTop: 8,
    color: Night.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  search: {
    marginTop: 24,
    minHeight: 50,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: Night.row,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    color: Night.text,
    fontSize: 16,
    paddingVertical: 0,
  },
  section: {
    marginTop: 28,
    marginLeft: 4,
    color: Night.muted,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  list: {
    marginTop: 10,
    gap: 10,
  },
  card: {
    borderRadius: 18,
    backgroundColor: Night.row,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardOpen: {
    borderColor: Night.accentSoft,
  },
  question: {
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  questionText: {
    flex: 1,
    color: Night.text,
    fontSize: 16,
    fontWeight: 600,
  },
  answer: {
    paddingLeft: 62,
    paddingRight: 18,
    paddingBottom: 18,
    color: Night.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Night.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOpen: {
    backgroundColor: Night.accent,
  },
  empty: {
    marginTop: 10,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 18,
    backgroundColor: Night.row,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: Night.text,
    fontSize: 16,
    fontWeight: 700,
  },
  emptyBody: {
    color: Night.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  tiles: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    minHeight: 124,
    padding: 16,
    borderRadius: 18,
    backgroundColor: Night.row,
    gap: 12,
  },
  tileLabel: {
    color: Night.text,
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 20,
  },
  tileArrow: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  play: {
    marginTop: 18,
    padding: 20,
    borderRadius: 22,
    backgroundColor: Night.accent,
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    gap: 4,
  },
  playTitle: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 800,
    textAlign: 'center',
  },
  playBody: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  review: {
    marginTop: 18,
    minHeight: 50,
    paddingHorizontal: 22,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
  },
  reviewText: {
    color: Night.accent,
    fontSize: 16,
    fontWeight: 800,
  },
  footer: {
    marginTop: 28,
    color: Night.faint,
    fontSize: 13,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
});
