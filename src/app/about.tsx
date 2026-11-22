import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Screen, useNightStatus } from '@/components/screen';
import { Night } from '@/constants/night';
import { useCopy } from '@/lib/settings-copy';

export default function AboutScreen() {
  useNightStatus();
  const insets = useSafeAreaInsets();
  const text = useCopy();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const iosBuild = Constants.platform?.ios?.buildNumber;
  const androidBuild = Constants.platform?.android?.versionCode;
  const build = iosBuild || (androidBuild ? String(androidBuild) : '');

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

        <Text style={styles.version}>Shughuli {version}</Text>
        {build ? <Text style={styles.build}>({build})</Text> : null}

        <View style={styles.card}>
          <AboutRow label={text.viewChangelog} onPress={() => openDoc('changelog')} last />
        </View>

        <View style={styles.card}>
          <AboutRow label={text.visitSite} onPress={() => openDoc('website')} />
          <AboutRow label={text.visitInspiration} onPress={() => openDoc('inspiration')} />
          <AboutRow label={text.weAreHiring} onPress={() => openDoc('hiring')} last />
        </View>

        <Text style={styles.section}>{text.legalSection}</Text>
        <View style={styles.card}>
          <AboutRow label={text.acknowledgments} onPress={() => openDoc('licenses')} />
          <AboutRow label={text.privacyPolicy} onPress={() => openDoc('privacy')} />
          <AboutRow label={text.securityPolicy} onPress={() => openDoc('security')} />
          <AboutRow label={text.termsOfService} onPress={() => openDoc('terms')} last />
        </View>
      </ScrollView>
    </Screen>
  );
}

function openDoc(doc: string) {
  router.push({ pathname: '/legal', params: { doc } });
}

function AboutRow({ label, onPress, last = false }: { label: string; onPress: () => void; last?: boolean }) {
  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <Text style={styles.rowLabel} numberOfLines={1}>
          {label}
        </Text>
        <Icon name="chevron" size={16} color={Night.faint} />
      </Pressable>
      {last ? null : <View style={styles.line} />}
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
  version: {
    marginTop: 28,
    color: Night.text,
    fontSize: 17,
    fontWeight: 600,
    textAlign: 'center',
  },
  build: {
    marginTop: 4,
    color: Night.muted,
    fontSize: 15,
    fontWeight: 500,
    textAlign: 'center',
  },
  card: {
    marginTop: 22,
    borderRadius: 16,
    backgroundColor: Night.row,
    overflow: 'hidden',
  },
  section: {
    marginTop: 26,
    marginBottom: -8,
    marginLeft: 4,
    color: Night.muted,
    fontSize: 16,
    fontWeight: 600,
  },
  row: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  pressed: {
    opacity: 0.72,
  },
});
