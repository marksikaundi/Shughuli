import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { taskMoment, type Task } from '@/data/model';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

let channelReady = Platform.OS !== 'android';

export async function prepareReminders() {
  if (Platform.OS === 'web') return;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Task reminders',
        importance: AndroidImportance.DEFAULT,
      });
      channelReady = true;
    }

    const current = await Notifications.getPermissionsAsync();
    if (current.status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  } catch {
    channelReady = false;
  }
}

export async function scheduleTaskReminder(task: Task) {
  if (Platform.OS === 'web') return null;

  const when = taskMoment(task.date, task.start);
  if (when.getTime() <= Date.now() + 60_000) return null;

  try {
    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== 'granted') return null;

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: task.title,
        body: task.description || `${task.project} starts soon`,
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
