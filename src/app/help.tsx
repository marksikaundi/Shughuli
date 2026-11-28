import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Screen, useNightStatus } from '@/components/screen';
import { Night } from '@/constants/night';
import { openPlayReviews } from '@/lib/play-update';
import { useCopy } from '@/lib/settings-copy';

export default function HelpScreen() {
  useNightStatus();
  const insets = useSafeAreaInsets();
  const text = useCopy();
  const [open, setOpen] = useState<number | null>(0);
  const answers = [
    { q: text.helpQ1, a: text.helpA1 },
    { q: text.helpQ2, a: text.helpA2 },
    { q: text.helpQ3, a: text.helpA3 },
    { q: text.helpQ4, a: text.helpA4 },
    { q: text.helpQ5, a: text.helpA5 },
  ];

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
          <Text style={styles.title} numberOfLines={1}>
            {text.helpFeedback}
          </Text>
          <View style={styles.backSpacer} />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Icon name="help" size={30} color={Night.accent} />
          </View>
          <Text style={styles.heroTitle}>{text.helpHeroTitle}</Text>
          <Text style={styles.heroBody}>{text.helpHeroBody}</Text>
        </View>

        <Text style={styles.section}>{text.helpAnswersSection}</Text>
        <View style={styles.card}>
          {answers.map((item, index) => {
            const expanded = open === index;
            return (
              <View key={item.q}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  onPress={() => setOpen(expanded ? null : index)}
                  style={({ pressed }) => [styles.question, pressed && styles.pressed]}>
                  <Text style={styles.questionText}>{item.q}</Text>
                  <Icon name={expanded ? 'chevronDown' : 'chevron'} size={16} color={expanded ? Night.accent : Night.faint} />
                </Pressable>
                {expanded ? <Text style={styles.answer}>{item.a}</Text> : null}
                {index === answers.length - 1 ? null : <View style={styles.line} />}
              </View>
            );
          })}
        </View>

        {Platform.OS === 'android' ? (
          <View style={[styles.card, styles.playCard]}>
            <View style={styles.play}>
              <Text style={styles.playTitle}>{text.helpPlayTitle}</Text>
              <Text style={styles.playBody}>{text.helpPlayBody}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={text.helpPlayReview}
                onPress={() => void openPlayReviews().catch(() => undefined)}
                style={({ pressed }) => [styles.review, pressed && styles.pressed]}>
                <Icon name="starFill" size={18} color={Night.accent} />
                <Text style={styles.reviewText}>{text.helpPlayReview}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Text style={styles.section}>{text.helpMoreSection}</Text>
        <View style={styles.card}>
          <LinkRow
            icon="alarm"
            label={text.remindersNotWorking}
            onPress={() => router.push({ pathname: '/settings/productivity', params: { part: 'reminders' } })}
          />
          <LinkRow icon="lock" label={text.privacyPolicy} onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })} last />
        </View>
      </ScrollView>
    </Screen>
  );
}

function LinkRow({ icon, label, onPress, last = false }: { icon: IconName; label: string; onPress: () => void; last?: boolean }) {
  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <View style={styles.badge}>
          <Icon name={icon} size={18} color={Night.accent} />
        </View>
        <Text style={styles.rowLabel} numberOfLines={1}>
          {label}
        </Text>
        <Icon name="chevron" size={16} color={Night.faint} />
      </Pressable>
      {last ? null : <View style={[styles.line, styles.rowLine]} />}
    </View>
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
  heroBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Night.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    marginTop: 16,
    color: Night.text,
    fontSize: 26,
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
  section: {
    marginTop: 28,
    marginLeft: 4,
    color: Night.muted,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  card: {
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: Night.row,
    overflow: 'hidden',
  },
  question: {
    minHeight: 56,
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    color: Night.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  line: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
    backgroundColor: '#3A3A3A',
  },
  rowLine: {
    marginLeft: 66,
  },
  playCard: {
    marginTop: 28,
  },
  play: {
    padding: 16,
    gap: 10,
  },
  playBody: {
    color: Night.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  playTitle: {
    color: Night.text,
    fontSize: 17,
    fontWeight: 700,
  },
  review: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: Night.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reviewText: {
    color: Night.accent,
    fontSize: 16,
    fontWeight: 700,
  },
  row: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Night.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    color: Night.text,
    fontSize: 16,
    fontWeight: 500,
  },
  pressed: {
    opacity: 0.72,
  },
});
