import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Palette, cardShadow } from '@/constants/palette';

const ICONS = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  projects: { ios: 'square.grid.2x2.fill', android: 'grid_view', web: 'grid_view' },
  calendar: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  bell: { ios: 'bell', android: 'notifications', web: 'notifications' },
  back: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  more: { ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
  grid: { ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' },
  done: { ios: 'checkmark.circle', android: 'task_alt', web: 'task_alt' },
  pending: { ios: 'clock', android: 'pending', web: 'pending' },
  briefcase: { ios: 'briefcase.fill', android: 'work', web: 'work' },
  person: { ios: 'person', android: 'person', web: 'person' },
  star: { ios: 'star', android: 'star_border', web: 'star_border' },
  starFill: { ios: 'star.fill', android: 'star', web: 'star' },
  sun: { ios: 'sun.max.fill', android: 'sunny', web: 'sunny' },
  arrow: { ios: 'arrow.up.right', android: 'north_east', web: 'north_east' },
  video: { ios: 'video.fill', android: 'video_call', web: 'video_call' },
  folder: { ios: 'folder.fill', android: 'folder', web: 'folder' },
  tag: { ios: 'tag.fill', android: 'sell', web: 'sell' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' },
  moon: { ios: 'moon.fill', android: 'dark_mode', web: 'dark_mode' },
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color: string }) {
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} style={{ width: size, height: size }} />;
}

export function IconButton({
  icon,
  onPress,
  variant = 'light',
  accessibilityLabel,
  style,
}: {
  icon: IconName;
  onPress?: () => void;
  variant?: 'light' | 'dark';
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}) {
  const dark = variant === 'dark';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.button,
        dark ? styles.dark : styles.light,
        pressed && styles.pressed,
        style,
      ]}>
      <Icon name={icon} size={18} color={dark ? Palette.white : Palette.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  light: {
    backgroundColor: Palette.white,
    ...cardShadow,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  dark: {
    backgroundColor: Palette.ink,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
});
