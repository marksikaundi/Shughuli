import { Stack } from 'expo-router';

import { usePreferencesStore } from '@/store/preferences';

export const unstable_settings = {
  anchor: 'index',
};

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
