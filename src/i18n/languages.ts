export const CATALOG_LANGUAGES = [
  'en',
  'sw',
  'pl',
  'de',
  'fr',
  'es',
  'pt',
  'it',
  'nl',
  'uk',
  'ru',
  'tr',
  'ar',
  'he',
  'fa',
  'hi',
  'bn',
  'ur',
  'zh',
  'zh-Hant',
  'ja',
  'ko',
  'id',
  'ms',
  'vi',
  'th',
  'fil',
  'el',
  'cs',
  'sk',
  'ro',
  'hu',
  'sv',
  'da',
  'nb',
  'fi',
  'hr',
  'bg',
  'sr',
  'sl',
  'lt',
  'lv',
  'et',
  'ca',
] as const;

export type CatalogLanguage = (typeof CATALOG_LANGUAGES)[number];

const RTL = new Set(['ar', 'he', 'fa', 'ur']);

export function isSelectableLanguage(code: string): code is CatalogLanguage {
  return (CATALOG_LANGUAGES as readonly string[]).includes(code);
}

export function isRtlLanguage(code: string) {
  return RTL.has(code);
}
