import "server-only";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "@/db/schema";

const databaseUrl = process.env.DATABASE_URL ?? "./data/kokoro.db";
const globalForDatabase = globalThis as typeof globalThis & {
  kokoroSqlite?: Database.Database;
};

const sqlite = globalForDatabase.kokoroSqlite ?? new Database(databaseUrl);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.kokoroSqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });

export function checkDatabase() {
  return sqlite.prepare("select 1 as ok").get() as { ok: 1 };
}
