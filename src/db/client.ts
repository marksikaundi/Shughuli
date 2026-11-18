import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseAsync } from 'expo-sqlite';

import * as schema from '@/db/schema';

let opening: Promise<ExpoSQLiteDatabase<typeof schema>> | null = null;

export function getDb() {
  opening ??= openDatabaseAsync('shughuli.db').then((sqlite) => drizzle(sqlite, { schema }));
  return opening;
}
