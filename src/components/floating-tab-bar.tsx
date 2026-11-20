import { router, usePathname } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Layout, Palette } from '@/constants/palette';
import { useCopy } from '@/lib/settings-copy';

const ICONS: Record<string, IconName> = {
  index: 'home',
  projects: 'projects',
  calendar: 'calendar',
  settings: 'settings',
};

export function FloatingTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const text = useCopy();
  const pathname = usePathname();
  const midpoint = Math.ceil(state.routes.length / 2);
  const leading = state.routes.slice(0, midpoint);
  const trailing = state.routes.slice(midpoint);

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View pointerEvents="none" style={styles.surface} />
        <View style={styles.row}>
          {leading.map((route, index) => renderTab(route, index))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text.addTask}
            onPress={() => router.push('/add-task')}
            style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
            <Icon name="plus" size={26} color={Palette.white} />
          </Pressable>
          {trailing.map((route, index) => renderTab(route, index + leading.length))}
        </View>
      </View>
    </View>
  );

  function renderTab(route: (typeof state.routes)[number], index: number) {
    const focused = state.index === index;
    const { options } = descriptors[route.key];
    const label = options.title ?? route.name;
    const name = typeof label === 'string' ? label : route.name;
    const color = focused ? Palette.ink : Palette.muted;

    const onPress = () => {
      const event = emitter.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (event.defaultPrevented) return;
      if (focused) {
        if (route.name === 'settings' && pathname !== '/settings') router.dismissTo('/settings');
        return;
      }
      navigateToTab(route.key);
    };

    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityLabel={name}
        accessibilityState={{ selected: focused }}
        android_ripple={{ color: Palette.white }}
        onPress={onPress}
        style={styles.item}>
        <Icon name={ICONS[route.name] ?? 'home'} size={22} color={color} />
        <Text style={[styles.label, { color }, focused && styles.labelActive]} numberOfLines={1}>
          {name}
        </Text>
      </Pressable>
    );
  }
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
    width: '100%',
    maxWidth: Layout.phone,
    overflow: 'visible',
  },
  surface: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Palette.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.line,
    shadowColor: '#3A2452',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  item: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
  },
  labelActive: {
    fontWeight: 700,
  },
  add: {
    width: 58,
    height: 58,
    marginTop: -26,
    marginHorizontal: 8,
    borderRadius: 29,
    backgroundColor: Palette.ink,
    borderWidth: 4,
    borderColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3A2452',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  pressed: {
    opacity: 0.82,
  },
});
