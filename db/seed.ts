import { randomUUID } from "node:crypto";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { insights, notes, notesToThreads, threads, users } from "./schema";

const sqlite = new Database(process.env.DATABASE_URL ?? "./data/kokoro.db");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite);
const demoUserId = "demo-user";

db.insert(users)
  .values({
    id: demoUserId,
    email: "demo@kokoro.local",
    name: "Demo",
  })
  .onConflictDoNothing()
  .run();

const existingNotes = sqlite
  .prepare("select count(*) as count from notes where user_id = ?")
  .get(demoUserId) as { count: number };

if (existingNotes.count === 0) {
  const threadId = randomUUID();
  const noteId = randomUUID();

  db.insert(threads)
    .values({
      id: threadId,
      userId: demoUserId,
      name: "momentum",
      description: "Thoughts about energy, focus, and making progress.",
    })
    .run();

  db.insert(notes)
    .values({
      id: noteId,
      userId: demoUserId,
      body: "there is a different kind of focus after everyone goes quiet.",
      kind: "quick",
    })
    .run();

  db.insert(notesToThreads)
    .values({
      noteId,
      threadId,
      confidence: 92,
    })
    .run();

  db.insert(insights)
    .values({
      id: randomUUID(),
      userId: demoUserId,
      body: "you often write about momentum after late nights.",
      sourceNoteCount: 7,
    })
    .run();
}

sqlite.close();
console.log("Seeded the local Kokoro database.");
