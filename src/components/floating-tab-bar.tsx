import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { Icon, type IconName } from '@/components/icon';
import { Layout, Palette, cardShadow } from '@/constants/palette';

const ICONS: Record<string, IconName> = {
  index: 'home',
  projects: 'projects',
  calendar: 'calendar',
  profile: 'profile',
};

export function FloatingTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const color = focused ? Palette.white : Palette.muted;

          const onPress = () => {
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigateToTab(route.key);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={typeof label === 'string' ? label : route.name}
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              style={styles.slot}>
              <View style={[styles.item, focused && styles.itemActive]}>
                <Icon name={ICONS[route.name] ?? 'home'} size={20} color={color} />
                <Text style={[styles.label, { color }]}>{label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  bar: {
    width: '92%',
    maxWidth: Layout.phone - 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.white,
    borderRadius: 32,
    paddingHorizontal: 6,
    paddingVertical: 6,
    ...cardShadow,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
  },
  item: {
    minWidth: 68,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 24,
  },
  itemActive: {
    backgroundColor: Palette.ink,
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
  },
});
