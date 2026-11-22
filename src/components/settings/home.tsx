import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Night } from '@/constants/night';
import { Layout } from '@/constants/palette';
import { usePreferencesStore } from '@/store/preferences';

export function SettingsHome({ onClose }: { onClose?: () => void }) {
  const insets = useSafeAreaInsets();
  const displayName = usePreferencesStore((state) => state.prefs.displayName).trim();
  const hello = displayName ? `Hello, ${displayName}` : 'Hello';

  return (
    <Screen tone="night">
      <View
        style={[
          styles.page,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + Layout.tabClearance,
          },
        ]}>
        {onClose ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.check}>
            <Icon name="check" size={16} color={Night.text} />
          </Pressable>
        ) : (
          <View style={styles.checkSpacer} />
        )}
        <View style={styles.center}>
          <Text style={styles.hello}>{hello}</Text>
          <Text style={styles.welcome}>welcome to</Text>
          <Text style={styles.brand}>Shughuli</Text>
          <View style={styles.rule} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 28,
  },
  check: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Night.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSpacer: {
    height: 36,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 48,
  },
  hello: {
    color: Night.text,
    fontSize: 44,
    fontWeight: 700,
    letterSpacing: -1.2,
    textAlign: 'center',
  },
  welcome: {
    marginTop: 14,
    color: Night.muted,
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: -0.2,
  },
  brand: {
    marginTop: 4,
    color: Night.text,
    fontSize: 36,
    fontWeight: 700,
    letterSpacing: -1,
  },
  rule: {
    marginTop: 22,
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Night.accent,
  },
});
