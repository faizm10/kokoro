import { randomUUID } from "node:crypto";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { notes, threads, users } from "@/db/schema";

export async function ensureUser(profile: { email: string; name?: string | null; image?: string | null }) {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, profile.email),
  });

  if (existing) return existing;

  const user = {
    id: randomUUID(),
    email: profile.email,
    name: profile.name ?? null,
    image: profile.image ?? null,
  };

  await db.insert(users).values(user);
  return user;
}

export async function createNote(input: {
  userId: string;
  body: string;
  kind?: "quick" | "reflection";
  writtenFor?: string;
}) {
  const note = {
    id: randomUUID(),
    userId: input.userId,
    body: input.body.trim(),
    kind: input.kind ?? ("quick" as const),
    writtenFor: input.writtenFor ?? null,
  };

  if (!note.body) throw new Error("A note cannot be empty.");

  await db.insert(notes).values(note);
  return note;
}

export function getRecentNotes(userId: string, limit = 10) {
  return db.query.notes.findMany({
    where: eq(notes.userId, userId),
    orderBy: [desc(notes.createdAt)],
    limit,
  });
}

export function getReflection(userId: string, writtenFor: string) {
  return db.query.notes.findFirst({
    where: and(
      eq(notes.userId, userId),
      eq(notes.kind, "reflection"),
      eq(notes.writtenFor, writtenFor),
    ),
  });
}

export function getThreads(userId: string) {
  return db.query.threads.findMany({
    where: eq(threads.userId, userId),
    orderBy: [desc(threads.updatedAt)],
    with: {
      noteLinks: true,
    },
  });
}
