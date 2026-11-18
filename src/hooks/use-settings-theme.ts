import { useCallback } from 'react';
import { StatusBar } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { accentById, type AccentId } from '@/data/preferences';
import { Palette } from '@/constants/palette';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePreferencesStore } from '@/store/preferences';

const light = {
  canvas: 'transparent',
  card: Palette.white,
  ink: Palette.ink,
  muted: Palette.muted,
  faint: Palette.faint,
  line: Palette.line,
  icon: '#F6F4F8',
  danger: Palette.danger,
  field: Palette.white,
  overlay: 'rgba(22, 22, 22, 0.4)',
  inverse: Palette.white,
};

const dark = {
  canvas: '#141117',
  card: '#241E2A',
  ink: '#F7F2F8',
  muted: '#B7ADBE',
  faint: '#8D8496',
  line: '#3A3342',
  icon: '#312838',
  danger: '#FF9B9B',
  field: '#1B1720',
  overlay: 'rgba(0, 0, 0, 0.55)',
  inverse: '#141117',
};

export function useSettingsTheme() {
  const theme = usePreferencesStore((state) => state.prefs.theme);
  const accent = usePreferencesStore((state) => state.prefs.accent);
  const fontSize = usePreferencesStore((state) => state.prefs.fontSize);
  const reduceMotion = usePreferencesStore((state) => state.prefs.reduceMotion);
  const system = useColorScheme();
  const isDark = theme === 'dark' || (theme === 'system' && system === 'dark');
  const scale = fontSize === 'small' ? 0.92 : fontSize === 'large' ? 1.15 : 1;

  return {
    dark: isDark,
    scale,
    reduceMotion,
    accent: accentById(accent),
    colors: isDark ? dark : light,
  };
}

export function useScreenStatusBar(isDark: boolean) {
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
      return () => StatusBar.setBarStyle('dark-content');
    }, [isDark]),
  );
}

export function accentColor(id: AccentId) {
  return accentById(id).color;
}
