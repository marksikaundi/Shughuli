import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Palette, cardShadow } from '@/constants/palette';

export function EmptyState({
  icon = 'check',
  title,
  body,
  actionLabel,
  onAction,
  compact = false,
  style,
}: {
  icon?: IconName;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.card, compact && styles.cardCompact, style]}>
      {compact ? (
        <View style={styles.compactBadge}>
          <Icon name={icon} size={20} color={Palette.ink} />
        </View>
      ) : (
        <View style={styles.stage}>
          <View style={[styles.sheet, styles.sheetBack]} />
          <View style={[styles.sheet, styles.sheetFront]}>
            <View style={styles.mark} />
            <View style={styles.lines}>
              <View style={styles.line} />
              <View style={styles.lineShort} />
            </View>
          </View>
          <View style={styles.badge}>
            <Icon name={icon} size={20} color={Palette.ink} />
          </View>
        </View>
      )}
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      <Text style={[styles.body, compact && styles.bodyCompact]}>{body}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Icon name="plus" size={16} color={Palette.white} />
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.white,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
    alignItems: 'center',
    ...cardShadow,
  },
  cardCompact: {
    borderRadius: 24,
    paddingTop: 22,
    paddingBottom: 22,
  },
  stage: {
    width: 210,
    height: 118,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderRadius: 18,
  },
  sheetBack: {
    position: 'absolute',
    top: 10,
    width: 156,
    height: 62,
    backgroundColor: '#EFEAF4',
    transform: [{ rotate: '-7deg' }],
  },
  sheetFront: {
    width: 188,
    height: 72,
    backgroundColor: Palette.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#F3F0F6',
    ...cardShadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  mark: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: Palette.lime,
  },
  lines: {
    flex: 1,
    gap: 8,
  },
  line: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ECE8F0',
  },
  lineShort: {
    width: '62%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F4F1F6',
  },
  badge: {
    position: 'absolute',
    right: 18,
    bottom: -4,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Palette.lime,
    borderWidth: 3,
    borderColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 18,
    color: Palette.ink,
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  titleCompact: {
    marginTop: 14,
    fontSize: 18,
  },
  body: {
    marginTop: 8,
    color: Palette.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  bodyCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  action: {
    marginTop: 20,
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 20,
    backgroundColor: Palette.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionText: {
    color: Palette.white,
    fontSize: 15,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.85,
  },
});
