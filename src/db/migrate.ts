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

const projects = `
CREATE TABLE IF NOT EXISTS \`projects\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`name\` text NOT NULL,
  \`created_at\` text NOT NULL
);
`;

export async function migrateDb() {
  const db = await getDb();
  await migrate(db, {
    journal: {
      entries: [
        { idx: 0, when: 1, tag: '0000_init', breakpoints: true },
        { idx: 1, when: 2, tag: '0001_projects', breakpoints: true },
        { idx: 2, when: 3, tag: '0002_task_details', breakpoints: true },
        { idx: 3, when: 4, tag: '0003_sections', breakpoints: true },
        { idx: 4, when: 5, tag: '0004_task_section', breakpoints: true },
      ],
    },
    migrations: {
      m0000: init,
      m0001: projects,
      m0002: 'ALTER TABLE `tasks` ADD `details` text NOT NULL DEFAULT \'\';',
      m0003: `CREATE TABLE IF NOT EXISTS \`sections\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`name\` text NOT NULL,
  \`description\` text NOT NULL DEFAULT '',
  \`created_at\` text NOT NULL
);`,
      m0004: 'ALTER TABLE `tasks` ADD `section_id` text;',
    },
  });
}
