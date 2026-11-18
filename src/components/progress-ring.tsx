import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Palette } from '@/constants/palette';

export function ProgressRing({
  progress,
  size = 118,
  stroke = 12,
}: {
  progress: number;
  size?: number;
  stroke?: number;
}) {
  const clamped = Math.min(1, Math.max(0, progress));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }} accessibilityLabel={`${Math.round(clamped * 100)} percent complete`}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={Palette.progressTrack}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={Palette.lime}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - clamped)}
          transform={`rotate(128 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.label} pointerEvents="none">
        <Text style={styles.value}>{Math.round(clamped * 100)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: Palette.white,
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.4,
  },
});
