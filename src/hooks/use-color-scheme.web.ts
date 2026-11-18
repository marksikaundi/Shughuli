import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

function subscribe() {
  return () => {};
}

/**
 * To support static rendering, the server renders light mode and the client
 * picks up the real color scheme after hydration.
 */
export function useColorScheme() {
  const colorScheme = useRNColorScheme();
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);

  return hydrated ? colorScheme : 'light';
}
