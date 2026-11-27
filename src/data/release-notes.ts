import type { IconName } from '@/components/icon';
import type { SettingsCopy } from '@/i18n/messages';

export type ReleaseFeature = {
  icon: IconName;
  title: keyof SettingsCopy;
  body: keyof SettingsCopy;
};

export type Release = {
  version: string;
  features: ReleaseFeature[];
};

// Newest first. To announce a new version, add an entry here with the matching
// version from app.json and add its title/body keys to messages.ts (en and sw).
export const RELEASES: Release[] = [
  {
    version: '1.0.0',
    features: [
      { icon: 'inbox', title: 'featureViewsTitle', body: 'featureViewsBody' },
      { icon: 'plusBox', title: 'featureQuickAddTitle', body: 'featureQuickAddBody' },
      { icon: 'calendar', title: 'featureCalendarTitle', body: 'featureCalendarBody' },
      { icon: 'alarm', title: 'featureRemindersTitle', body: 'featureRemindersBody' },
      { icon: 'timer', title: 'featureFocusTitle', body: 'featureFocusBody' },
      { icon: 'palette', title: 'featureThemesTitle', body: 'featureThemesBody' },
      { icon: 'lock', title: 'featureLockTitle', body: 'featureLockBody' },
      { icon: 'download', title: 'featureBackupTitle', body: 'featureBackupBody' },
    ],
  },
];
