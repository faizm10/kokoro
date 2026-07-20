import "server-only";

import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/db/schema";

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
const hasPostgresUrl = /^postgres(?:ql)?:\/\//.test(databaseUrl);
const queryClient = neon(hasPostgresUrl ? databaseUrl : "postgres://user:password@localhost:5432/kokoro");

export const db = drizzle(queryClient, { schema });

export async function checkDatabase() {
  if (!hasPostgresUrl) {
    return {
      ok: 0,
      error: "DATABASE_URL must be a Postgres connection string.",
    };
  }

  const result = await db.execute(sql`select 1 as ok`);
  const row = result.rows[0] as { ok: number } | undefined;

  return {
    ok: row?.ok === 1 ? 1 : 0,
  };
}
