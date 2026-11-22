import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Screen, useNightStatus } from '@/components/screen';
import { Night } from '@/constants/night';
import { Layout } from '@/constants/palette';
import { useCopy } from '@/lib/settings-copy';

export function NightPage({ title, children, onBack }: { title: string; children: ReactNode; onBack?: () => void }) {
  useNightStatus();
  const insets = useSafeAreaInsets();
  const text = useCopy();

  return (
    <Screen tone="night">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + Layout.tabClearance,
          paddingHorizontal: 16,
        }}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={text.close} onPress={() => (onBack ? onBack() : router.back())} style={styles.back}>
            <Icon name="back" size={18} color={Night.text} />
          </Pressable>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.backSpacer} />
        </View>
        {children}
      </ScrollView>
    </Screen>
  );
}

export function NightCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function NightSwitch({
  label,
  value,
  onChange,
  last = false,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  last?: boolean;
}) {
  return (
    <View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Switch
          accessibilityLabel={label}
          value={value}
          onValueChange={onChange}
          trackColor={{ false: '#3A3A3A', true: Night.accent }}
          thumbColor={Night.text}
        />
      </View>
      {last ? null : <View style={styles.line} />}
    </View>
  );
}

export function NightChoice({
  label,
  selected,
  onPress,
  last = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <Text style={styles.rowLabel}>{label}</Text>
        {selected ? <Icon name="check" size={16} color={Night.accent} /> : null}
      </Pressable>
      {last ? null : <View style={styles.line} />}
    </View>
  );
}

export function NightFoot({ children }: { children: string }) {
  return <Text style={styles.foot}>{children}</Text>;
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
  card: {
    marginTop: 22,
    borderRadius: 16,
    backgroundColor: Night.row,
    overflow: 'hidden',
  },
  row: {
    minHeight: 54,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    flex: 1,
    color: Night.text,
    fontSize: 16,
    fontWeight: 600,
  },
  line: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
    backgroundColor: '#3A3A3A',
  },
  foot: {
    marginTop: 10,
    marginHorizontal: 4,
    color: Night.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 500,
  },
  pressed: {
    opacity: 0.72,
  },
});
