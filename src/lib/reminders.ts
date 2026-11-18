import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { taskMoment, type Task } from '@/data/model';
import { getRuntimePrefs } from '@/lib/runtime-prefs';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: getRuntimePrefs().notificationSound,
      shouldSetBadge: false,
    }),
  });
}

let channelReady = Platform.OS !== 'android';

export async function prepareReminders() {
  if (Platform.OS === 'web') return false;

  try {
    await configureReminderChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'granted') return true;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.status === 'granted';
  } catch {
    channelReady = false;
    return false;
  }
}

export async function ensureReminderPermission() {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') {
    await configureReminderChannel();
    return true;
  }
  return prepareReminders();
}

export async function configureReminderChannel() {
  if (Platform.OS !== 'android') {
    channelReady = true;
    return;
  }

  const prefs = getRuntimePrefs();
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Reminders',
    importance: AndroidImportance.DEFAULT,
    sound: prefs.notificationSound ? 'default' : null,
    enableVibrate: prefs.notificationVibration,
    vibrationPattern: prefs.notificationVibration ? [0, 250, 200, 250] : null,
  });
  channelReady = true;
}

export async function scheduleTaskReminder(task: Task) {
  if (Platform.OS === 'web') return null;
  const prefs = getRuntimePrefs();
  if (!prefs.taskReminders) return null;

  const when = taskMoment(task.date, task.start);
  if (when.getTime() <= Date.now() + 60_000) return null;

  try {
    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== 'granted') return null;

    const hidden = prefs.hideSensitive;
    const body = task.description || (task.project ? `${task.project} starts soon` : 'Starts soon');
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: hidden ? 'Reminder' : task.title,
        body: hidden ? 'Something on your list is coming up.' : body,
        sound: prefs.notificationSound,
        vibrate: prefs.notificationVibration ? [0, 250, 200, 250] : undefined,
        data: { taskId: task.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: when,
        ...(channelReady ? { channelId: 'reminders' } : {}),
      },
    });
  } catch {
    return null;
  }
}
