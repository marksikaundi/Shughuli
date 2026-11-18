import { useEffect, useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { cardShadow } from '@/constants/palette';
import { useSettingsTheme } from '@/hooks/use-settings-theme';
import { useCopy } from '@/lib/settings-copy';

export function SettingsSection({
  title,
  footer,
  children,
}: {
  title: string;
  footer?: string;
  children: ReactNode;
}) {
  const { colors, scale } = useSettingsTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.muted, fontSize: 13 * scale }]}>{title}</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>{children}</View>
      {footer ? (
        <Text style={[styles.footer, { color: colors.muted, fontSize: 12 * scale, lineHeight: 18 * scale }]}>{footer}</Text>
      ) : null}
    </View>
  );
}

export function SettingsRow({
  icon,
  label,
  value,
  onPress,
  danger,
  border = true,
  trailing,
}: {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  border?: boolean;
  trailing?: ReactNode;
}) {
  const { colors, scale, reduceMotion } = useSettingsTheme();
  const content = (
    <>
      <View style={[styles.icon, { backgroundColor: colors.icon }]}>
        <Icon name={icon} size={16} color={danger ? colors.danger : colors.ink} />
      </View>
      <Text style={[styles.label, { color: danger ? colors.danger : colors.ink, fontSize: 15 * scale }]}>{label}</Text>
      {value ? (
        <Text style={[styles.value, { color: colors.muted, fontSize: 14 * scale }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {trailing}
      {onPress && !trailing ? <Icon name="chevron" size={16} color={colors.faint} /> : null}
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, border && { borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth }]}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        border && { borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth },
        pressed && styles.pressed,
        pressed && !reduceMotion && styles.pressedScale,
      ]}>
      {content}
    </Pressable>
  );
}

export function ToggleRow({
  icon,
  label,
  value,
  onChange,
  disabled,
  border = true,
}: {
  icon: IconName;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  border?: boolean;
}) {
  const { accent, colors } = useSettingsTheme();
  return (
    <SettingsRow
      icon={icon}
      label={label}
      border={border}
      trailing={
        <Switch
          accessibilityLabel={label}
          value={value}
          disabled={disabled}
          onValueChange={onChange}
          trackColor={{ false: colors.line, true: accent.color }}
          thumbColor={colors.inverse}
        />
      }
    />
  );
}

export function StepperRow({
  icon,
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
  border = true,
  display,
}: {
  icon: IconName;
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  border?: boolean;
  display?: string;
}) {
  const { colors, scale } = useSettingsTheme();
  return (
    <SettingsRow
      icon={icon}
      label={label}
      border={border}
      trailing={
        <View style={styles.stepper}>
          <StepButton label="Decrease" disabled={value <= min} onPress={() => onChange(Math.max(min, value - step))} />
          <Text style={[styles.stepValue, { color: colors.ink, fontSize: 14 * scale }]}>{display ?? `${value}${unit ? ` ${unit}` : ''}`}</Text>
          <StepButton label="Increase" disabled={value >= max} onPress={() => onChange(Math.min(max, value + step))} />
        </View>
      }
    />
  );
}

function StepButton({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  const { colors } = useSettingsTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.stepButton, { backgroundColor: colors.icon }, disabled && styles.disabled]}>
      <Text style={{ color: colors.ink, fontSize: 18, fontWeight: 700 }}>{label === 'Increase' ? '+' : '−'}</Text>
    </Pressable>
  );
}

export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { colors, scale, accent, reduceMotion } = useSettingsTheme();
  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.id)}
            style={({ pressed }) => [
              styles.chip,
              { backgroundColor: selected ? colors.ink : colors.icon },
              pressed && !reduceMotion && styles.pressedScale,
            ]}>
            <Text style={{ color: selected ? accent.color : colors.ink, fontSize: 13 * scale, fontWeight: 700 }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function OptionSheet({
  visible,
  title,
  options,
  selected,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  options: { id: string; label: string }[];
  selected?: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const { colors, scale, accent } = useSettingsTheme();
  const text = useCopy();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={() => undefined}>
          <Text style={[styles.sheetTitle, { color: colors.ink, fontSize: 18 * scale }]}>{title}</Text>
          {options.map((option) => {
            const active = option.id === selected;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                onPress={() => onSelect(option.id)}
                style={styles.option}>
                <Text style={{ flex: 1, color: colors.ink, fontSize: 16 * scale, fontWeight: 600 }}>{option.label}</Text>
                {active ? <Icon name="check" size={16} color={accent.color} /> : null}
              </Pressable>
            );
          })}
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.sheetClose}>
            <Text style={{ color: colors.muted, fontSize: 15 * scale, fontWeight: 700 }}>{text.close}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function TextPrompt({
  visible,
  title,
  initial,
  placeholder,
  onClose,
  onSave,
}: {
  visible: boolean;
  title: string;
  initial: string;
  placeholder: string;
  onClose: () => void;
  onSave: (value: string) => void;
}) {
  const { colors, scale } = useSettingsTheme();
  const text = useCopy();
  const [value, setValue] = useState(initial);

  useEffect(() => {
    if (visible) setValue(initial);
  }, [visible, initial]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={() => undefined}>
          <Text style={[styles.sheetTitle, { color: colors.ink, fontSize: 18 * scale }]}>{title}</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={colors.faint}
            autoFocus
            maxLength={40}
            style={[styles.input, { color: colors.ink, backgroundColor: colors.field, borderColor: colors.line, fontSize: 16 * scale }]}
          />
          <View style={styles.promptActions}>
            <Pressable onPress={onClose} style={styles.promptButton}>
              <Text style={{ color: colors.muted, fontWeight: 700, fontSize: 15 * scale }}>{text.cancel}</Text>
            </Pressable>
            <Pressable onPress={() => onSave(value.trim())} style={styles.promptButton}>
              <Text style={{ color: colors.ink, fontWeight: 700, fontSize: 15 * scale }}>{text.save}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 22,
  },
  sectionTitle: {
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: 700,
  },
  card: {
    borderRadius: 24,
    ...cardShadow,
  },
  footer: {
    marginTop: 8,
    marginHorizontal: 6,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontWeight: 600,
  },
  value: {
    maxWidth: 128,
    fontWeight: 600,
  },
  pressed: {
    opacity: 0.72,
  },
  pressedScale: {
    transform: [{ scale: 0.99 }],
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepValue: {
    minWidth: 64,
    textAlign: 'center',
    fontWeight: 700,
  },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.35,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  sheetTitle: {
    fontWeight: 700,
    marginBottom: 8,
  },
  option: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetClose: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 8,
  },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  promptActions: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 18,
  },
  promptButton: {
    paddingVertical: 8,
  },
});
