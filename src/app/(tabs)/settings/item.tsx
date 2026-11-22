import Constants from 'expo-constants';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NightCard, NightChoice, NightFoot, NightPage, NightSwitch } from '@/components/settings/night-page';
import { useSave } from '@/components/settings/page';
import { Night } from '@/constants/night';
import { APP_TINTS, appTintById, type AppTintId } from '@/data/preferences';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

const ITEMS = ['theme', 'appIcon', 'navigation', 'quickAdd', 'whatsNew'] as const;

type ItemId = (typeof ITEMS)[number];

export default function SettingsItemScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id: ItemId = ITEMS.find((item) => item === params.id) ?? 'theme';
  if (id === 'appIcon') return <AppIconPanel />;
  if (id === 'navigation') return <NavigationPanel />;
  if (id === 'quickAdd') return <QuickAddPanel />;
  if (id === 'whatsNew') return <WhatsNewPanel />;
  return <ThemePanel />;
}

function ThemePanel() {
  const text = useCopy();
  const theme = usePreferencesStore((state) => state.prefs.theme);
  const save = useSave();
  const options = [
    { id: 'light' as const, label: text.themeLight },
    { id: 'dark' as const, label: text.themeDark },
    { id: 'system' as const, label: text.themeSystem },
  ];

  return (
    <NightPage title={text.theme}>
      <NightCard>
        {options.map((option, index) => (
          <NightChoice
            key={option.id}
            label={option.label}
            selected={theme === option.id}
            last={index === options.length - 1}
            onPress={() => void save({ theme: option.id })}
          />
        ))}
      </NightCard>
      <NightFoot>{text.themeHint}</NightFoot>
    </NightPage>
  );
}

function AppIconPanel() {
  const text = useCopy();
  const tint = usePreferencesStore((state) => state.prefs.appTint);
  const save = useSave();
  const names: Record<AppTintId, string> = {
    coral: text.tintCoral,
    lime: text.tintLime,
    blue: text.tintBlue,
    rose: text.tintRose,
    violet: text.tintViolet,
  };

  return (
    <NightPage title={text.appIcon}>
      <View style={styles.preview}>
        <View style={[styles.mark, { backgroundColor: appTintById(tint).color }]}>
          <Text style={styles.markLetter}>S</Text>
        </View>
        <Text style={styles.previewName}>{names[tint]}</Text>
      </View>
      <NightCard>
        <View style={styles.swatches}>
          {APP_TINTS.map((item) => {
            const selected = tint === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={names[item.id]}
                accessibilityState={{ selected }}
                onPress={() => void save({ appTint: item.id })}
                style={[styles.swatch, { backgroundColor: item.color }, selected && styles.swatchOn]}>
              </Pressable>
            );
          })}
        </View>
      </NightCard>
      <NightFoot>{text.appTintFoot}</NightFoot>
    </NightPage>
  );
}

function NavigationPanel() {
  const text = useCopy();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();

  return (
    <NightPage title={text.navigation}>
      <NightCard>
        <NightSwitch label={text.showTabLabels} value={prefs.showTabLabels} onChange={(showTabLabels) => void save({ showTabLabels })} />
        <NightSwitch label={text.inbox} value={prefs.showInboxTab} onChange={(showInboxTab) => void save({ showInboxTab })} />
        <NightSwitch label={text.today} value={prefs.showTodayTab} onChange={(showTodayTab) => void save({ showTodayTab })} />
        <NightSwitch label={text.upcoming} value={prefs.showUpcomingTab} onChange={(showUpcomingTab) => void save({ showUpcomingTab })} last />
      </NightCard>
      <NightFoot>{text.navigationKeep}</NightFoot>
    </NightPage>
  );
}

function QuickAddPanel() {
  const text = useCopy();
  const prefs = usePreferencesStore((state) => state.prefs);
  const save = useSave();

  return (
    <NightPage title={text.quickAdd}>
      <NightCard>
        <NightSwitch label={text.priority} value={prefs.quickAddPriority} onChange={(quickAddPriority) => void save({ quickAddPriority })} />
        <NightSwitch label={text.project} value={prefs.quickAddProject} onChange={(quickAddProject) => void save({ quickAddProject })} />
        <NightSwitch label={text.dueDate} value={prefs.quickAddDate} onChange={(quickAddDate) => void save({ quickAddDate })} last />
      </NightCard>
      <NightFoot>{text.quickAddFoot}</NightFoot>
    </NightPage>
  );
}

function WhatsNewPanel() {
  const text = useCopy();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <NightPage title={text.whatsNew}>
      <Text style={styles.version}>Shughuli {version}</Text>
      <NightCard>
        <Text style={styles.note}>{text.whatsNewBody}</Text>
      </NightCard>
    </NightPage>
  );
}

const styles = StyleSheet.create({
  preview: {
    marginTop: 28,
    alignItems: 'center',
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLetter: {
    color: '#1A1A1A',
    fontSize: 32,
    fontWeight: 700,
  },
  previewName: {
    marginTop: 12,
    color: Night.text,
    fontSize: 16,
    fontWeight: 700,
  },
  swatches: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchOn: {
    borderColor: Night.text,
  },
  version: {
    marginTop: 28,
    color: Night.text,
    fontSize: 17,
    fontWeight: 600,
    textAlign: 'center',
  },
  note: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: Night.text,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
});
