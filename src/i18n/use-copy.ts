import { useLocales } from 'expo-localization';
import { useEffect, useMemo } from 'react';

import { publishLanguage, syncDirection } from '@/i18n/translate';
import { usePreferencesStore } from '@/store/preferences';

export function useCopy() {
  const choice = usePreferencesStore((state) => state.prefs.language);
  const locales = useLocales();
  const resolved = useMemo(() => publishLanguage(choice, locales), [choice, locales]);

  useEffect(() => {
    syncDirection(resolved.direction);
  }, [resolved.direction]);

  return resolved.messages;
}
