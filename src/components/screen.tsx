import { StyleSheet, View, type ViewProps } from 'react-native';

import { Layout, Palette } from '@/constants/palette';

export function Screen({ children, style, ...rest }: ViewProps) {
  return (
    <View style={styles.root} {...rest}>
      <View style={[styles.frame, style]}>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.wash]} />
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
  wash: {
    backgroundColor: Palette.wash,
    experimental_backgroundImage:
      'linear-gradient(180deg, #F8D5E8 0%, #F8E8E4 26%, #FBF7F4 54%, #F2E5F7 100%)',
  },
});
