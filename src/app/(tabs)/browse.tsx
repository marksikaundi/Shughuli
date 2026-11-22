import { SettingsHome } from '@/components/settings/home';
import { useNightStatus } from '@/components/screen';

export default function BrowseScreen() {
  useNightStatus();
  return <SettingsHome />;
}
