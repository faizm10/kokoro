import "server-only";

import { mkdirSync } from "node:fs";
import { dirname, isAbsolute } from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "@/db/schema";

const databaseUrl =
  process.env.DATABASE_URL || (process.env.VERCEL ? "/tmp/kokoro.db" : "./data/kokoro.db");
const globalForDatabase = globalThis as typeof globalThis & {
  kokoroSqlite?: Database.Database;
};

function ensureDatabaseDirectory(url: string) {
  if (url === ":memory:" || url.startsWith("file:")) return;
  if (!url.endsWith(".db") && !url.endsWith(".sqlite") && !url.endsWith(".sqlite3")) return;

  const directory = dirname(url);
  if (directory === "." || (!isAbsolute(directory) && directory.startsWith(".."))) return;
  mkdirSync(directory, { recursive: true });
}

function initializeSchema(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY NOT NULL,
      email text NOT NULL,
      name text,
      image text,
      created_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
      updated_at integer DEFAULT (unixepoch() * 1000) NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email);

    CREATE TABLE IF NOT EXISTS notes (
      id text PRIMARY KEY NOT NULL,
      user_id text NOT NULL,
      body text NOT NULL,
      kind text DEFAULT 'quick' NOT NULL,
      written_for text,
      created_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
      updated_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade
    );
    CREATE INDEX IF NOT EXISTS notes_user_created_idx ON notes (user_id, created_at);
    CREATE INDEX IF NOT EXISTS notes_user_kind_idx ON notes (user_id, kind);

    CREATE TABLE IF NOT EXISTS threads (
      id text PRIMARY KEY NOT NULL,
      user_id text NOT NULL,
      name text NOT NULL,
      description text,
      created_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
      updated_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade
    );
    CREATE INDEX IF NOT EXISTS threads_user_idx ON threads (user_id);

    CREATE TABLE IF NOT EXISTS notes_to_threads (
      note_id text NOT NULL,
      thread_id text NOT NULL,
      confidence integer DEFAULT 100 NOT NULL,
      PRIMARY KEY (note_id, thread_id),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE cascade,
      FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE cascade
    );

    CREATE TABLE IF NOT EXISTS insights (
      id text PRIMARY KEY NOT NULL,
      user_id text NOT NULL,
      body text NOT NULL,
      source_note_count integer DEFAULT 0 NOT NULL,
      created_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade
    );
    CREATE INDEX IF NOT EXISTS insights_user_created_idx ON insights (user_id, created_at);

    CREATE TABLE IF NOT EXISTS people (
      id text PRIMARY KEY NOT NULL,
      user_id text NOT NULL,
      name text NOT NULL,
      relationship text,
      how_we_met text,
      tags text DEFAULT '[]' NOT NULL,
      summary text,
      created_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
      updated_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade
    );
    CREATE INDEX IF NOT EXISTS people_user_idx ON people (user_id);

    CREATE TABLE IF NOT EXISTS interactions (
      id text PRIMARY KEY NOT NULL,
      user_id text NOT NULL,
      person_id text NOT NULL,
      occurred_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
      context text,
      source text DEFAULT 'in-person conversation' NOT NULL,
      facts text NOT NULL,
      interpretation text,
      topics text DEFAULT '[]' NOT NULL,
      tags text DEFAULT '[]' NOT NULL,
      follow_up text,
      follow_up_done integer DEFAULT false NOT NULL,
      created_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
      updated_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade,
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE cascade
    );
    CREATE INDEX IF NOT EXISTS interactions_person_occurred_idx ON interactions (person_id, occurred_at);
    CREATE INDEX IF NOT EXISTS interactions_user_idx ON interactions (user_id);

    CREATE TABLE IF NOT EXISTS important_dates (
      id text PRIMARY KEY NOT NULL,
      user_id text NOT NULL,
      person_id text NOT NULL,
      label text NOT NULL,
      date_text text NOT NULL,
      note text,
      created_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade,
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE cascade
    );
    CREATE INDEX IF NOT EXISTS important_dates_person_idx ON important_dates (person_id);
  `);
}

ensureDatabaseDirectory(databaseUrl);
const sqlite = globalForDatabase.kokoroSqlite ?? new Database(databaseUrl);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
initializeSchema(sqlite);

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.kokoroSqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });

export function checkDatabase() {
  return sqlite.prepare("select 1 as ok").get() as { ok: 1 };
}
