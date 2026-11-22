import { Stack } from 'expo-router';

import { usePreferencesStore } from '@/store/preferences';

export default function SettingsLayout() {
  const reduceMotion = usePreferencesStore((state) => state.prefs.reduceMotion);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: reduceMotion ? 'none' : 'default',
        contentStyle: { backgroundColor: '#FBF6F3' },
      }}
    />
  );
}
