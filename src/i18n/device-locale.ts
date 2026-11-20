import { I18nManager, Platform, Settings } from 'react-native';

export type DeviceLocale = {
  languageTag: string;
  languageCode: string | null;
  languageScriptCode: string | null;
  regionCode: string | null;
  languageRegionCode: string | null;
  textDirection: 'ltr' | 'rtl';
};

const RTL = new Set(['ar', 'he', 'fa', 'ur']);

let expoLocales: (() => DeviceLocale[]) | null | undefined;

function parseTag(raw: string): DeviceLocale {
  const tag = raw.replace(/_/g, '-');
  const parts = tag.split('-').filter(Boolean);
  const languageCode = (parts[0] || 'en').toLowerCase();
  let script: string | null = null;
  let region: string | null = null;
  for (const part of parts.slice(1)) {
    if (/^[A-Za-z]{4}$/.test(part)) script = part[0].toUpperCase() + part.slice(1).toLowerCase();
    else if (/^[A-Za-z]{2}$/.test(part) || /^\d{3}$/.test(part)) region = part.toUpperCase();
  }
  return {
    languageTag: tag,
    languageCode,
    languageScriptCode: script,
    regionCode: region,
    languageRegionCode: region,
    textDirection: RTL.has(languageCode) ? 'rtl' : 'ltr',
  };
}

function fromExpo(locale: Record<string, unknown>): DeviceLocale {
  const languageTag = typeof locale.languageTag === 'string' && locale.languageTag ? locale.languageTag : 'en';
  const parsed = parseTag(languageTag);
  return {
    ...parsed,
    languageCode: typeof locale.languageCode === 'string' ? locale.languageCode : parsed.languageCode,
    languageScriptCode: typeof locale.languageScriptCode === 'string' ? locale.languageScriptCode : parsed.languageScriptCode,
    regionCode: typeof locale.regionCode === 'string' ? locale.regionCode : parsed.regionCode,
    languageRegionCode:
      typeof locale.languageRegionCode === 'string' ? locale.languageRegionCode : parsed.languageRegionCode,
    textDirection: locale.textDirection === 'rtl' ? 'rtl' : 'ltr',
  };
}

function loadExpoLocales() {
  if (expoLocales !== undefined) return expoLocales;
  try {
    // A static import evaluates the native module and crashes builds that predate it.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const localization = require('expo-localization') as { getLocales?: () => Record<string, unknown>[] };
    if (typeof localization.getLocales !== 'function') {
      expoLocales = null;
      return null;
    }
    expoLocales = () => localization.getLocales!().map(fromExpo);
    expoLocales();
    return expoLocales;
  } catch {
    expoLocales = null;
    return null;
  }
}

function pushTag(tags: string[], value: unknown) {
  if (typeof value === 'string' && value) tags.push(value);
}

function systemTags() {
  const tags: string[] = [];
  if (Platform.OS === 'ios') {
    pushTag(tags, Settings.get('AppleLocale'));
    const languages = Settings.get('AppleLanguages');
    if (Array.isArray(languages)) {
      for (const language of languages) pushTag(tags, language);
    }
  }

  pushTag(tags, (I18nManager.getConstants() as { localeIdentifier?: string }).localeIdentifier);

  if (tags.length === 0 && typeof navigator !== 'undefined') {
    const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const language of languages) {
      if (language) tags.push(language);
    }
  }

  if (tags.length === 0) {
    try {
      const intl = Intl.DateTimeFormat().resolvedOptions().locale;
      if (intl) tags.push(intl);
    } catch {
      tags.push('en');
    }
  }

  return tags.length > 0 ? tags : ['en'];
}

export function readDeviceLocales(): DeviceLocale[] {
  const native = loadExpoLocales();
  if (native) {
    try {
      const locales = native();
      if (locales.length > 0) return locales;
    } catch {
      expoLocales = null;
    }
  }

  const seen = new Set<string>();
  return systemTags()
    .map(parseTag)
    .filter((locale) => {
      if (seen.has(locale.languageTag)) return false;
      seen.add(locale.languageTag);
      return true;
    });
}
