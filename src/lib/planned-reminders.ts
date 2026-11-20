import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Preferences } from '@/data/preferences';
import { getCopy } from '@/i18n/translate';
import { configureReminderChannel, notificationSoundName, reminderChannelId } from '@/lib/reminders';

const PLANNING_ID = 'shughuli-daily-planning';
const REVIEW_ID = 'shughuli-end-of-day';

export async function syncPlannedReminders(prefs: Preferences) {
  if (Platform.OS === 'web') return;

  await cancelPlannedReminders();
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') return;

  try {
    await configureReminderChannel();
    if (prefs.dailyPlanning) {
      const [hour, minute] = prefs.planningStart.split(':').map(Number);
      const text = getCopy();
      await scheduleDaily(PLANNING_ID, hour, minute, prefs, {
        title: prefs.hideSensitive ? text.reminder : text.planYourDay,
        body: prefs.hideSensitive ? text.planningReady : text.planningBody,
      });
    }
    if (prefs.endOfDayReview) {
      const text = getCopy();
      await scheduleDaily(REVIEW_ID, 20, 0, prefs, {
        title: prefs.hideSensitive ? text.reminder : text.reviewYourDay,
        body: prefs.hideSensitive ? text.reviewReady : text.reviewBody,
      });
    }
  } catch {
    // A missed reminder should not block changing a setting.
  }
}

export async function cancelPlannedReminders() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(PLANNING_ID).catch(() => undefined);
  await Notifications.cancelScheduledNotificationAsync(REVIEW_ID).catch(() => undefined);
}

async function scheduleDaily(
  identifier: string,
  hour: number,
  minute: number,
  prefs: Preferences,
  message: { title: string; body: string },
) {
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: message.title,
      body: message.body,
      sound: notificationSoundName(prefs.notificationSound),
      vibrate: prefs.notificationVibration ? [0, 250, 200, 250] : undefined,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: reminderChannelId(prefs.notificationSound, prefs.notificationVibration),
    },
  });
}
