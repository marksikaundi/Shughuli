import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { taskMoment, type Task } from '@/data/model';
import { getRuntimePrefs, type ReminderSound } from '@/lib/runtime-prefs';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => {
      const audible = getRuntimePrefs().notificationSound !== 'none';
      return {
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: audible,
        shouldSetBadge: false,
      };
    },
  });
}

export function notificationSoundName(sound: ReminderSound): string | false {
  if (sound === 'none') return false;
  if (sound === 'chime') return 'shughuli-chime.wav';
  if (sound === 'bell') return 'shughuli-bell.wav';
  return 'default';
}

export function reminderChannelId(sound: ReminderSound, vibrate: boolean) {
  return `shughuli-${sound}-${vibrate ? 'vibrate' : 'still'}`;
}

export async function prepareReminders() {
  if (Platform.OS === 'web') return false;

  try {
    await configureReminderChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'granted') return true;
    const asked = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
    return asked.status === 'granted';
  } catch {
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
  if (Platform.OS !== 'android') return;

  const prefs = getRuntimePrefs();
  const sound = notificationSoundName(prefs.notificationSound);
  await Notifications.setNotificationChannelAsync(reminderChannelId(prefs.notificationSound, prefs.notificationVibration), {
    name: 'Task reminders',
    importance: prefs.notificationSound === 'none' ? AndroidImportance.DEFAULT : AndroidImportance.HIGH,
    sound: sound === false ? null : sound,
    enableVibrate: prefs.notificationVibration,
    vibrationPattern: prefs.notificationVibration ? [0, 250, 200, 250] : null,
  });
}

export async function scheduleTaskReminder(task: Task) {
  if (Platform.OS === 'web' || task.status === 'done') return null;
  const prefs = getRuntimePrefs();
  if (!prefs.taskReminders) return null;

  const when = taskMoment(task.date, task.start);
  if (when.getTime() <= Date.now()) return null;

  try {
    const allowed = await ensureReminderPermission();
    if (!allowed) return null;
    await configureReminderChannel();

    const hidden = prefs.hideSensitive;
    const sound = notificationSoundName(prefs.notificationSound);
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: hidden ? 'Reminder' : task.title,
        body: hidden ? 'Something on your list is due.' : task.description.trim() || 'This task is due now.',
        sound,
        vibrate: prefs.notificationVibration ? [0, 250, 200, 250] : undefined,
        data: { taskId: task.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: when,
        channelId: reminderChannelId(prefs.notificationSound, prefs.notificationVibration),
      },
    });
  } catch {
    return null;
  }
}
