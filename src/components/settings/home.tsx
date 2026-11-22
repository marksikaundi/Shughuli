import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Night } from '@/constants/night';
import { Layout } from '@/constants/palette';
import { type AppTintId, type ColorThemeId } from '@/data/preferences';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

export function SettingsHome({ onClose }: { onClose?: () => void }) {
  const text = useCopy();
  const insets = useSafeAreaInsets();
  const colorTheme = usePreferencesStore((state) => state.prefs.colorTheme);
  const appTint = usePreferencesStore((state) => state.prefs.appTint);
  const themeLabel = colorThemeLabel(colorTheme, text);
  const tintLabel = appTintLabel(appTint, text);

  return (
    <Screen tone="night">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + Layout.tabClearance,
          paddingHorizontal: 16,
        }}>
        <View style={styles.header}>
          <View style={styles.side} />
          <Text style={styles.title}>{text.settings}</Text>
          {onClose ? (
            <Pressable accessibilityRole="button" accessibilityLabel={text.save} onPress={onClose} style={styles.check}>
              <Icon name="check" size={16} color={Night.text} />
            </Pressable>
          ) : (
            <View style={styles.side} />
          )}
        </View>

        <View style={styles.card}>
          <SettingRow icon="settings" label={text.general} onPress={() => router.push('/settings/appearance')} />
          <SettingRow icon="calendar" label={text.tabCalendar} onPress={() => router.push('/settings/calendar')} last />
        </View>

        <Text style={styles.section}>{text.personalization}</Text>
        <View style={styles.card}>
          <SettingRow icon="palette" label={text.theme} value={themeLabel} onPress={() => openItem('theme')} />
          <SettingRow icon="appIcon" label={text.appIcon} value={tintLabel} onPress={() => openItem('appIcon')} />
          <SettingRow icon="list" label={text.navigation} onPress={() => openItem('navigation')} />
          <SettingRow icon="plusBox" label={text.quickAdd} onPress={() => openItem('quickAdd')} last />
        </View>

        <Text style={styles.section}>{text.productivity}</Text>
        <View style={styles.card}>
          <SettingRow icon="trend" label={text.productivity} onPress={() => router.push({ pathname: '/settings/productivity', params: { part: 'plan' } })} />
          <SettingRow icon="alarm" label={text.reminders} onPress={() => router.push({ pathname: '/settings/productivity', params: { part: 'reminders' } })} />
          <SettingRow icon="bell" label={text.notificationRow} onPress={() => router.push({ pathname: '/settings/productivity', params: { part: 'notifications' } })} last />
        </View>

        <View style={styles.card}>
          <SettingRow icon="help" label={text.helpFeedback} onPress={() => router.push('/about')} />
          <SettingRow icon="info" label={text.aboutRow} onPress={() => router.push('/about')} />
          <SettingRow icon="gift" label={text.whatsNew} onPress={() => openItem('whatsNew')} last />
        </View>
      </ScrollView>
    </Screen>
  );
}

function colorThemeLabel(id: ColorThemeId, text: ReturnType<typeof useCopy>) {
  if (id === 'moonstone') return text.themeMoonstone;
  if (id === 'tangerine') return text.themeTangerine;
  if (id === 'lavender') return text.themeLavender;
  if (id === 'blueberry') return text.themeBlueberry;
  if (id === 'kale') return text.themeKale;
  if (id === 'raspberry') return text.themeRaspberry;
  return text.themeShughuli;
}

function appTintLabel(id: AppTintId, text: ReturnType<typeof useCopy>) {
  if (id === 'lime') return text.tintLime;
  if (id === 'blue') return text.tintBlue;
  if (id === 'rose') return text.tintRose;
  if (id === 'violet') return text.tintViolet;
  if (id === 'moonstone') return text.themeMoonstone;
  if (id === 'tangerine') return text.themeTangerine;
  if (id === 'lavender') return text.themeLavender;
  if (id === 'blueberry') return text.themeBlueberry;
  if (id === 'kale') return text.themeKale;
  if (id === 'raspberry') return text.themeRaspberry;
  return text.tintCoral;
}

function openItem(id: 'theme' | 'appIcon' | 'navigation' | 'quickAdd' | 'whatsNew') {
  router.push({ pathname: '/settings/item', params: { id } });
}

function SettingRow({
  icon,
  label,
  value,
  onPress,
  last = false,
}: {
  icon: IconName;
  label: string;
  value?: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <Icon name={icon} size={22} color={Night.accent} />
        <Text style={styles.rowLabel} numberOfLines={1}>
          {label}
        </Text>
        {value ? (
          <Text style={styles.rowValue} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
        <Icon name="chevron" size={16} color={Night.faint} />
      </Pressable>
      {last ? null : <View style={styles.rowLine} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: {
    width: 36,
  },
  title: {
    color: Night.text,
    fontSize: 17,
    fontWeight: 700,
  },
  check: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Night.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: Night.row,
    overflow: 'hidden',
  },
  section: {
    marginTop: 26,
    marginBottom: -6,
    marginLeft: 4,
    color: Night.muted,
    fontSize: 16,
    fontWeight: 700,
  },
  row: {
    minHeight: 54,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rowLine: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 50,
    backgroundColor: '#3A3A3A',
  },
  rowLabel: {
    flex: 1,
    color: Night.text,
    fontSize: 16,
    fontWeight: 600,
  },
  rowValue: {
    maxWidth: 120,
    color: Night.muted,
    fontSize: 16,
    fontWeight: 500,
  },
  pressed: {
    opacity: 0.72,
  },
});
