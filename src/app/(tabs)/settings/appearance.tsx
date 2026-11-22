import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ChoiceChips, OptionSheet, SettingsRow, SettingsSection, StepperRow, ToggleRow } from '@/components/settings/controls';
import { SettingsPage, clockMinutes, minutesToClock, settingsStyles, useSave } from '@/components/settings/page';
import { ACCENTS, type Preferences } from '@/data/preferences';
import { formatClock, formatDate } from '@/data/model';
import { CATALOG_LANGUAGES } from '@/i18n/languages';
import { useSettingsTheme } from '@/hooks/use-settings-theme';
import { deviceLanguageLabel, languageEndonym, useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

export default function AppearanceScreen() {
  const text = useCopy();
  const theme = useSettingsTheme();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();
  const [sheet, setSheet] = useState<'language' | 'time' | 'date' | 'week' | 'priority' | 'done' | null>(null);
  const priorityLabel = prefs.defaultPriority === 'high' ? text.high : prefs.defaultPriority === 'medium' ? text.medium : text.low;
  const doneLabel =
    prefs.completedVisibility === 'show' ? text.showCompleted : prefs.completedVisibility === 'dim' ? text.dimCompleted : text.hideCompleted;

  return (
    <SettingsPage title={text.appearance}>
      <SettingsSection footer={`${text.themeHint}\n\n${text.languageFoot}`}>
        <View style={settingsStyles.block}>
          <ChoiceChips
            value={prefs.theme}
            onChange={(themeChoice) => void save({ theme: themeChoice })}
            options={[
              { id: 'light', label: text.themeLight },
              { id: 'dark', label: text.themeDark },
              { id: 'system', label: text.themeSystem },
            ]}
          />
        </View>
        <Text style={[settingsStyles.blockLabel, { color: theme.colors.muted, fontSize: 13 * theme.scale }]}>{text.accent}</Text>
        <View style={settingsStyles.dots}>
          {ACCENTS.map((item) => {
            const selected = prefs.accent === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.id}
                accessibilityState={{ selected }}
                onPress={() => void save({ accent: item.id })}
                style={[settingsStyles.dot, { backgroundColor: item.color }, selected && { borderColor: theme.colors.ink }]}
              />
            );
          })}
        </View>
        <Text style={[settingsStyles.blockLabel, { color: theme.colors.muted, fontSize: 13 * theme.scale }]}>{text.fontSize}</Text>
        <ChoiceChips
          value={prefs.fontSize}
          onChange={(fontSize) => void save({ fontSize })}
          options={[
            { id: 'small', label: text.fontSmall },
            { id: 'default', label: text.fontDefault },
            { id: 'large', label: text.fontLarge },
          ]}
        />
        <ToggleRow icon="type" label={text.reduceMotion} value={prefs.reduceMotion} onChange={(reduceMotion) => void save({ reduceMotion })} />
        <SettingsRow
          icon="globe"
          label={text.language}
          value={prefs.language === 'system' ? `${text.sameAsPhone} · ${deviceLanguageLabel()}` : languageEndonym(prefs.language)}
          onPress={() => setSheet('language')}
        />
        <SettingsRow icon="clock" label={text.timeFormat} value={prefs.timeFormat === '24' ? text.hour24 : text.hour12} onPress={() => setSheet('time')} />
        <SettingsRow
          icon="calendar"
          label={text.dateFormat}
          value={formatDate(new Date(2026, 10, 18), prefs.dateFormat)}
          onPress={() => setSheet('date')}
          border={false}
        />
      </SettingsSection>
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
        <SettingsRow icon="check" label={text.completedVisibility} value={doneLabel} onPress={() => setSheet('done')} border={false} />
      </SettingsSection>
      <OptionSheet
        visible={sheet === 'language'}
        title={text.language}
        selected={prefs.language}
        options={[
          { id: 'system', label: `${text.sameAsPhone} · ${deviceLanguageLabel()}` },
          ...CATALOG_LANGUAGES.map((id) => ({ id, label: languageEndonym(id) })).sort((a, b) =>
            a.label.localeCompare(b.label),
          ),
        ]}
        onClose={() => setSheet(null)}
        onSelect={(language) => {
          setSheet(null);
          void save({ language: language as Preferences['language'], languagePicked: true });
        }}
      />
      <OptionSheet
        visible={sheet === 'time'}
        title={text.timeFormat}
        selected={prefs.timeFormat}
        options={[
          { id: '12', label: text.hour12 },
          { id: '24', label: text.hour24 },
        ]}
        onClose={() => setSheet(null)}
        onSelect={(timeFormat) => {
          setSheet(null);
          void save({ timeFormat: timeFormat as Preferences['timeFormat'] });
        }}
      />
      <OptionSheet
        visible={sheet === 'date'}
        title={text.dateFormat}
        selected={prefs.dateFormat}
        options={[
          { id: 'dmy', label: formatDate(new Date(2026, 10, 18), 'dmy') },
          { id: 'mdy', label: formatDate(new Date(2026, 10, 18), 'mdy') },
          { id: 'ymd', label: formatDate(new Date(2026, 10, 18), 'ymd') },
        ]}
        onClose={() => setSheet(null)}
        onSelect={(dateFormat) => {
          setSheet(null);
          void save({ dateFormat: dateFormat as Preferences['dateFormat'] });
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
