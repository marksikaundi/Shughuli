import { Text } from 'react-native';

import { ChoiceChips, SettingsSection, StepperRow, ToggleRow } from '@/components/settings/controls';
import { SettingsPage, settingsStyles, useReminderToggle, useSave } from '@/components/settings/page';
import { useSettingsTheme } from '@/hooks/use-settings-theme';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

export default function FocusScreen() {
  const text = useCopy();
  const theme = useSettingsTheme();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();
  const toggle = useReminderToggle();

  return (
    <SettingsPage title={text.focus}>
      <SettingsSection footer={text.focusFoot}>
        <StepperRow icon="timer" label={text.workDuration} value={prefs.workMinutes} unit={text.minutes} min={15} max={60} step={5} onChange={(workMinutes) => void save({ workMinutes })} />
        <StepperRow icon="clock" label={text.shortBreak} value={prefs.shortBreakMinutes} unit={text.minutes} min={1} max={20} step={1} onChange={(shortBreakMinutes) => void save({ shortBreakMinutes })} />
        <StepperRow icon="moon" label={text.longBreak} value={prefs.longBreakMinutes} unit={text.minutes} min={5} max={45} step={5} onChange={(longBreakMinutes) => void save({ longBreakMinutes })} />
        <StepperRow icon="restore" label={text.longBreakEvery} value={prefs.longBreakInterval} unit={text.sessions} min={2} max={8} step={1} onChange={(longBreakInterval) => void save({ longBreakInterval })} />
        <ToggleRow icon="clock" label={text.autoStartBreaks} value={prefs.autoStartBreaks} onChange={(autoStartBreaks) => void save({ autoStartBreaks })} />
        <ToggleRow icon="timer" label={text.autoStartFocus} value={prefs.autoStartFocus} onChange={(autoStartFocus) => void save({ autoStartFocus })} />
        <ToggleRow icon="sun" label={text.keepAwake} value={prefs.keepAwake} onChange={(keepAwake) => void save({ keepAwake })} />
        <ToggleRow icon="bell" label={text.focusNotifications} value={prefs.focusNotifications} onChange={(value) => void toggle('focusNotifications', value)} />
        <Text style={[settingsStyles.soundLabel, { color: theme.colors.muted, fontSize: 13 * theme.scale }]}>{text.timerSound}</Text>
        <ChoiceChips
          value={prefs.timerSound}
          onChange={(timerSound) => void save({ timerSound })}
          options={[
            { id: 'chime', label: text.timerChime },
            { id: 'bell', label: text.timerBell },
            { id: 'none', label: text.timerSilent },
          ]}
        />
      </SettingsSection>
    </SettingsPage>
  );
}
