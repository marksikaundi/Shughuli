import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Night } from '@/constants/night';

const GOOD = '#6FCF8E';

export type DialogAction = { label: string; onPress: () => void };

/**
 * A dark, rounded replacement for the native alert. `callout` is an optional status box
 * shown under the title (green when `ok`, accent when not).
 */
export function NightDialog({
  visible,
  icon,
  title,
  callout,
  paragraphs = [],
  primary,
  closeLabel,
  onClose,
}: {
  visible: boolean;
  icon: IconName;
  title: string;
  callout?: { ok: boolean; text: string };
  paragraphs?: string[];
  primary?: DialogAction;
  closeLabel: string;
  onClose: () => void;
}) {
  const tone = callout?.ok ? GOOD : Night.accent;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.dialog} onPress={() => undefined}>
          <View style={styles.badge}>
            <Icon name={icon} size={24} color={Night.accent} />
          </View>
          <Text style={styles.title}>{title}</Text>

          {callout ? (
            <View style={[styles.callout, { borderColor: tone }]}>
              <View style={[styles.dot, { backgroundColor: tone }]} />
              <Text style={styles.calloutText}>{callout.text}</Text>
            </View>
          ) : null}

          {paragraphs.map((paragraph) => (
            <Text key={paragraph.slice(0, 32)} style={styles.body}>
              {paragraph}
            </Text>
          ))}

          <View style={styles.actions}>
            {primary ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={primary.label}
                onPress={() => {
                  onClose();
                  primary.onPress();
                }}
                style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
                <Text style={styles.primaryText}>{primary.label}</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
              onPress={onClose}
              style={({ pressed }) => [primary ? styles.secondary : styles.primary, pressed && styles.pressed]}>
              <Text style={primary ? styles.secondaryText : styles.primaryText}>{closeLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.66)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  dialog: {
    borderRadius: 28,
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    gap: 12,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Night.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 2,
    color: Night.text,
    fontSize: 23,
    fontWeight: 800,
  },
  callout: {
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  calloutText: {
    flex: 1,
    color: Night.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: 600,
  },
  body: {
    color: Night.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    marginTop: 8,
    gap: 6,
  },
  primary: {
    minHeight: 50,
    borderRadius: 15,
    backgroundColor: Night.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 700,
  },
  secondary: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: Night.muted,
    fontSize: 16,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.72,
  },
});
