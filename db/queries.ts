import { randomUUID } from "node:crypto";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { notes, notesToThreads, threads, users } from "@/db/schema";

const threadKeywordGroups = [
  {
    name: "focus",
    keywords: ["focus", "work", "build", "ship", "task", "project", "study", "learn", "finish", "progress"],
  },
  {
    name: "relationships",
    keywords: ["friend", "family", "partner", "love", "call", "text", "people", "relationship", "together"],
  },
  {
    name: "health",
    keywords: ["sleep", "tired", "energy", "body", "walk", "run", "gym", "food", "health", "rest"],
  },
  {
    name: "money",
    keywords: ["money", "budget", "rent", "bill", "paid", "pay", "cost", "spend", "save"],
  },
  {
    name: "feelings",
    keywords: ["feel", "feeling", "sad", "happy", "anxious", "angry", "scared", "calm", "heavy"],
  },
  {
    name: "planning",
    keywords: ["plan", "tomorrow", "next", "schedule", "organize", "need", "should", "remember"],
  },
  {
    name: "creativity",
    keywords: ["idea", "write", "draw", "music", "design", "create", "story", "art"],
  },
];

const eventKeywordGroups = [
  {
    name: "meeting",
    keywords: ["meeting", "sync", "standup", "review"],
  },
  {
    name: "conversation",
    keywords: ["conversation", "talk", "talked", "chat", "call", "called", "text", "texted"],
  },
  {
    name: "school",
    keywords: ["class", "exam", "assignment", "lecture", "school", "study"],
  },
  {
    name: "work event",
    keywords: ["deadline", "interview", "presentation", "launch", "demo"],
  },
  {
    name: "social plan",
    keywords: ["dinner", "lunch", "coffee", "party", "date", "hangout"],
  },
  {
    name: "trip",
    keywords: ["trip", "flight", "airport", "travel", "drive", "visit"],
  },
];

const relationshipWords = new Set([
  "mom",
  "mother",
  "dad",
  "father",
  "brother",
  "sister",
  "friend",
  "partner",
  "roommate",
  "manager",
  "boss",
]);

