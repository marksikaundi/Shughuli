import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { StatusBar, StyleSheet, View, type ViewProps } from 'react-native';

import { Night } from '@/constants/night';
import { Layout, Palette } from '@/constants/palette';

export function useNightStatus() {
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle('dark-content');
    }, []),
  );
}

export function Screen({ children, style, tone = 'day', ...rest }: ViewProps & { tone?: 'day' | 'night' }) {
  const night = tone === 'night';
  return (
    <View style={[styles.root, night && styles.rootNight]} {...rest}>
      <View style={[styles.frame, night && styles.frameNight, style]}>
        {night ? null : <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.wash]} />}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    backgroundColor: Palette.canvas,
    alignItems: 'center',
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: Layout.phone,
    backgroundColor: Palette.wash,
  },
  rootNight: {
    backgroundColor: Night.bg,
  },
  frameNight: {
    backgroundColor: Night.bg,
  },
  wash: {
    backgroundColor: Palette.wash,
    experimental_backgroundImage:
      'linear-gradient(180deg, #F8D5E8 0%, #F8E8E4 26%, #FBF7F4 54%, #F2E5F7 100%)',
  },
});
