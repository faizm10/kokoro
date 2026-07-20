import { randomUUID } from "node:crypto";

import { neon } from "@neondatabase/serverless";
import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import {
  importantDates,
  insights,
  interactions,
  notes,
  notesToThreads,
  people,
  threads,
  users,
} from "./schema";

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set before running db:seed.");
}

const db = drizzle(neon(databaseUrl));
const demoUserId = "demo-user";

async function main() {
  await db
    .insert(users)
    .values({
      id: demoUserId,
      email: "demo@kokoro.local",
      name: "Demo",
    })
    .onConflictDoNothing();

  const [existingNotes] = await db
    .select({ count: count() })
    .from(notes)
    .where(eq(notes.userId, demoUserId));

  if ((existingNotes?.count ?? 0) === 0) {
    const threadId = randomUUID();
    const noteId = randomUUID();

    await db.insert(threads).values({
      id: threadId,
      userId: demoUserId,
      name: "momentum",
      description: "Thoughts about energy, focus, and making progress.",
    });

    await db.insert(notes).values({
      id: noteId,
      userId: demoUserId,
      body: "there is a different kind of focus after everyone goes quiet.",
      kind: "quick",
    });

    await db.insert(notesToThreads).values({
      noteId,
      threadId,
      confidence: 92,
    });

    await db.insert(insights).values({
      id: randomUUID(),
      userId: demoUserId,
      body: "you often write about momentum after late nights.",
      sourceNoteCount: 7,
    });
  }

  const [existingPeople] = await db
    .select({ count: count() })
    .from(people)
    .where(eq(people.userId, demoUserId));

  if ((existingPeople?.count ?? 0) === 0) {
    const personId = randomUUID();
    const day = 24 * 60 * 60 * 1000;
    const now = Date.now();

    await db.insert(people).values({
      id: personId,
      userId: demoUserId,
      name: "Priya Sharma",
      relationship: "colleague, slowly becoming a friend",
      howWeMet: "we sat next to each other at the Tuesday design critique",
      tags: ["work", "design", "climbing"],
      summary:
        "Someone I enjoy working with and want to stay in better touch with. Notes here are only things she's told me directly.",
    });

    await db.insert(interactions).values([
      {
        id: randomUUID(),
        userId: demoUserId,
        personId,
        occurredAt: new Date(now - 21 * day),
        context: "grabbing coffee after the critique",
        source: "in-person conversation",
        facts:
          "She mentioned she started bouldering a few months ago and goes to the gym near the office most Thursdays.",
        interpretation: "Seemed genuinely energized talking about it - might be a good thing to ask about.",
        topics: ["climbing", "routines"],
        tags: ["catch-up"],
        followUp: "ask which gym so I could try a session",
        followUpDone: false,
      },
      {
        id: randomUUID(),
        userId: demoUserId,
        personId,
        occurredAt: new Date(now - 10 * day),
        context: "slack thread about the roadmap",
        source: "message they sent me",
        facts:
          "She said she prefers written updates over surprise meetings, and that mornings are her focused time.",
        interpretation: null,
        topics: ["communication", "work"],
        tags: ["preferences"],
        followUp: null,
        followUpDone: false,
      },
      {
        id: randomUUID(),
        userId: demoUserId,
        personId,
        occurredAt: new Date(now - 3 * day),
        context: "lunch",
        source: "in-person conversation",
        facts:
          "She's climbing again this weekend and mentioned her sister is visiting from Pune next month. Also said she loved the book 'Piranesi'.",
        interpretation: "Second time climbing has come up - clearly a real part of her week.",
        topics: ["climbing", "family", "books"],
        tags: ["catch-up"],
        followUp: "recommend a book back to her",
        followUpDone: false,
      },
    ]);

    await db.insert(importantDates).values({
      id: randomUUID(),
      userId: demoUserId,
      personId,
      label: "sister visiting from Pune",
      dateText: new Date(now + 25 * day).toISOString().slice(0, 10),
      note: "she mentioned it at lunch",
    });
  }

  console.log("Seeded the Kokoro database.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
