import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';

import { Icon } from '@/components/icon';
import { NightCard, NightFoot, NightPage, NightSwitch } from '@/components/settings/night-page';
import { OptionSheet, SettingsRow, SettingsSection, ToggleRow } from '@/components/settings/controls';
import { SettingsPage, useReminderToggle, useSave } from '@/components/settings/page';
import { Night } from '@/constants/night';
import type { Preferences } from '@/data/preferences';
import { formatLocale } from '@/i18n/format';
import { ensureReminderPermission, registerReminderActions } from '@/lib/reminders';
import { fill, useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

export default function ProductivityScreen() {
  const params = useLocalSearchParams<{ part?: string }>();
  const part = params.part === 'reminders' || params.part === 'notifications' ? params.part : 'plan';
  if (part === 'plan') return <GoalScreen />;
  if (part === 'reminders') return <ReminderSettings />;
  return <NotificationScreen />;
}

function GoalScreen() {
  const text = useCopy();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();
  const days = weekDays();
  const selected = days.map((day) => prefs.daysOff.includes(day.id));

  function toggleDay(id: number) {
    const next = prefs.daysOff.includes(id) ? prefs.daysOff.filter((day) => day !== id) : [...prefs.daysOff, id];
    void save({ daysOff: next });
  }

  return (
    <NightPage title={text.productivity}>
      <NightCard>
        <NightSwitch label={text.useKarma} value={prefs.useKarma} onChange={(useKarma) => void save({ useKarma })} last />
      </NightCard>

      <Text style={styles.section}>{text.setGoals}</Text>
      <NightCard>
        <GoalRow label={text.dailyTaskGoal} value={prefs.dailyGoal} onChange={(dailyGoal) => void save({ dailyGoal })} min={1} max={20} />
        <GoalRow label={text.weeklyTaskGoal} value={prefs.weeklyGoal} onChange={(weeklyGoal) => void save({ weeklyGoal })} min={1} max={100} last />
      </NightCard>

      <NightCard>
        <NightSwitch label={text.goalCelebrations} value={prefs.goalCelebrations} onChange={(goalCelebrations) => void save({ goalCelebrations })} last />
      </NightCard>
      <NightFoot>{text.goalCelebrationsFoot}</NightFoot>

      <Text style={styles.section}>{text.daysOff}</Text>
      <View style={styles.days}>
        {days.map((day, index) => (
          <Pressable
            key={day.id}
            accessibilityRole="button"
            accessibilityLabel={day.name}
            accessibilityState={{ selected: selected[index] }}
            onPress={() => toggleDay(day.id)}
            style={[
              styles.day,
              selected[index] && styles.dayOn,
              selected[index] && !selected[index - 1] && styles.dayStart,
              selected[index] && !selected[index + 1] && styles.dayEnd,
            ]}>
            <Text style={[styles.dayText, selected[index] && styles.dayTextOn]}>{day.label}</Text>
          </Pressable>
        ))}
      </View>
      <NightFoot>{text.daysOffFoot}</NightFoot>

      <NightCard>
        <NightSwitch label={text.vacationMode} value={prefs.vacationMode} onChange={(vacationMode) => void save({ vacationMode })} last />
      </NightCard>
      <NightFoot>{text.vacationModeFoot}</NightFoot>
    </NightPage>
  );
}

function GoalRow({
  label,
  value,
  min,
  max,
  onChange,
  last = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  last?: boolean;
}) {
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value }}
        onPress={() => onChange(value >= max ? min : value + 1)}
        onLongPress={() => onChange(value <= min ? max : value - 1)}
        style={({ pressed }) => [styles.goal, pressed && styles.pressed]}>
        <Text style={styles.goalLabel}>{label}</Text>
        <Text style={styles.goalValue}>{value}</Text>
      </Pressable>
      {last ? null : <View style={styles.goalLine} />}
    </View>
  );
}

function weekDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(2026, 0, 5 + index);
    return {
      id: date.getDay(),
      label: formatLocale(date, { weekday: 'narrow' }),
      name: formatLocale(date, { weekday: 'long' }),
    };
  });
}

