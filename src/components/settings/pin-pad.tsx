import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSettingsTheme } from '@/hooks/use-settings-theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

export function PinPad({
  title,
  subtitle,
  error,
  onSubmit,
  onBiometric,
  biometricLabel,
}: {
  title: string;
  subtitle: string;
  error?: string;
  onSubmit: (pin: string) => void;
  onBiometric?: () => void;
  biometricLabel?: string;
}) {
  const { colors, scale, accent } = useSettingsTheme();
  const [pin, setPin] = useState('');

  function press(key: string) {
    if (key === 'del') {
      setPin((current) => current.slice(0, -1));
      return;
    }
    if (key === '' || pin.length >= 4) return;
    const next = `${pin}${key}`;
    setPin(next);
    if (next.length === 4) onSubmit(next);
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.ink, fontSize: 28 * scale }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.muted, fontSize: 15 * scale }]}>{subtitle}</Text>
      <View style={styles.dots}>
        {Array.from({ length: 4 }, (_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { borderColor: colors.ink, backgroundColor: index < pin.length ? accent.color : 'transparent' },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.error, { color: colors.danger, fontSize: 13 * scale }]}>{error ?? ' '}</Text>
      <View style={styles.grid}>
        {KEYS.map((key) => (
          <Pressable
            key={key || 'blank'}
            accessibilityRole="button"
            accessibilityLabel={key === 'del' ? 'Delete' : key}
            disabled={key === ''}
            onPress={() => press(key)}
            style={({ pressed }) => [
              styles.key,
              { backgroundColor: key === '' ? 'transparent' : colors.icon },
              pressed && key !== '' && styles.pressed,
            ]}>
            <Text style={{ color: colors.ink, fontSize: 22 * scale, fontWeight: 700 }}>{key === 'del' ? '⌫' : key}</Text>
          </Pressable>
        ))}
      </View>
      {onBiometric && biometricLabel ? (
        <Pressable accessibilityRole="button" onPress={onBiometric} style={styles.biometric}>
          <Text style={{ color: colors.ink, fontSize: 15 * scale, fontWeight: 700 }}>{biometricLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  title: {
    fontWeight: 700,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  dots: {
    marginTop: 22,
    flexDirection: 'row',
    gap: 14,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  error: {
    minHeight: 20,
    marginTop: 12,
    fontWeight: 600,
  },
  grid: {
    marginTop: 12,
    width: 276,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  key: {
    width: 84,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  biometric: {
    marginTop: 18,
    padding: 10,
  },
});
