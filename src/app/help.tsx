import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Screen, useNightStatus } from '@/components/screen';
import { Night } from '@/constants/night';
import { openPlayStore } from '@/lib/play-update';
import { useCopy } from '@/lib/settings-copy';

export default function HelpScreen() {
  useNightStatus();
  const insets = useSafeAreaInsets();
  const text = useCopy();
  const [open, setOpen] = useState<number | null>(0);
  const [message, setMessage] = useState('');
  const ready = message.trim().length > 0;

  const answers = [
    { q: text.helpQ1, a: text.helpA1 },
    { q: text.helpQ2, a: text.helpA2 },
    { q: text.helpQ3, a: text.helpA3 },
    { q: text.helpQ4, a: text.helpA4 },
    { q: text.helpQ5, a: text.helpA5 },
  ];

  async function sendFeedback() {
    if (!ready) return;
    const version = Constants.expoConfig?.version ?? '1.0.0';
    const build = Constants.platform?.ios?.buildNumber ?? Constants.platform?.android?.versionCode;
    const details = `Shughuli ${version}${build ? ` (${build})` : ''}\n${Platform.OS} ${Platform.Version}`;
    try {
      const result = await Share.share({ title: text.feedback, message: `${message.trim()}\n\n--\n${details}` });
      if (result.action === Share.sharedAction) setMessage('');
    } catch {
      // The share sheet was closed or is not available. The message stays so it is not lost.
    }
  }

  return (
    <Screen tone="night">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
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

        <Text style={styles.section}>{text.helpFeedbackSection}</Text>
        <View style={styles.card}>
          <View style={styles.feedback}>
            <Text style={styles.feedbackBody}>{text.helpFeedbackBody}</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={text.feedbackPlaceholder}
              placeholderTextColor={Night.faint}
              multiline
              textAlignVertical="top"
              style={styles.input}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={text.feedback}
              accessibilityState={{ disabled: !ready }}
              disabled={!ready}
              onPress={() => void sendFeedback()}
              style={({ pressed }) => [styles.send, !ready && styles.sendIdle, pressed && styles.pressed]}>
              <Icon name="share" size={18} color="#FFFFFF" />
              <Text style={styles.sendText}>{text.feedback}</Text>
            </Pressable>
            <Text style={styles.note}>{text.helpFeedbackNote}</Text>
          </View>
        </View>

        <Text style={styles.section}>{text.helpMoreSection}</Text>
        <View style={styles.card}>
          <LinkRow
            icon="alarm"
            label={text.remindersNotWorking}
            onPress={() => router.push({ pathname: '/settings/productivity', params: { part: 'reminders' } })}
          />
          {Platform.OS === 'android' ? <LinkRow icon="star" label={text.rate} onPress={() => void openPlayStore()} /> : null}
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
  feedback: {
    padding: 16,
    gap: 12,
  },
  feedbackBody: {
    color: Night.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  input: {
    minHeight: 110,
    maxHeight: 220,
    borderRadius: 14,
    backgroundColor: Night.bg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Night.text,
    fontSize: 16,
    lineHeight: 22,
  },
  send: {
    minHeight: 50,
    borderRadius: 15,
    backgroundColor: Night.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendIdle: {
    opacity: 0.4,
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 700,
  },
  note: {
    color: Night.faint,
    fontSize: 13,
    lineHeight: 19,
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
