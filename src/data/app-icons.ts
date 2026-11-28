import type { ImageSourcePropType } from 'react-native';

import type { AppTintId } from '@/data/preferences';

export type AppIconChoice = {
  id: 'default' | AppTintId;
  /** Name registered with expo-alternate-app-icons in app.json. `null` is the original icon. */
  name: string | null;
  tint: AppTintId | null;
  image: ImageSourcePropType;
};

/**
 * Keep the colored names in sync with the expo-alternate-app-icons entry in app.json.
 * Both are produced from scripts/generate-app-icons.js.
 */
export const APP_ICONS: AppIconChoice[] = [
  { id: 'default', name: null, tint: null, image: require('../../assets/app-icons/preview/default.png') },
  { id: 'coral', name: 'Coral', tint: 'coral', image: require('../../assets/app-icons/preview/coral.png') },
  { id: 'lime', name: 'Lime', tint: 'lime', image: require('../../assets/app-icons/preview/lime.png') },
  { id: 'blue', name: 'Blue', tint: 'blue', image: require('../../assets/app-icons/preview/blue.png') },
  { id: 'rose', name: 'Rose', tint: 'rose', image: require('../../assets/app-icons/preview/rose.png') },
  { id: 'violet', name: 'Violet', tint: 'violet', image: require('../../assets/app-icons/preview/violet.png') },
  { id: 'moonstone', name: 'Moonstone', tint: 'moonstone', image: require('../../assets/app-icons/preview/moonstone.png') },
  { id: 'tangerine', name: 'Tangerine', tint: 'tangerine', image: require('../../assets/app-icons/preview/tangerine.png') },
  { id: 'lavender', name: 'Lavender', tint: 'lavender', image: require('../../assets/app-icons/preview/lavender.png') },
  { id: 'blueberry', name: 'Blueberry', tint: 'blueberry', image: require('../../assets/app-icons/preview/blueberry.png') },
  { id: 'kale', name: 'Kale', tint: 'kale', image: require('../../assets/app-icons/preview/kale.png') },
  { id: 'raspberry', name: 'Raspberry', tint: 'raspberry', image: require('../../assets/app-icons/preview/raspberry.png') },
];

/** Maps whatever the system reports as the active icon back to one of the choices. */
export function appIconByName(name: string | null | undefined): AppIconChoice {
  if (!name) return APP_ICONS[0];
  const wanted = name.toLowerCase();
  return APP_ICONS.find((item) => item.name?.toLowerCase() === wanted) ?? APP_ICONS[0];
}
