import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from '@/db/schema';

let database: ExpoSQLiteDatabase<typeof schema> | null = null;

export function getDb() {
  if (!database) {
    const sqlite = openDatabaseSync('shughuli.db');
    database = drizzle(sqlite, { schema });
  }
  return database;
}
