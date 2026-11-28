import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Screen, useNightStatus } from '@/components/screen';
import { Night } from '@/constants/night';
import { useCopy } from '@/lib/settings-copy';

export default function InspirationScreen() {
  useNightStatus();
  const insets = useSafeAreaInsets();
  const text = useCopy();

  const reminders = [
    { title: text.inspirationOneTitle, body: text.inspirationOneBody },
    { title: text.inspirationTwoTitle, body: text.inspirationTwoBody },
    { title: text.inspirationThreeTitle, body: text.inspirationThreeBody },
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
            {text.visitInspiration}
          </Text>
          <View style={styles.backSpacer} />
        </View>

        <View style={styles.hero}>
          <Text style={[styles.sparkle, styles.sparkleLeft]}>✦</Text>
          <Text style={[styles.sparkle, styles.sparkleRight]}>✧</Text>
          <Text style={[styles.sparkle, styles.sparkleLow]}>✦</Text>
          <Text style={styles.word}>Shughuli</Text>
          <View style={styles.rule} />
          <Text style={styles.meaning}>{text.aboutMeaning}</Text>
          <Text style={styles.lead}>{text.inspirationLead}</Text>
        </View>

        <Text style={styles.section}>{text.inspirationSection}</Text>
        <View style={styles.list}>
          {reminders.map((item, index) => (
            <View key={item.title} style={styles.reminder}>
              <Text style={styles.number}>{index + 1}</Text>
              <View style={styles.reminderCopy}>
                <Text style={styles.reminderTitle}>{item.title}</Text>
                <Text style={styles.reminderBody}>{item.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.about}>
          <Icon name="sparkles" size={18} color={Night.accent} />
          <Text style={styles.aboutBody}>{text.aboutBody}</Text>
        </View>
      </ScrollView>
    </Screen>
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
    marginTop: 18,
    borderRadius: 28,
    backgroundColor: Night.accentSoft,
    paddingHorizontal: 24,
    paddingTop: 44,
    paddingBottom: 32,
    alignItems: 'center',
    overflow: 'hidden',
  },
  sparkle: {
    position: 'absolute',
    color: Night.accent,
  },
  sparkleLeft: {
    left: 22,
    top: 20,
    fontSize: 20,
  },
  sparkleRight: {
    right: 26,
    top: 34,
    fontSize: 16,
  },
  sparkleLow: {
    right: 40,
    bottom: 22,
    fontSize: 12,
  },
  word: {
    color: Night.text,
    fontSize: 46,
    fontWeight: 800,
    letterSpacing: 0.5,
  },
  rule: {
    marginTop: 14,
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: Night.accent,
  },
  meaning: {
    marginTop: 18,
    color: Night.text,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: 500,
    textAlign: 'center',
  },
  lead: {
    marginTop: 14,
    color: Night.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  section: {
    marginTop: 30,
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
  reminder: {
    borderRadius: 18,
    backgroundColor: Night.row,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  number: {
    width: 36,
    textAlign: 'center',
    color: Night.accent,
    fontSize: 32,
    fontWeight: 800,
  },
  reminderCopy: {
    flex: 1,
    gap: 4,
  },
  reminderTitle: {
    color: Night.text,
    fontSize: 16,
    fontWeight: 700,
  },
  reminderBody: {
    color: Night.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  about: {
    marginTop: 22,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  aboutBody: {
    flex: 1,
    color: Night.faint,
    fontSize: 14,
    lineHeight: 21,
  },
});
