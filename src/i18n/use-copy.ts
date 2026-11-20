import { useLocales, type Locale } from 'expo-localization';
import { useEffect, useMemo } from 'react';

import { publishLanguage, syncDirection } from '@/i18n/translate';
import { usePreferencesStore } from '@/store/preferences';

const FALLBACK_LOCALES = [{ languageTag: 'en', languageCode: 'en', textDirection: 'ltr' } as Locale];

export function useCopy() {
  const choice = usePreferencesStore((state) => state.prefs.language);
  let locales: Locale[];
  try {
    locales = useLocales();
  } catch {
    locales = FALLBACK_LOCALES;
  }
  const resolved = useMemo(() => publishLanguage(choice, locales), [choice, locales]);

  useEffect(() => {
    syncDirection(resolved.direction);
  }, [resolved.direction]);

  return resolved.messages;
}
