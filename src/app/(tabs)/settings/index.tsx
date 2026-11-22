import { router } from 'expo-router';

import { useNightStatus } from '@/components/screen';
import { SettingsHome } from '@/components/settings/home';

export default function SettingsScreen() {
  useNightStatus();
  return <SettingsHome onClose={() => router.back()} />;
}
