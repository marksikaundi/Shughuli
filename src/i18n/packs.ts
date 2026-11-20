import { more } from '@/i18n/catalogs/more';
import { tail } from '@/i18n/catalogs/tail';
import { west } from '@/i18n/catalogs/west';
import { world } from '@/i18n/catalogs/world';

export const overlays: Record<string, Record<string, string>> = {
  ...west,
  ...more,
  ...world,
  ...tail,
};