const stopWords = new Set([
  "about",
  "after",
  "again",
  "also",
  "because",
  "been",
  "being",
  "could",
  "does",
  "done",
  "down",
  "first",
  "from",
  "have",
  "just",
  "like",
  "little",
  "more",
  "need",
  "one",
  "only",
  "really",
  "should",
  "some",
  "that",
  "their",
  "there",
  "thing",
  "this",
  "through",
  "today",
  "together",
  "want",
  "what",
  "when",
  "where",
  "with",
  "would",
  "your",
]);

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1).toLowerCase()}`)
    .join(" ");
}

function threadName(kind: "theme" | "who" | "event", label: string) {
  return kind === "theme" ? label : `${kind}: ${label}`;
}

function parseThreadName(name: string) {
  if (name.startsWith("who: ")) {
    return {
      kind: "who" as const,
      label: name.replace("who: ", ""),
    };
  }

  if (name.startsWith("event: ")) {
    return {
      kind: "event" as const,
      label: name.replace("event: ", ""),
    };
  }

  return {
    kind: "theme" as const,
    label: name,
  };
}

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
  await connectNoteToThreads(note);
  return note;
}

function extractThreadNames(body: string) {
  const normalized = body.toLowerCase();
  const words: string[] = normalized.match(/[a-z][a-z'-]{2,}/g) ?? [];
  const matchedGroups = threadKeywordGroups
    .filter((group) => group.keywords.some((keyword) => words.includes(keyword)))
    .map((group) => threadName("theme", group.name));
  const matchedEvents = eventKeywordGroups
    .filter((group) => group.keywords.some((keyword) => words.includes(keyword)))
    .map((group) => threadName("event", group.name));
  const matchedPeople = extractPeopleThreads(body, words);
  const wordCounts = new Map<string, number>();

  for (const word of words) {
    const clean = word.replace(/'s$/, "");
    if (clean.length < 4 || stopWords.has(clean)) continue;
    wordCounts.set(clean, (wordCounts.get(clean) ?? 0) + 1);
  }

  const fallbackWords = [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([word]) => threadName("theme", word))
    .slice(0, 2);

  const threadNames = [...new Set([...matchedPeople, ...matchedEvents, ...matchedGroups, ...fallbackWords])].slice(0, 4);
  return threadNames.length > 0 ? threadNames : ["loose thoughts"];
}

function extractPeopleThreads(body: string, words: string[]) {
  const people = new Set<string>();
  const capitalizedPersonPattern =
    /\b(?:with|about|for|from|to|called|texted|met|saw|missed|seeing|helped|thanked)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g;
  const lowerPersonPattern =
    /\b(?:with|about|for|from|to|called|texted|met|saw|missed|seeing|helped|thanked)\s+([a-z][a-z]+(?:\s+[a-z][a-z]+)?)/g;
  const ignoredNames = new Set(["today", "tomorrow", "yesterday", "morning", "night", "work", "school"]);

  for (const match of body.matchAll(capitalizedPersonPattern)) {
    const name = match[1]?.trim();
    if (name && !ignoredNames.has(name.toLowerCase())) people.add(titleCase(name));
  }

  for (const match of body.toLowerCase().matchAll(lowerPersonPattern)) {
    const name = match[1]?.trim();
    if (name && !ignoredNames.has(name)) people.add(titleCase(name));
  }

  for (const word of words) {
    if (relationshipWords.has(word)) people.add(titleCase(word));
  }

  return [...people].slice(0, 2).map((person) => threadName("who", person));
}

async function findOrCreateThread(userId: string, name: string) {
  const existing = await db.query.threads.findFirst({
    where: and(
      eq(threads.userId, userId),
      eq(threads.name, name),
    ),
  });

  if (existing) return existing;

  const thread = {
    id: randomUUID(),
    userId,
    name,
    description: `Notes that seem connected to ${name}.`,
  };

  await db.insert(threads).values(thread);
  return thread;
}

async function connectNoteToThreads(note: { id: string; userId: string; body: string }) {
  const threadNames = extractThreadNames(note.body);

  for (const [index, name] of threadNames.entries()) {
    const thread = await findOrCreateThread(note.userId, name);

    await db
      .insert(notesToThreads)
      .values({
        noteId: note.id,
        threadId: thread.id,
        confidence: Math.max(64, 96 - index * 10),
      })
      .onConflictDoNothing();
  }
}

export function getRecentNotes(userId: string, limit = 10) {
  return db.query.notes.findMany({
    where: eq(notes.userId, userId),
    orderBy: [desc(notes.createdAt)],
    limit,
  });
}

export function getNoteById(userId: string, noteId: string) {
  return db.query.notes.findFirst({
    where: and(
      eq(notes.userId, userId),
      eq(notes.id, noteId),
    ),
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

export async function getMindMap(userId: string) {
  const recentNotes = await db.query.notes.findMany({
    where: eq(notes.userId, userId),
    orderBy: [desc(notes.createdAt)],
    limit: 50,
    with: {
      threadLinks: true,
    },
  });

  for (const note of recentNotes) {
    await connectNoteToThreads(note);
  }

  const threadRows = await db.query.threads.findMany({
    where: eq(threads.userId, userId),
    orderBy: [desc(threads.updatedAt)],
    with: {
      noteLinks: {
        with: {
          note: true,
        },
      },
    },
  });

  return threadRows
    .map((thread) => ({
      id: thread.id,
      name: parseThreadName(thread.name).label,
      kind: parseThreadName(thread.name).kind,
      description: thread.description,
      noteCount: thread.noteLinks.length,
      notes: thread.noteLinks
        .map((link) => ({
          id: link.note.id,
          body: link.note.body,
          confidence: link.confidence,
          createdAt: link.note.createdAt,
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 4),
    }))
    .filter((thread) => thread.noteCount > 0)
    .slice(0, 8);
}
