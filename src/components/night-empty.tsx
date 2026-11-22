import { StyleSheet, View } from 'react-native';

export function InboxMark() {
  return (
    <View style={styles.stage}>
      <View style={styles.cloud} />
      <View style={styles.leafLeft} />
      <View style={styles.leafRight} />
      <View style={styles.tray}>
        <View style={styles.slot} />
      </View>
      <View style={[styles.spark, styles.sparkLeft]} />
      <View style={[styles.spark, styles.sparkRight]} />
      <View style={[styles.spark, styles.sparkTop]} />
    </View>
  );
}

export function TodayMark() {
  return (
    <View style={styles.stage}>
      <View style={styles.cup} />
      <View style={styles.vase} />
      <View style={styles.stem} />
      <View style={[styles.dot, styles.dotA]} />
      <View style={[styles.dot, styles.dotB]} />
      <View style={[styles.dot, styles.dotC]} />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: 220,
    height: 150,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  cloud: {
    position: 'absolute',
    top: 28,
    width: 150,
    height: 54,
    borderRadius: 28,
    backgroundColor: '#2A332C',
  },
  leafLeft: {
    position: 'absolute',
    left: 28,
    bottom: 36,
    width: 28,
    height: 16,
    borderRadius: 12,
    backgroundColor: '#6E8F72',
    transform: [{ rotate: '-28deg' }],
  },
  leafRight: {
    position: 'absolute',
    right: 36,
    bottom: 42,
    width: 26,
    height: 14,
    borderRadius: 12,
    backgroundColor: '#7FA184',
    transform: [{ rotate: '24deg' }],
  },
  tray: {
    width: 108,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#F0C14A',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
  },
  slot: {
    width: 64,
    height: 14,
    borderRadius: 8,
    backgroundColor: '#E0A82A',
  },
  spark: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#F6D56A',
    transform: [{ rotate: '45deg' }],
  },
  sparkLeft: {
    left: 42,
    top: 36,
  },
  sparkRight: {
    right: 34,
    top: 48,
    width: 8,
    height: 8,
  },
  sparkTop: {
    top: 16,
    right: 78,
    width: 12,
    height: 12,
    backgroundColor: '#F2B43A',
  },
  cup: {
    position: 'absolute',
    left: 36,
    bottom: 8,
    width: 86,
    height: 62,
    borderRadius: 30,
    backgroundColor: '#F3EFE4',
  },
  vase: {
    position: 'absolute',
    right: 48,
    bottom: 8,
    width: 58,
    height: 92,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: '#A9C0C4',
  },
  stem: {
    position: 'absolute',
    right: 70,
    bottom: 88,
    width: 8,
    height: 36,
    borderRadius: 4,
    backgroundColor: '#6E8F72',
    transform: [{ rotate: '12deg' }],
  },
  dot: {
    position: 'absolute',
    borderRadius: 8,
    backgroundColor: '#E7B84A',
  },
  dotA: {
    width: 12,
    height: 12,
    right: 78,
    top: 18,
  },
  dotB: {
    width: 8,
    height: 8,
    right: 64,
    top: 34,
    backgroundColor: '#D4655A',
  },
  dotC: {
    width: 10,
    height: 10,
    right: 92,
    top: 36,
  },
});
