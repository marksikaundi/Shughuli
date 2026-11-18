import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { defaultPreferences, sanitizePreferences, type Preferences } from '@/data/preferences';

const STORAGE_KEY = 'shughuli.settings';

function settingsFile() {
  return new File(new Directory(Paths.document, 'shughuli'), 'settings.json');
}

export async function readPreferences(): Promise<Preferences> {
  try {
    const raw = readRaw();
    if (!raw) return defaultPreferences;
    const parsed = JSON.parse(raw) as { prefs?: unknown };
    return sanitizePreferences(parsed.prefs ?? parsed);
  } catch {
    return defaultPreferences;
  }
}

export async function writePreferences(prefs: Preferences) {
  const payload = JSON.stringify({ version: 1, prefs });
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(STORAGE_KEY, payload);
    return;
  }

  const folder = new Directory(Paths.document, 'shughuli');
  if (!folder.exists) folder.create({ intermediates: true, idempotent: true });
  const file = settingsFile();
  if (!file.exists) file.create();
  file.writeSync(payload);
}

function readRaw() {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
  }
  const file = settingsFile();
  if (!file.exists) return null;
  return file.textSync();
}
