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
      <Tabs.Screen name="index" options={{ title: text.inbox }} />
      <Tabs.Screen name="projects" options={{ title: text.today }} />
      <Tabs.Screen name="calendar" options={{ title: text.upcoming }} />
      <Tabs.Screen name="browse" options={{ title: text.tabSettings }} />
      <Tabs.Screen name="settings" options={{ href: null, title: text.tabSettings }} />
    </Tabs>
  );
}
