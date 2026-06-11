import { sql } from 'drizzle-orm/sql/sql'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const surveys = sqliteTable('surveys', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull().default('Untitled Survey'),
  description: text('description'),
  // Per-Survey Branding Rules
  primaryColor: text('primary_color').notNull().default('#3b82f6'), // Default Tailwind Blue
  logoUrl: text('logo_url'), // Saved text string string matching requirements

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const questions = sqliteTable('questions', {
  id: text('id').primaryKey(),
  surveyId: text('survey_id')
    .notNull()
    .references(() => surveys.id, { onDelete: 'cascade' }), // Automatically wipes questions if a survey is deleted

  // The 3 Question Types Constraint: Type-narrowed directly via Drizzle's enum runtime modifier
  type: text('type', { enum: ['text', 'mcq', 'rating'] })
    .notNull()
    .default('text'),
  questionText: text('question_text').notNull().default('New Question'),

  // Explicit arrangement flag to handle Add/Remove/Reorder logic smoothly
  position: integer('position').notNull().default(0),

  // Stores custom arrays for Multiple Choice choices inside SQLite safely as text strings
  options: text('options', { mode: 'json' }).$type<string[]>(),

  required: integer('required', { mode: 'boolean' }).notNull().default(false),
})

export const responses = sqliteTable('responses', {
  id: text('id').primaryKey(),
  surveyId: text('survey_id')
    .references(() => surveys.id)
    .notNull(),
  // We will store the answers as a JSON string: { "questionId": "User's Answer" }
  answers: text('answers', { mode: 'json' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
})
