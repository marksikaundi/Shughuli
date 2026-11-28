import { usePathname } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, PanResponder, Platform, Pressable, StyleSheet, Text, View, type KeyboardEvent } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { QuickAdd } from '@/components/quick-add';
import { Night } from '@/constants/night';
import { Layout } from '@/constants/palette';
import { appTintById, type TabId } from '@/data/preferences';
import { useCopy } from '@/lib/settings-copy';
import { useComposerStore } from '@/store/composer';
import { usePreferencesStore } from '@/store/preferences';

const ICONS: Record<string, IconName> = {
  index: 'inbox',
  projects: 'calendar',
  calendar: 'month',
  browse: 'settings',
};

export function FloatingTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const text = useCopy();
  const pathname = usePathname();
  const showLabels = usePreferencesStore((state) => state.prefs.showTabLabels);
  const showInbox = usePreferencesStore((state) => state.prefs.showInboxTab);
  const showToday = usePreferencesStore((state) => state.prefs.showTodayTab);
  const showUpcoming = usePreferencesStore((state) => state.prefs.showUpcomingTab);
  const tabOrder = usePreferencesStore((state) => state.prefs.tabOrder);
  const tint = appTintById(usePreferencesStore((state) => state.prefs.appTint)).color;
  const focusedKey = state.routes[state.index]?.key;
  const visible = state.routes
    .filter((route) => !hiddenTab(route.name, showInbox, showToday, showUpcoming))
    .sort((a, b) => tabRank(a.name, tabOrder) - tabRank(b.name, tabOrder));
  const showAdd = !pathname.startsWith('/settings');
  const composeRequest = useComposerStore((state) => state.request);
  const clearComposer = useComposerStore((state) => state.clear);
  const [composing, setComposing] = useState(false);
  const [handledRequest, setHandledRequest] = useState(0);
  const [keyboard, setKeyboard] = useState(0);
  const start = placeFab(0, Dimensions.get('window').height - 160, true);
  const [spot, setSpot] = useState(start);
  const pos = useRef(start);
  const origin = useRef(start);
  const moved = useRef(false);
  const placed = useRef(false);
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        moved.current = false;
        origin.current = pos.current;
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6) moved.current = true;
        const next = placeFab(origin.current.x + gesture.dx, origin.current.y + gesture.dy, false);
        pos.current = next;
        setSpot(next);
      },
      onPanResponderRelease: (_, gesture) => {
        const next = placeFab(origin.current.x + gesture.dx, origin.current.y + gesture.dy, true);
        pos.current = next;
        setSpot(next);
        if (!moved.current) {
          clearComposer();
          setComposing(true);
        }
      },
    }),
  ).current;
  if (!showAdd && composing) setComposing(false);

  if (composeRequest && composeRequest.nonce !== handledRequest) {
    setHandledRequest(composeRequest.nonce);
    setComposing(true);
  } else if (!composeRequest && handledRequest !== 0) {
    setHandledRequest(0);
  }

  useEffect(() => {
    const focused = state.routes[state.index];
    if (!focused || !hiddenTab(focused.name, showInbox, showToday, showUpcoming)) return;
    const fallback = state.routes.find((route) => route.name === 'browse');
    if (fallback) navigateToTab(fallback.key);
  }, [navigateToTab, showInbox, showToday, showUpcoming, state.index, state.routes]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (event) => setKeyboard(keyboardInset(event)));
    const didShow = Keyboard.addListener('keyboardDidShow', (event) => setKeyboard(keyboardInset(event)));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboard(0));
    return () => {
      show.remove();
      didShow.remove();
      hide.remove();
    };
  }, []);

  function renderTab(route: (typeof visible)[number]) {
    const focused = route.key === focusedKey;
    const { options } = descriptors[route.key];
    const label = options.title ?? route.name;
    const name = typeof label === 'string' ? label : route.name;
    const color = focused ? tint : Night.muted;
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
        style={[styles.item, !showLabels && styles.itemIcons]}>
        <View style={styles.icon}>
          <Icon name={ICONS[route.name] ?? 'inbox'} size={22} color={color} />
        </View>
        {showLabels ? (
          <Text style={[styles.label, { color }]} numberOfLines={1}>
            {name}
          </Text>
        ) : null}
      </Pressable>
    );
  }

  return (
    <View
      pointerEvents="box-none"
      onLayout={(event) => {
        if (placed.current) return;
        const { width, height } = event.nativeEvent.layout;
        const next = placeFab(width - FAB, height - Math.max(insets.bottom, 8) - 150, true, width, height);
        pos.current = next;
        setSpot(next);
        placed.current = true;
      }}
      style={styles.overlay}>
      {composing ? (
        <>
          <Pressable style={styles.backdrop} onPress={() => setComposing(false)} />
          <View style={[styles.composer, { bottom: keyboard }]}>
            <QuickAdd
              key={composeRequest?.nonce ?? 'fab'}
              initialDate={composeRequest?.date ?? ''}
              onClose={() => {
                setComposing(false);
                clearComposer();
              }}
              bottomInset={keyboard > 0 ? 8 : Math.max(insets.bottom, 8)}
            />
          </View>
        </>
      ) : (
        <>
          {showAdd ? (
            <View
              accessibilityRole="button"
              accessibilityLabel={text.addTask}
              {...pan.panHandlers}
              style={[styles.fab, { backgroundColor: tint, left: spot.x, top: spot.y }]}>
              <Icon name="plus" size={28} color={Night.text} />
            </View>
          ) : null}
          <View style={styles.dock} pointerEvents="box-none">
            <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
              <View style={styles.row}>{visible.map((route) => renderTab(route))}</View>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const FAB = 56;

function keyboardInset(event: KeyboardEvent) {
  const overlap = Dimensions.get('window').height - event.endCoordinates.screenY;
  if (overlap > 0) return Math.max(overlap, event.endCoordinates.height);
  return Platform.OS === 'android' ? Math.max(0, event.endCoordinates.height) : 0;
}

function placeFab(x: number, y: number, snapRight: boolean, width = Dimensions.get('window').width, height = Dimensions.get('window').height) {
  const margin = 16;
  const nextX = snapRight ? width - FAB - margin : Math.min(Math.max(x, margin), width - FAB - margin);
  const nextY = Math.min(Math.max(y, 64), height - FAB - margin);
  return { x: nextX, y: nextY };
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  composer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
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
  itemIcons: {
    height: 48,
  },
  icon: {
    width: 46,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
  },
  fab: {
    position: 'absolute',
    width: FAB,
    height: FAB,
    borderRadius: FAB / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
});

function tabRank(name: string, order: TabId[]) {
  const id: TabId | null = name === 'index' ? 'inbox' : name === 'projects' ? 'today' : name === 'calendar' ? 'upcoming' : name === 'browse' ? 'browse' : null;
  if (!id) return order.length;
  const index = order.indexOf(id);
  return index === -1 ? order.length : index;
}

function hiddenTab(name: string, inbox: boolean, today: boolean, upcoming: boolean) {
  if (name === 'index') return !inbox;
  if (name === 'projects') return !today;
  if (name === 'calendar') return !upcoming;
  return false;
}
