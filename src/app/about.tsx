import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Screen, useNightStatus } from '@/components/screen';
import { Night } from '@/constants/night';
import { fill } from '@/i18n/translate';
import { useCopy } from '@/lib/settings-copy';

export default function AboutScreen() {
  useNightStatus();
  const insets = useSafeAreaInsets();
  const text = useCopy();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const iosBuild = Constants.platform?.ios?.buildNumber;
  const androidBuild = Constants.platform?.android?.versionCode;
  const build = iosBuild || (androidBuild ? String(androidBuild) : '');
  const versionLabel = fill(text.releaseVersion, { version }) + (build ? ` (${build})` : '');

  const principles: { icon: IconName; title: string; body: string }[] = [
    { icon: 'sun', title: text.aboutDayTitle, body: text.aboutDayBody },
    { icon: 'storage', title: text.aboutDeviceTitle, body: text.aboutDeviceBody },
    { icon: 'alarm', title: text.aboutRemindersTitle, body: text.aboutRemindersBody },
    { icon: 'download', title: text.aboutCopyTitle, body: text.aboutCopyBody },
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
          <Text style={styles.title}>{text.aboutRow}</Text>
          <View style={styles.backSpacer} />
        </View>

        <View style={styles.hero}>
          <View style={styles.logoGlow}>
            <Image source={require('../../assets/shughuli.png')} style={styles.logo} />
          </View>
          <Text style={styles.name}>Shughuli</Text>
          {/* <Text style={styles.meaning}>{text.aboutMeaning}</Text> */}
          <View style={styles.versionPill}>
            <Text style={styles.versionText}>{versionLabel}</Text>
          </View>
        </View>

        <Text style={styles.section}>{text.aboutShughuli}</Text>
        <View style={styles.card}>
          {principles.map((item, index) => (
            <View key={item.title}>
              <View style={styles.principle}>
                <View style={styles.badge}>
                  <Icon name={item.icon} size={18} color={Night.accent} />
                </View>
                <View style={styles.principleCopy}>
                  <Text style={styles.principleTitle}>{item.title}</Text>
                  <Text style={styles.principleBody}>{item.body}</Text>
                </View>
              </View>
              {index === principles.length - 1 ? null : <View style={styles.line} />}
            </View>
          ))}
        </View>

        <View style={[styles.card, styles.gap]}>
          <AboutRow icon="globe" label={text.visitSite} onPress={() => openDoc('website')} />
          <AboutRow icon="sparkles" label={text.visitInspiration} onPress={() => openDoc('inspiration')} />
          <AboutRow icon="briefcase" label={text.weAreHiring} onPress={() => openDoc('hiring')} last />
        </View>

        <Text style={styles.section}>{text.legalSection}</Text>
        <View style={styles.card}>
          <AboutRow icon="star" label={text.acknowledgments} onPress={() => openDoc('licenses')} />
          <AboutRow icon="lock" label={text.privacyPolicy} onPress={() => openDoc('privacy')} />
          <AboutRow icon="shield" label={text.securityPolicy} onPress={() => openDoc('security')} />
          <AboutRow icon="doc" label={text.termsOfService} onPress={() => openDoc('terms')} last />
        </View>
      </ScrollView>
    </Screen>
  );
}

function openDoc(doc: string) {
  router.push({ pathname: '/legal', params: { doc } });
}

function AboutRow({ icon, label, onPress, last = false }: { icon: IconName; label: string; onPress: () => void; last?: boolean }) {
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
    color: Night.text,
    fontSize: 17,
    fontWeight: 700,
  },
  hero: {
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  logoGlow: {
    padding: 6,
    borderRadius: 38,
    backgroundColor: Night.accentSoft,
  },
  logo: {
    width: 104,
    height: 104,
    borderRadius: 32,
  },
  name: {
    marginTop: 18,
    color: Night.text,
    fontSize: 30,
    fontWeight: 800,
    letterSpacing: 0.3,
  },
  meaning: {
    marginTop: 8,
    color: Night.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  versionPill: {
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Night.row,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Night.line,
  },
  versionText: {
    color: Night.text,
    fontSize: 13,
    fontWeight: 600,
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
  card: {
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: Night.row,
    overflow: 'hidden',
  },
  gap: {
    marginTop: 18,
  },
  principle: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  principleCopy: {
    flex: 1,
    gap: 4,
  },
  principleTitle: {
    color: Night.text,
    fontSize: 16,
    fontWeight: 700,
  },
  principleBody: {
    color: Night.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Night.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rowLabel: {
    flex: 1,
    color: Night.text,
    fontSize: 16,
    fontWeight: 500,
  },
  line: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
    backgroundColor: '#3A3A3A',
  },
  rowLine: {
    marginLeft: 66,
  },
  pressed: {
    opacity: 0.72,
  },
});
