import { Platform } from 'react-native';

type IconModule = typeof import('expo-alternate-app-icons');

let cached: Promise<IconModule | null> | null = null;

/**
 * Loads the native module on demand. Web, Expo Go, and dev builds made before the
 * package was added do not have it, so those cases resolve to `null` instead of crashing.
 */
function loadModule(): Promise<IconModule | null> {
  if (!cached) {
    cached = (async () => {
      if (Platform.OS === 'web') return null;
      try {
        const module = await import('expo-alternate-app-icons');
        return module.supportsAlternateIcons ? module : null;
      } catch {
        return null;
      }
    })();
  }
  return cached;
}

export async function appIconsAvailable() {
  return (await loadModule()) !== null;
}

/** The name of the icon currently on the home screen, or `null` for the original. */
export async function readAppIconName(): Promise<string | null> {
  const module = await loadModule();
  if (!module) return null;
  try {
    return module.getAppIconName();
  } catch {
    return null;
  }
}

/** Switches the home screen icon. Pass `null` to go back to the original. Throws when it fails. */
export async function changeAppIcon(name: string | null) {
  const module = await loadModule();
  if (!module) throw new Error('Alternate app icons are not available in this build.');
  await module.setAlternateAppIcon(name);
}
