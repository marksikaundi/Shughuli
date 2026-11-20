import { getLocales, type Locale } from 'expo-localization';
import { I18nManager } from 'react-native';

import { isRtlLanguage, isSelectableLanguage } from '@/i18n/languages';
import { en, sw, type SettingsCopy } from '@/i18n/messages';
import { overlays } from '@/i18n/packs';

const PLURAL_GROUPS = [
  ['projectOne', 'projectFew', 'projectMany', 'projectOther'],
  ['openOne', 'openFew', 'openMany', 'openOther'],
] as const;

const ALIASES: Record<string, string> = {
  in: 'id',
  iw: 'he',
  nb: 'nb',
  no: 'nb',
  nn: 'nb',
  tl: 'fil',
};

const catalogs: Record<string, Record<string, string>> = { sw, ...overlays };

type Resolved = {
  catalog: string;
  tag: string;
  direction: 'ltr' | 'rtl';
  messages: SettingsCopy;
};

function readLocales(): Locale[] {
  try {
    const locales = getLocales();
    if (locales.length > 0) return locales;
  } catch {
    // Locale data can be missing for a moment while the native module starts.
  }
  return [{ languageTag: 'en', languageCode: 'en', textDirection: 'ltr' } as Locale];
}

function matchCatalog(locale: Locale): string | null {
  const raw = (locale.languageCode || '').toLowerCase();
  const code = ALIASES[raw] ?? raw;
  if (!code) return null;
  if (code === 'zh') {
    const script = (locale.languageScriptCode || '').toLowerCase();
    const tag = (locale.languageTag || '').toLowerCase();
    const traditional =
      script === 'hant' || tag.includes('hant') || tag.includes('-tw') || tag.includes('-hk') || tag.includes('-mo');
    if (traditional && catalogs['zh-Hant']) return 'zh-Hant';
    return catalogs.zh ? 'zh' : null;
  }
  if (code === 'pt') {
    const region = (locale.regionCode || locale.languageRegionCode || '').toUpperCase();
    const tag = (locale.languageTag || '').toLowerCase();
    if ((region === 'BR' || tag.includes('-br')) && catalogs['pt-BR']) return 'pt-BR';
  }
  if (code === 'en') return 'en';
  return catalogs[code] ? code : null;
}

function materialize(catalog: string): SettingsCopy {
  if (catalog === 'en') return en;
  const overlay = catalogs[catalog];
  if (!overlay) return en;
  const merged = { ...en };
  for (const key of Object.keys(en) as (keyof SettingsCopy)[]) {
    const value = overlay[key];
    if (typeof value === 'string' && value.length > 0) merged[key] = value;
  }
  for (const group of PLURAL_GROUPS) {
    const provided = group.filter((key) => typeof overlay[key] === 'string' && overlay[key]);
    if (provided.length === 0) continue;
    const fallback = overlay[group[3]] || overlay[provided[0]];
    if (!fallback) continue;
    for (const key of group) {
      if (!overlay[key]) merged[key] = fallback;
    }
  }
  return merged;
}

function formattingTag(catalog: string, deviceTag: string) {
  if (catalog === 'en' && deviceTag.toLowerCase().startsWith('en')) return deviceTag;
  return catalog;
}

export function resolveLanguage(choice: string, locales = readLocales()): Resolved {
  const device = locales[0];
  const deviceTag = device?.languageTag || 'en';
  const explicit = choice !== 'system' && (choice === 'en' || isSelectableLanguage(choice));
  if (explicit) {
    return {
      catalog: choice,
      tag: formattingTag(choice, deviceTag),
      direction: isRtlLanguage(choice) ? 'rtl' : 'ltr',
      messages: materialize(choice),
    };
  }

  for (const locale of locales) {
    const catalog = matchCatalog(locale);
    if (!catalog) continue;
    const direction = locale.textDirection === 'rtl' || isRtlLanguage(catalog) ? 'rtl' : 'ltr';
    return {
      catalog,
      tag: locale.languageTag || catalog,
      direction,
      messages: materialize(catalog),
    };
  }

  return {
    catalog: 'en',
    tag: deviceTag,
    direction: device?.textDirection === 'rtl' ? 'rtl' : 'ltr',
    messages: en,
  };
}

let current = resolveLanguage('system');

export function publishLanguage(choice: string, locales?: Locale[]) {
  current = resolveLanguage(choice, locales);
  return current;
}

export function syncDirection(direction: 'ltr' | 'rtl') {
  const rtl = direction === 'rtl';
  if (I18nManager.isRTL === rtl) return;
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(rtl);
}

export function applyLanguage(choice: string) {
  const resolved = publishLanguage(choice);
  syncDirection(resolved.direction);
}

export function getCopy(): SettingsCopy {
  return current.messages;
}

export function getLocaleTag() {
  return current.tag;
}

export function getCatalogId() {
  return current.catalog;
}

export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(values[key] ?? ''));
}

export function countPhrase(
  count: number,
  forms: { one: string; few: string; many: string; other: string },
) {
  let rule: Intl.LDMLPluralRule = 'other';
  try {
    rule = new Intl.PluralRules(current.tag).select(count);
  } catch {
    rule = count === 1 ? 'one' : 'other';
  }
  const template =
    (rule === 'one' ? forms.one : rule === 'few' || rule === 'two' ? forms.few : rule === 'many' ? forms.many : forms.other) ||
    forms.other;
  return fill(template, { count });
}

export function languageEndonym(code: string) {
  if (code === 'zh') return '简体中文';
  if (code === 'zh-Hant') return '繁體中文';
  if (code === 'sw') return 'Kiswahili';
  try {
    return new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function deviceLanguageLabel() {
  const locales = readLocales();
  for (const locale of locales) {
    const code = locale.languageCode;
    if (!code) continue;
    const catalog = matchCatalog(locale);
    return languageEndonym(catalog ?? code);
  }
  return languageEndonym('en');
}
