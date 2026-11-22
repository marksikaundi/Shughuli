import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const taskTable = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  date: text('date').notNull(),
  start: text('start').notNull(),
  end: text('end').notNull(),
  priority: text('priority').notNull(),
  status: text('status').notNull(),
  category: text('category').notNull(),
  project: text('project').notNull(),
  tags: text('tags').notNull(),
  people: text('people').notNull(),
  extraPeople: integer('extra_people').notNull().default(0),
  scheduled: integer('scheduled', { mode: 'boolean' }).notNull(),
  starred: integer('starred', { mode: 'boolean' }).notNull(),
  kind: text('kind').notNull(),
  notificationId: text('notification_id'),
  noteUri: text('note_uri'),
  details: text('details').notNull().default(''),
  sectionId: text('section_id'),
});

export const sectionTable = sqliteTable('sections', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  createdAt: text('created_at').notNull(),
});

export const projectTable = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
});
