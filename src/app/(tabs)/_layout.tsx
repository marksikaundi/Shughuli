import { router, Tabs } from 'expo-router';
import { useEffect } from 'react';

import { FloatingTabBar } from '@/components/floating-tab-bar';
import { useCopy } from '@/lib/settings-copy';
import { usePreferencesStore } from '@/store/preferences';

export default function TabLayout() {
  const text = useCopy();
  useEffect(() => {
    const prefs = usePreferencesStore.getState().prefs;
    if (!prefs.syncHomeView || prefs.homeView === 'inbox') return;
    router.navigate(prefs.homeView === 'upcoming' ? '/calendar' : '/projects');
  }, []);
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          height: 0,
          backgroundColor: 'transparent',
        },
      }}>
      <Tabs.Screen name="index" options={{ title: text.inbox }} />
      <Tabs.Screen name="projects" options={{ title: text.today }} />
      <Tabs.Screen name="calendar" options={{ title: text.upcoming }} />
      <Tabs.Screen name="browse" options={{ title: text.tabSettings }} />
    </Tabs>
  );
}
