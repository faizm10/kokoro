import { relations, sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const notes = sqliteTable(
  "notes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    kind: text("kind", { enum: ["quick", "reflection"] }).notNull().default("quick"),
    writtenFor: text("written_for"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index("notes_user_created_idx").on(table.userId, table.createdAt),
    index("notes_user_kind_idx").on(table.userId, table.kind),
  ],
);

export const threads = sqliteTable(
  "threads",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [index("threads_user_idx").on(table.userId)],
);

export const notesToThreads = sqliteTable(
  "notes_to_threads",
  {
    noteId: text("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    threadId: text("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    confidence: integer("confidence").notNull().default(100),
  },
  (table) => [primaryKey({ columns: [table.noteId, table.threadId] })],
);

export const insights = sqliteTable(
  "insights",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    sourceNoteCount: integer("source_note_count").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [index("insights_user_created_idx").on(table.userId, table.createdAt)],
);

export const people = sqliteTable(
  "people",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    relationship: text("relationship"),
    howWeMet: text("how_we_met"),
    tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    // My own, hand-written understanding of the relationship — never AI-generated.
    summary: text("summary"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [index("people_user_idx").on(table.userId)],
);

export const interactions = sqliteTable(
  "interactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    personId: text("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    occurredAt: integer("occurred_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    context: text("context"),
    // Where the information came from, e.g. "in-person conversation", "message they sent me".
    source: text("source").notNull().default("in-person conversation"),
    // Directly stated information — what they actually said or did.
    facts: text("facts").notNull(),
    // My own interpretation — kept separate from facts on purpose.
    interpretation: text("interpretation"),
    topics: text("topics", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    followUp: text("follow_up"),
    followUpDone: integer("follow_up_done", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index("interactions_person_occurred_idx").on(table.personId, table.occurredAt),
    index("interactions_user_idx").on(table.userId),
  ],
);

export const importantDates = sqliteTable(
  "important_dates",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    personId: text("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    // Stored as an ISO date string (YYYY-MM-DD); may recur yearly (e.g. a birthday).
    dateText: text("date_text").notNull(),
    note: text("note"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [index("important_dates_person_idx").on(table.personId)],
);

export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
  threads: many(threads),
  insights: many(insights),
  people: many(people),
}));

export const peopleRelations = relations(people, ({ one, many }) => ({
  user: one(users, { fields: [people.userId], references: [users.id] }),
  interactions: many(interactions),
  importantDates: many(importantDates),
}));

export const interactionsRelations = relations(interactions, ({ one }) => ({
  user: one(users, { fields: [interactions.userId], references: [users.id] }),
  person: one(people, { fields: [interactions.personId], references: [people.id] }),
}));

export const importantDatesRelations = relations(importantDates, ({ one }) => ({
  user: one(users, { fields: [importantDates.userId], references: [users.id] }),
  person: one(people, { fields: [importantDates.personId], references: [people.id] }),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
  threadLinks: many(notesToThreads),
}));

export const threadsRelations = relations(threads, ({ one, many }) => ({
  user: one(users, { fields: [threads.userId], references: [users.id] }),
  noteLinks: many(notesToThreads),
}));

export const notesToThreadsRelations = relations(notesToThreads, ({ one }) => ({
  note: one(notes, { fields: [notesToThreads.noteId], references: [notes.id] }),
  thread: one(threads, { fields: [notesToThreads.threadId], references: [threads.id] }),
}));

export const insightsRelations = relations(insights, ({ one }) => ({
  user: one(users, { fields: [insights.userId], references: [users.id] }),
}));
