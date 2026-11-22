import { usePathname } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { QuickAdd } from '@/components/quick-add';
import { Night } from '@/constants/night';
import { Layout } from '@/constants/palette';
import { useCopy } from '@/lib/settings-copy';

const ICONS: Record<string, IconName> = {
  index: 'inbox',
  projects: 'calendar',
  calendar: 'month',
  browse: 'settings',
};

export function FloatingTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const text = useCopy();
  const pathname = usePathname();
  const focusedKey = state.routes[state.index]?.key;
  const routes = state.routes.filter((route) => route.name !== 'settings');
  const upcomingIndex = routes.findIndex((route) => route.name === 'calendar');
  const left = upcomingIndex === -1 ? routes : routes.slice(0, upcomingIndex);
  const right = upcomingIndex === -1 ? [] : routes.slice(upcomingIndex);
  const showAdd = !pathname.startsWith('/settings');
  const [composing, setComposing] = useState(false);
  const [keyboard, setKeyboard] = useState(0);
  if (!showAdd && composing) setComposing(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (event) => {
      const overlap = Dimensions.get('window').height - event.endCoordinates.screenY;
      setKeyboard(Math.max(0, overlap));
    });
    const hide = Keyboard.addListener(hideEvent, () => setKeyboard(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  function renderTab(route: (typeof routes)[number]) {
    const focused = route.key === focusedKey;
    const { options } = descriptors[route.key];
    const label = options.title ?? route.name;
    const name = typeof label === 'string' ? label : route.name;
    const color = focused ? Night.accent : Night.muted;
    const onPress = () => {
      const event = emitter.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (event.defaultPrevented) return;
      if (!focused) navigateToTab(route.key);
    };
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityLabel={name}
        accessibilityState={{ selected: focused }}
        onPress={onPress}
        style={styles.item}>
        <View style={[styles.icon, focused && styles.iconActive]}>
          <Icon name={ICONS[route.name] ?? 'inbox'} size={22} color={color} />
        </View>
        <Text style={[styles.label, { color }]} numberOfLines={1}>
          {name}
        </Text>
      </Pressable>
    );
  }

  return (
    <View pointerEvents="box-none" style={[styles.wrap, composing && styles.wrapOpen, composing && { bottom: keyboard }]}>
      {composing ? (
        <>
          <Pressable style={styles.backdrop} onPress={() => setComposing(false)} />
          <QuickAdd onClose={() => setComposing(false)} bottomInset={keyboard > 0 ? 8 : Math.max(insets.bottom, 8)} />
        </>
      ) : null}
      {composing ? null : (
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={styles.row}>
          {left.map((route) => renderTab(route))}
          {showAdd ? (
            <View style={styles.fabSlot}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={text.addTask}
                onPress={() => setComposing(true)}
                style={({ pressed }) => [styles.fab, pressed && styles.pressed]}>
                <Icon name="plus" size={28} color={Night.text} />
              </Pressable>
            </View>
          ) : null}
          {right.map((route) => renderTab(route))}
        </View>
      </View>
      )}
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
  wrapOpen: {
    top: 0,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  backdrop: {
    flex: 1,
    width: '100%',
  },
  bar: {
    width: '100%',
    maxWidth: Layout.phone,
    backgroundColor: Night.bar,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Night.line,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  item: {
    flex: 1,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  icon: {
    width: 46,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActive: {
    backgroundColor: Night.accentSoft,
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
  },
  fabSlot: {
    width: 72,
    height: 54,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    top: -18,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Night.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  pressed: {
    opacity: 0.86,
  },
});
