import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ChoiceChips, OptionSheet, SettingsRow, SettingsSection, ToggleRow } from '@/components/settings/controls';
import { SettingsPage, settingsStyles, useSave } from '@/components/settings/page';
import { ACCENTS, type Preferences } from '@/data/preferences';
import { formatDate } from '@/data/model';
import { CATALOG_LANGUAGES } from '@/i18n/languages';
import { useSettingsTheme } from '@/hooks/use-settings-theme';
import { deviceLanguageLabel, languageEndonym, useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

export default function AppearanceScreen() {
  const text = useCopy();
  const theme = useSettingsTheme();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();
  const [sheet, setSheet] = useState<'language' | 'time' | 'date' | null>(null);

  return (
    <SettingsPage title={text.appearance}>
      <SettingsSection footer={text.themeHint}>
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
    </SettingsPage>
  );
}
