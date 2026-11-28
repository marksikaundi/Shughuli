import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { taskMoment, type Task } from '@/data/model';
import { getCopy } from '@/i18n/translate';
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

  Notifications.addNotificationResponseReceivedListener((response) => {
    if (response.actionIdentifier !== 'snooze') return;
    const minutes = getRuntimePrefs().snoozeMinutes;
    const content = response.notification.request.content;
    const when = new Date(Date.now() + minutes * 60 * 1000);
    void Notifications.scheduleNotificationAsync({
      content: {
        title: content.title ?? getCopy().reminder,
        body: content.body ?? getCopy().somethingDue,
        data: content.data,
        sound: notificationSoundName(getRuntimePrefs().notificationSound),
        categoryIdentifier: 'shughuliReminder',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: when,
        channelId: reminderChannelId(getRuntimePrefs().notificationSound, getRuntimePrefs().notificationVibration),
      },
    });
  });
}

export function notificationSoundName(sound: ReminderSound): string | false {
  if (sound === 'none') return false;
  if (sound === 'chime') return 'shughuli_chime.wav';
  if (sound === 'bell') return 'shughuli_bell.wav';
  return 'default';
}

export function reminderChannelId(sound: ReminderSound, vibrate: boolean) {
  return `shughuli-${sound}-${vibrate ? 'vibrate' : 'still'}`;
}

export async function registerReminderActions() {
  if (Platform.OS === 'web') return;
  await Notifications.setNotificationCategoryAsync('shughuliReminder', [
    {
      identifier: 'snooze',
      buttonTitle: getCopy().snooze,
      options: { opensAppToForeground: false, isAuthenticationRequired: false, isDestructive: false },
    },
  ]);
}

export async function prepareReminders() {
  if (Platform.OS === 'web') return false;

  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.status !== 'granted') return false;
    await registerReminderActions();
    await configureReminderChannel();
    return true;
  } catch {
    return false;
  }
}

export async function ensureReminderPermission() {
  if (Platform.OS === 'web') return false;

  try {
    const current = await Notifications.getPermissionsAsync();
    const status =
      current.status === 'granted'
        ? current.status
        : (
            await Notifications.requestPermissionsAsync({
              ios: { allowAlert: true, allowBadge: false, allowSound: true },
            })
          ).status;
    if (status !== 'granted') return false;
    await registerReminderActions();
    await configureReminderChannel();
    return true;
  } catch {
    return false;
  }
}

export async function configureReminderChannel() {
  if (Platform.OS !== 'android') return;

  const prefs = getRuntimePrefs();
  const sound = notificationSoundName(prefs.notificationSound);
  await Notifications.setNotificationChannelAsync(reminderChannelId(prefs.notificationSound, prefs.notificationVibration), {
    name: getCopy().taskRemindersChannel,
    importance: prefs.notificationSound === 'none' ? AndroidImportance.DEFAULT : AndroidImportance.HIGH,
    sound: sound === false ? null : sound,
    enableVibrate: prefs.notificationVibration,
    vibrationPattern: prefs.notificationVibration ? [0, 250, 200, 250] : null,
  });
}

export async function scheduleTaskReminder(task: Task) {
  if (Platform.OS === 'web' || task.status === 'done') return null;
  const prefs = getRuntimePrefs();
  const urgent = prefs.urgentAlerts === 'time' && task.priority === 'high';
  if (!prefs.taskReminders && !urgent && task.remind !== true) return null;

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
        title: hidden ? getCopy().reminder : task.title,
        body: hidden ? getCopy().somethingDue : task.description.trim() || getCopy().taskDueNow,
        sound,
        vibrate: prefs.notificationVibration ? [0, 250, 200, 250] : undefined,
        categoryIdentifier: 'shughuliReminder',
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
