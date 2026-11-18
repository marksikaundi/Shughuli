import { useState } from 'react';

import { OptionSheet, SettingsRow, SettingsSection, StepperRow, ToggleRow } from '@/components/settings/controls';
import { SettingsPage, clockMinutes, minutesToClock, useReminderToggle, useSave } from '@/components/settings/page';
import { formatClock } from '@/data/model';
import type { Preferences } from '@/data/preferences';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

export default function ProductivityScreen() {
  const text = useCopy();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();
  const toggle = useReminderToggle();
  const [sheet, setSheet] = useState<'week' | 'priority' | 'done' | 'sound' | null>(null);
  const priorityLabel = prefs.defaultPriority === 'high' ? text.high : prefs.defaultPriority === 'medium' ? text.medium : text.low;
  const doneLabel =
    prefs.completedVisibility === 'show' ? text.showCompleted : prefs.completedVisibility === 'dim' ? text.dimCompleted : text.hideCompleted;
  const soundLabel =
    prefs.notificationSound === 'chime' ? text.timerChime : prefs.notificationSound === 'bell' ? text.timerBell : prefs.notificationSound === 'none' ? text.timerSilent : text.soundSystem;

  return (
    <SettingsPage title={text.productivity}>
      <SettingsSection>
        <SettingsRow icon="calendar" label={text.weekStart} value={prefs.weekStartsOn === 'sunday' ? text.sunday : text.monday} onPress={() => setSheet('week')} />
        <StepperRow
          icon="clock"
          label={text.planningStart}
          value={clockMinutes(prefs.planningStart)}
          min={0}
          max={23 * 60 + 30}
          step={30}
          display={formatClock(prefs.planningStart)}
          onChange={(value) => void save({ planningStart: minutesToClock(value) })}
        />
        <SettingsRow icon="star" label={text.defaultPriority} value={priorityLabel} onPress={() => setSheet('priority')} />
        <StepperRow
          icon="timer"
          label={text.defaultDuration}
          value={prefs.defaultDuration}
          unit={text.minutes}
          min={15}
          max={180}
          step={15}
          onChange={(defaultDuration) => void save({ defaultDuration })}
        />
        <StepperRow icon="done" label={text.dailyGoal} value={prefs.dailyGoal} min={1} max={20} step={1} onChange={(dailyGoal) => void save({ dailyGoal })} />
        <SettingsRow icon="check" label={text.completedVisibility} value={doneLabel} onPress={() => setSheet('done')} border={false} />
      </SettingsSection>
      <SettingsSection title={text.notifications} footer={`${text.endOfDay}: ${formatClock('20:00')}. ${text.reminderFoot}`}>
        <ToggleRow icon="bell" label={text.taskReminders} value={prefs.taskReminders} onChange={(value) => void toggle('taskReminders', value)} />
        <ToggleRow icon="check" label={text.habitReminders} value={prefs.habitReminders} onChange={(value) => void toggle('habitReminders', value)} />
        <ToggleRow icon="sun" label={text.dailyPlanning} value={prefs.dailyPlanning} onChange={(value) => void toggle('dailyPlanning', value)} />
        <ToggleRow icon="moon" label={text.endOfDay} value={prefs.endOfDayReview} onChange={(value) => void toggle('endOfDayReview', value)} />
        <SettingsRow icon="speaker" label={text.sound} value={soundLabel} onPress={() => setSheet('sound')} />
        <ToggleRow icon="wave" label={text.vibration} value={prefs.notificationVibration} onChange={(value) => void toggle('notificationVibration', value)} border={false} />
      </SettingsSection>
      <OptionSheet
        visible={sheet === 'sound'}
        title={text.sound}
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
      <OptionSheet
        visible={sheet === 'week'}
        title={text.weekStart}
        selected={prefs.weekStartsOn}
        options={[
          { id: 'monday', label: text.monday },
          { id: 'sunday', label: text.sunday },
        ]}
        onClose={() => setSheet(null)}
        onSelect={(weekStartsOn) => {
          setSheet(null);
          void save({ weekStartsOn: weekStartsOn as Preferences['weekStartsOn'] });
        }}
      />
      <OptionSheet
        visible={sheet === 'priority'}
        title={text.defaultPriority}
        selected={prefs.defaultPriority}
        options={[
          { id: 'low', label: text.low },
          { id: 'medium', label: text.medium },
          { id: 'high', label: text.high },
        ]}
        onClose={() => setSheet(null)}
        onSelect={(defaultPriority) => {
          setSheet(null);
          void save({ defaultPriority: defaultPriority as Preferences['defaultPriority'] });
        }}
      />
      <OptionSheet
        visible={sheet === 'done'}
        title={text.completedVisibility}
        selected={prefs.completedVisibility}
        options={[
          { id: 'show', label: text.showCompleted },
          { id: 'dim', label: text.dimCompleted },
          { id: 'hide', label: text.hideCompleted },
        ]}
        onClose={() => setSheet(null)}
        onSelect={(completedVisibility) => {
          setSheet(null);
          void save({ completedVisibility: completedVisibility as Preferences['completedVisibility'] });
        }}
      />
    </SettingsPage>
  );
}
