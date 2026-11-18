import { migrate } from 'drizzle-orm/expo-sqlite/migrator';

import { getDb } from '@/db/client';

const init = `
CREATE TABLE IF NOT EXISTS \`tasks\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`title\` text NOT NULL,
  \`description\` text NOT NULL DEFAULT '',
  \`date\` text NOT NULL,
  \`start\` text NOT NULL,
  \`end\` text NOT NULL,
  \`priority\` text NOT NULL,
  \`status\` text NOT NULL,
  \`category\` text NOT NULL,
  \`project\` text NOT NULL,
  \`tags\` text NOT NULL,
  \`people\` text NOT NULL,
  \`extra_people\` integer NOT NULL DEFAULT 0,
  \`scheduled\` integer NOT NULL,
  \`starred\` integer NOT NULL,
  \`kind\` text NOT NULL,
  \`notification_id\` text,
  \`note_uri\` text
);
`;

export async function migrateDb() {
  await migrate(getDb(), {
    journal: {
      entries: [{ idx: 0, when: 1, tag: '0000_init', breakpoints: true }],
    },
    migrations: {
      m0000: init,
    },
  });
}
