import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

import { SettingsPage } from '@/components/settings/page';
import { useSettingsTheme } from '@/hooks/use-settings-theme';
import { useCopy } from '@/lib/settings-copy';

const ITEMS = ['appIcon', 'navigation', 'quickAdd'] as const;

type ItemId = (typeof ITEMS)[number];

export default function SettingsItemScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const text = useCopy();
  const theme = useSettingsTheme();
  const id: ItemId = ITEMS.find((item) => item === params.id) ?? 'appIcon';
  const bodies: Record<ItemId, string> = {
    appIcon: text.appIconBody,
    navigation: text.navigationBody,
    quickAdd: text.quickAddBody,
  };

  return (
    <SettingsPage title={text[id]}>
      <Text style={{ marginTop: 8, color: theme.colors.muted, fontSize: 16 * theme.scale, lineHeight: 24 * theme.scale }}>{bodies[id]}</Text>
    </SettingsPage>
  );
}