function ReminderSettings() {
  const text = useCopy();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [sheet, setSheet] = useState<'via' | 'snooze' | 'automatic' | 'urgent' | null>(null);
  const via =
    prefs.notificationSound === 'chime' ? text.timerChime : prefs.notificationSound === 'bell' ? text.timerBell : prefs.notificationSound === 'none' ? text.timerSilent : text.soundSystem;

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') {
        setAllowed(false);
        return;
      }
      void registerReminderActions();
      void Notifications.getPermissionsAsync().then((permission) => setAllowed(permission.status === 'granted'));
    }, []),
  );

  async function openSystemSettings() {
    if (Platform.OS === 'web') return;
    const granted = await ensureReminderPermission();
    setAllowed(granted);
    if (!granted) await Linking.openSettings();
  }

  return (
    <NightPage title={text.reminders}>
      <Text style={styles.section}>{text.enableNotifications}</Text>
      <Pressable accessibilityRole="button" onPress={() => void openSystemSettings()} style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}>
        <Text style={styles.settingsButtonText}>{text.openSettingsApp}</Text>
      </Pressable>
      <NightFoot>{allowed ? text.notificationsOn : text.notificationsOff}</NightFoot>

      <Text style={styles.section}>{text.reminderPreferences}</Text>
      <NightCard>
        <ReminderRow label={text.remindMeVia} onPress={() => setSheet('via')} />
        <ReminderRow label={text.whenSnoozed} value={fill(text.snoozeMinutes, { count: prefs.snoozeMinutes })} onPress={() => setSheet('snooze')} last />
      </NightCard>

      <NightCard>
        <ReminderRow label={text.automaticReminders} value={prefs.taskReminders ? text.atTimeOfTask : text.reminderOff} onPress={() => setSheet('automatic')} last />
      </NightCard>
      <NightFoot>{text.automaticRemindersFoot}</NightFoot>

      <Text style={styles.section}>{text.urgentReminders}</Text>
      <NightCard>
        <ReminderRow label={text.alertsOn} value={prefs.urgentAlerts === 'time' ? text.atTimeOfTask : text.notSet} onPress={() => setSheet('urgent')} />
        <Pressable accessibilityRole="button" onPress={() => void openSystemSettings()} style={({ pressed }) => [styles.deviceRow, pressed && styles.pressed]}>
          <Text style={styles.deviceText}>{text.receiveOnDevice}</Text>
        </Pressable>
      </NightCard>
      <Text style={styles.urgentNote}>
        {text.urgentFoot}{' '}
        <Text style={styles.learn} onPress={() => Alert.alert(text.urgentReminders, text.aboutRemindersBody)}>
          {text.learnMore}
        </Text>
      </Text>

      <Pressable accessibilityRole="button" onPress={() => Alert.alert(text.remindersNotWorking, `${text.permissionDenied}\n\n${text.reminderFoot}`, [{ text: text.openSettingsApp, onPress: () => void Linking.openSettings() }, { text: text.close, style: 'cancel' }])}>
        <Text style={styles.help}>{text.remindersNotWorking}</Text>
      </Pressable>

      <ChoiceSheet
        visible={sheet === 'via'}
        title={text.remindMeVia}
        selected={prefs.notificationSound}
        options={[
          { id: 'system', label: text.soundSystem },
          { id: 'chime', label: text.timerChime },
          { id: 'bell', label: text.timerBell },
          { id: 'none', label: text.timerSilent },
        ]}
        onClose={() => setSheet(null)}
        onSelect={(notificationSound) => {
          setSheet(null);
          void save({ notificationSound: notificationSound as Preferences['notificationSound'] });
        }}
      />
      <ChoiceSheet
        visible={sheet === 'snooze'}
        title={text.whenSnoozed}
        selected={String(prefs.snoozeMinutes)}
        options={[5, 15, 30, 60].map((count) => ({ id: String(count), label: fill(text.snoozeMinutes, { count }) }))}
        onClose={() => setSheet(null)}
        onSelect={(id) => {
          setSheet(null);
          void save({ snoozeMinutes: Number(id) as Preferences['snoozeMinutes'] });
        }}
      />
      <ChoiceSheet
        visible={sheet === 'automatic'}
        title={text.automaticReminders}
        selected={prefs.taskReminders ? 'time' : 'off'}
        options={[
          { id: 'off', label: text.reminderOff },
          { id: 'time', label: text.atTimeOfTask },
        ]}
        onClose={() => setSheet(null)}
        onSelect={(id) => {
          setSheet(null);
          if (id === 'time') void ensureReminderPermission().then((granted) => setAllowed(granted));
          void save({ taskReminders: id === 'time' });
        }}
      />
      <ChoiceSheet
        visible={sheet === 'urgent'}
        title={text.alertsOn}
        selected={prefs.urgentAlerts}
        options={[
          { id: 'off', label: text.notSet },
          { id: 'time', label: text.atTimeOfTask },
        ]}
        onClose={() => setSheet(null)}
        onSelect={(id) => {
          setSheet(null);
          if (id === 'time') void ensureReminderPermission().then((granted) => setAllowed(granted));
          void save({ urgentAlerts: id === 'time' ? 'time' : 'off' });
        }}
      />
    </NightPage>
  );
}

