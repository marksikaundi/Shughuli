import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Preferences } from '@/data/preferences';
import { configureReminderChannel } from '@/lib/reminders';

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
      await scheduleDaily(PLANNING_ID, hour, minute, prefs, {
        title: prefs.hideSensitive ? 'Reminder' : 'Plan your day',
        body: prefs.hideSensitive
          ? 'Your planning reminder is ready.'
          : 'A quiet moment to set today’s tasks.',
      });
    }
    if (prefs.endOfDayReview) {
      await scheduleDaily(REVIEW_ID, 20, 0, prefs, {
        title: prefs.hideSensitive ? 'Reminder' : 'Review your day',
        body: prefs.hideSensitive ? 'Your end-of-day reminder is ready.' : 'Look back at what you finished today.',
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
      sound: prefs.notificationSound,
      vibrate: prefs.notificationVibration ? [0, 250, 200, 250] : undefined,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'reminders',
    },
  });
}
