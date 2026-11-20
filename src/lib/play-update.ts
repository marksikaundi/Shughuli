import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import { addUpdateListener, checkForUpdate, startUpdate } from 'expo-in-app-updates';

import { getCopy } from '@/i18n/translate';

export const ANDROID_PACKAGE = 'shughuli.com';
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

const CHANNEL_ID = 'shughuli-play-updates';
const NOTIFICATION_ID = 'shughuli-play-update';
const CATEGORY_ID = 'playupdate';
const OPEN_STORE_ACTION = 'openplaystore';

let notifiedVersion: string | null = null;

export function playUpdatesSupported() {
  return Platform.OS === 'android' && !__DEV__;
}

export async function openPlayStore() {
  await Linking.openURL(PLAY_STORE_URL);
}

export async function readPlayUpdate() {
  const result = await checkForUpdate();
  return {
    updateAvailable: result.updateAvailable || Boolean(result.updateInProgress),
    storeVersion: result.storeVersion ?? null,
    updateInProgress: Boolean(result.updateInProgress),
    immediateAllowed: result.immediateAllowed !== false,
  };
}

export function startImmediateUpdate() {
  return startUpdate(true);
}

export function watchUpdateCancelled(onCancel: () => void) {
  return addUpdateListener('updateCancelled', () => {
    onCancel();
  });
}

export function isPlayStoreNotification(data: Record<string, unknown> | undefined, actionIdentifier: string) {
  return data?.kind === 'play-update' && actionIdentifier === OPEN_STORE_ACTION;
}

export async function notifyPlayUpdate(storeVersion: string | null) {
  const key = storeVersion ?? 'available';
  if (notifiedVersion === key) return;

  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.status !== 'granted') return;

    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: getCopy().appUpdatesChannel,
      importance: AndroidImportance.HIGH,
      sound: 'default',
      enableVibrate: true,
      vibrationPattern: [0, 200, 120, 200],
    });
    await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
      {
        identifier: OPEN_STORE_ACTION,
        buttonTitle: getCopy().openPlayStore,
        options: { opensAppToForeground: true },
      },
    ]);

    notifiedVersion = key;
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: {
        title: getCopy().updateTitle,
        body: getCopy().updateNotice,
        categoryIdentifier: CATEGORY_ID,
        data: { kind: 'play-update', url: PLAY_STORE_URL },
      },
      trigger: { channelId: CHANNEL_ID },
    });
  } catch {
    notifiedVersion = null;
  }
}
