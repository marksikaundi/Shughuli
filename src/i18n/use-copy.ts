import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { readDeviceLocales } from '@/i18n/device-locale';
import { publishLanguage, syncDirection } from '@/i18n/translate';
import { usePreferencesStore } from '@/store/preferences';

export function useCopy() {
  const choice = usePreferencesStore((state) => state.prefs.language);
  const [locales, setLocales] = useState(readDeviceLocales);
  const resolved = useMemo(() => publishLanguage(choice, locales), [choice, locales]);

  useEffect(() => {
    syncDirection(resolved.direction);
  }, [resolved.direction]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') setLocales(readDeviceLocales());
    });
    return () => subscription.remove();
  }, []);

  return resolved.messages;
}