function ReminderRow({ label, value, onPress, last = false }: { label: string; value?: string; onPress: () => void; last?: boolean }) {
  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.goal, pressed && styles.pressed]}>
        <Text style={styles.goalLabel}>{label}</Text>
        {value ? <Text style={styles.goalValue}>{value}</Text> : null}
        <Icon name="chevron" size={16} color={Night.faint} />
      </Pressable>
      {last ? null : <View style={styles.goalLine} />}
    </View>
  );
}

function ChoiceSheet({
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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <Text style={styles.sheetTitle}>{title}</Text>
          {options.map((option) => (
            <Pressable key={option.id} accessibilityRole="button" onPress={() => onSelect(option.id)} style={styles.sheetRow}>
              <Text style={styles.goalLabel}>{option.label}</Text>
              {option.id === selected ? <Icon name="check" size={16} color={Night.accent} /> : null}
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function NotificationScreen() {
  const text = useCopy();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();
  const toggle = useReminderToggle();
  const [sheet, setSheet] = useState(false);
  const soundLabel =
    prefs.notificationSound === 'chime' ? text.timerChime : prefs.notificationSound === 'bell' ? text.timerBell : prefs.notificationSound === 'none' ? text.timerSilent : text.soundSystem;

  return (
    <SettingsPage title={text.notificationRow}>
      <SettingsSection footer={text.reminderFoot}>
        <SettingsRow icon="speaker" label={text.sound} value={soundLabel} onPress={() => setSheet(true)} />
        <ToggleRow icon="wave" label={text.vibration} value={prefs.notificationVibration} onChange={(value) => void toggle('notificationVibration', value)} border={false} />
      </SettingsSection>
      <OptionSheet
        visible={sheet}
        title={text.sound}
        selected={prefs.notificationSound}
        options={[
          { id: 'system', label: text.soundSystem },
          { id: 'chime', label: text.timerChime },
          { id: 'bell', label: text.timerBell },
          { id: 'none', label: text.timerSilent },
        ]}
        onClose={() => setSheet(false)}
        onSelect={(notificationSound) => {
          setSheet(false);
          void save({ notificationSound: notificationSound as Preferences['notificationSound'] });
        }}
      />
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 26,
    marginBottom: -10,
    marginLeft: 4,
    color: Night.muted,
    fontSize: 16,
    fontWeight: 600,
  },
  goal: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalLabel: {
    flex: 1,
    color: Night.text,
    fontSize: 16,
    fontWeight: 600,
  },
  goalValue: {
    color: Night.muted,
    fontSize: 16,
    fontWeight: 600,
  },
  goalLine: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
    backgroundColor: '#3A3A3A',
  },
  days: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  day: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOn: {
    backgroundColor: Night.accent,
  },
  dayStart: {
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 22,
  },
  dayEnd: {
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
  },
  dayText: {
    color: Night.muted,
    fontSize: 16,
    fontWeight: 700,
  },
  dayTextOn: {
    color: Night.text,
  },
  pressed: {
    opacity: 0.72,
  },
  settingsButton: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: Night.row,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButtonText: {
    color: Night.accent,
    fontSize: 16,
    fontWeight: 700,
  },
  deviceRow: {
    minHeight: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  deviceText: {
    color: Night.accent,
    fontSize: 16,
    fontWeight: 700,
  },
  urgentNote: {
    marginTop: 10,
    marginHorizontal: 4,
    color: Night.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 500,
  },
  learn: {
    color: Night.accent,
    fontWeight: 700,
  },
  help: {
    marginTop: 28,
    marginLeft: 4,
    color: Night.text,
    fontSize: 16,
    fontWeight: 700,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: Night.row,
    paddingTop: 16,
    paddingBottom: 28,
  },
  sheetTitle: {
    marginBottom: 8,
    paddingHorizontal: 16,
    color: Night.text,
    fontSize: 18,
    fontWeight: 700,
  },
  sheetRow: {
    minHeight: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
