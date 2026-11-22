import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NightCard, NightFoot, NightPage, NightSwitch } from '@/components/settings/night-page';
import { OptionSheet, SettingsRow, SettingsSection, ToggleRow } from '@/components/settings/controls';
import { SettingsPage, useReminderToggle, useSave } from '@/components/settings/page';
import { Night } from '@/constants/night';
import { formatClock } from '@/data/model';
import type { Preferences } from '@/data/preferences';
import { formatLocale } from '@/i18n/format';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

export default function ProductivityScreen() {
  const params = useLocalSearchParams<{ part?: string }>();
  const part = params.part === 'reminders' || params.part === 'notifications' ? params.part : 'plan';
  if (part === 'plan') return <GoalScreen />;
  return <ReminderScreen part={part} />;
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

function ReminderScreen({ part }: { part: 'reminders' | 'notifications' }) {
  const text = useCopy();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();
  const toggle = useReminderToggle();
  const [sheet, setSheet] = useState(false);
  const title = part === 'reminders' ? text.reminders : text.notificationRow;
  const soundLabel =
    prefs.notificationSound === 'chime' ? text.timerChime : prefs.notificationSound === 'bell' ? text.timerBell : prefs.notificationSound === 'none' ? text.timerSilent : text.soundSystem;

  return (
    <SettingsPage title={title}>
      {part === 'reminders' ? (
        <SettingsSection footer={`${text.endOfDay}: ${formatClock('20:00')}. ${text.reminderFoot}`}>
          <ToggleRow icon="bell" label={text.taskReminders} value={prefs.taskReminders} onChange={(value) => void toggle('taskReminders', value)} />
          <ToggleRow icon="check" label={text.habitReminders} value={prefs.habitReminders} onChange={(value) => void toggle('habitReminders', value)} />
          <ToggleRow icon="sun" label={text.dailyPlanning} value={prefs.dailyPlanning} onChange={(value) => void toggle('dailyPlanning', value)} />
          <ToggleRow icon="moon" label={text.endOfDay} value={prefs.endOfDayReview} onChange={(value) => void toggle('endOfDayReview', value)} border={false} />
        </SettingsSection>
      ) : (
        <SettingsSection footer={text.reminderFoot}>
          <SettingsRow icon="speaker" label={text.sound} value={soundLabel} onPress={() => setSheet(true)} />
          <ToggleRow icon="wave" label={text.vibration} value={prefs.notificationVibration} onChange={(value) => void toggle('notificationVibration', value)} border={false} />
        </SettingsSection>
      )}
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
});
