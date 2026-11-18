import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Layout } from '@/constants/palette';
import { useScreenStatusBar, useSettingsTheme } from '@/hooks/use-settings-theme';
import { useCopy } from '@/lib/settings-copy';

export default function LegalScreen() {
  const insets = useSafeAreaInsets();
  const theme = useSettingsTheme();
  const text = useCopy();
  const params = useLocalSearchParams<{ doc?: string }>();
  const terms = params.doc === 'terms';
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
          <Text style={[styles.title, { color: theme.colors.ink, fontSize: 28 * theme.scale }]}>
            {terms ? text.terms : text.privacyPolicy}
          </Text>
        </View>
        <Text style={[styles.body, { color: theme.colors.ink, fontSize: 16 * theme.scale, lineHeight: 24 * theme.scale }]}>
          {terms ? text.termsBody : text.privacyBody}
        </Text>
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
    flex: 1,
    fontWeight: 700,
    letterSpacing: -0.6,
  },
  body: {
    marginTop: 20,
  },
});
