import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/floating-tab-bar';
import { useCopy } from '@/lib/settings-copy';

export default function TabLayout() {
  const text = useCopy();
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
      <Tabs.Screen name="index" options={{ title: text.tabHome }} />
      <Tabs.Screen name="projects" options={{ title: text.tabProjects }} />
      <Tabs.Screen name="calendar" options={{ title: text.tabCalendar }} />
      <Tabs.Screen name="settings" options={{ title: text.tabSettings }} />
    </Tabs>
  );
}
