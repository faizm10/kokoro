import { randomUUID } from "node:crypto";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { notes, notesToThreads, threads, users } from "@/db/schema";

type ThreadKind = "theme" | "who" | "event" | "place" | "emotion";

type ThreadCandidate = {
  name: string;
  score: number;
};

type KeywordGroup = {
  kind: Exclude<ThreadKind, "who">;
  name: string;
  keywords: string[];
  phrases?: string[];
};

const threadKeywordGroups: KeywordGroup[] = [
  {
    kind: "theme",
    name: "focus",
    keywords: [
      "focus",
      "work",
      "build",
      "ship",
      "task",
      "project",
      "study",
      "learn",
      "finish",
      "progress",
      "deep",
      "distraction",
      "momentum",
    ],
    phrases: ["deep work", "lock in", "get it done"],
  },
  {
    kind: "theme",
    name: "relationships",
    keywords: [
      "friend",
      "family",
      "partner",
      "love",
      "call",
      "text",
      "people",
      "relationship",
      "together",
      "trust",
      "miss",
      "support",
    ],
    phrases: ["caught up", "spent time", "quality time"],
  },
  {
    kind: "theme",
    name: "health",
    keywords: [
      "sleep",
      "tired",
      "energy",
      "body",
      "walk",
      "run",
      "gym",
      "food",
      "health",
      "rest",
      "meal",
      "exercise",
      "sick",
      "pain",
    ],
    phrases: ["mental health", "worked out", "went for a walk"],
  },
  {
    kind: "theme",
    name: "money",
    keywords: ["money", "budget", "rent", "bill", "paid", "pay", "cost", "spend", "save", "debt", "salary", "invoice"],
    phrases: ["credit card", "bank account", "saving up"],
  },
  {
    kind: "theme",
    name: "learning",
    keywords: ["learn", "study", "read", "course", "class", "practice", "skill", "lesson", "book"],
    phrases: ["figured out", "taking notes"],
  },
  {
    kind: "theme",
    name: "planning",
    keywords: ["plan", "tomorrow", "next", "schedule", "organize", "need", "should", "remember", "goal", "routine"],
    phrases: ["to do", "next week", "this week"],
  },
  {
    kind: "theme",
    name: "creativity",
    keywords: ["idea", "write", "draw", "music", "design", "create", "story", "art", "sketch", "draft", "make"],
    phrases: ["new idea", "creative block"],
  },
  {
    kind: "emotion",
    name: "anxiety",
    keywords: ["anxiety", "anxious", "stress", "stressed", "worry", "worried", "panic", "nervous", "uneasy"],
    phrases: ["on edge", "spiraling", "overthinking"],
  },
  {
    kind: "emotion",
    name: "calm",
    keywords: ["calm", "peace", "peaceful", "relief", "relieved", "steady", "grounded", "quiet"],
    phrases: ["slowed down", "felt lighter"],
  },
  {
    kind: "emotion",
    name: "joy",
    keywords: ["happy", "joy", "excited", "proud", "grateful", "good", "laugh", "smile", "fun"],
    phrases: ["felt good", "made me smile"],
  },
  {
    kind: "emotion",
    name: "sadness",
    keywords: ["sad", "lonely", "heavy", "hurt", "cry", "cried", "grief", "empty", "down"],
    phrases: ["felt off", "hard day"],
  },
  {
    kind: "emotion",
    name: "anger",
    keywords: ["angry", "mad", "frustrated", "annoyed", "irritated", "resentful"],
    phrases: ["set me off", "lost patience"],
  },
  {
    kind: "emotion",
    name: "overwhelm",
    keywords: ["overwhelmed", "busy", "buried", "pressure", "chaos", "too much"],
    phrases: ["too much", "a lot going on"],
  },
];

const eventKeywordGroups: KeywordGroup[] = [
  {
    kind: "event",
    name: "meeting",
    keywords: ["meeting", "sync", "standup", "review", "retro", "one-on-one"],
    phrases: ["one on one"],
  },
  {
    kind: "event",
    name: "conversation",
    keywords: ["conversation", "talk", "talked", "chat", "call", "called", "text", "texted"],
  },
  {
    kind: "event",
    name: "school",
    keywords: ["class", "exam", "assignment", "lecture", "school", "study", "quiz", "homework"],
  },
  {
    kind: "event",
    name: "work deadline",
    keywords: ["deadline", "interview", "presentation", "launch", "demo", "milestone", "release"],
    phrases: ["due date"],
  },
  {
    kind: "event",
    name: "social plan",
    keywords: ["dinner", "lunch", "coffee", "party", "date", "hangout", "brunch", "movie"],
  },
  {
    kind: "event",
    name: "trip",
    keywords: ["trip", "flight", "airport", "travel", "drive", "visit"],
    phrases: ["road trip"],
  },
  {
    kind: "event",
    name: "appointment",
    keywords: ["appointment", "doctor", "dentist", "therapy", "checkup", "reservation"],
  },
];

const placeKeywordGroups: KeywordGroup[] = [
  {
    kind: "place",
    name: "home",
    keywords: ["home", "apartment", "room", "kitchen", "bedroom"],
  },
  {
    kind: "place",
    name: "school",
    keywords: ["school", "campus", "classroom", "library"],
  },
  {
    kind: "place",
    name: "gym",
    keywords: ["gym", "track", "court", "field"],
  },
  {
    kind: "place",
    name: "Toronto",
    keywords: ["toronto", "mississauga", "scarborough", "downtown"],
  },
  {
    kind: "place",
    name: "New York",
    keywords: ["nyc", "new-york", "manhattan", "brooklyn"],
    phrases: ["new york"],
  },
  {
    kind: "place",
    name: "Japan",
    keywords: ["japan", "tokyo", "kyoto", "osaka"],
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

const tokenAliases = new Map([
  ["anxious", "anxiety"],
  ["stressed", "stress"],
  ["worried", "worry"],
  ["worries", "worry"],
  ["nervous", "anxiety"],
  ["overwhelmed", "overwhelm"],
  ["planned", "plan"],
  ["planning", "plan"],
  ["plans", "plan"],
  ["studied", "study"],
  ["studying", "study"],
  ["learned", "learn"],
  ["learning", "learn"],
  ["worked", "work"],
  ["working", "work"],
  ["finished", "finish"],
  ["finishing", "finish"],
  ["paid", "pay"],
  ["paying", "pay"],
  ["spent", "spend"],
  ["spending", "spend"],
  ["saved", "save"],
  ["saving", "save"],
  ["slept", "sleep"],
  ["sleeping", "sleep"],
  ["tired", "tired"],
  ["walked", "walk"],
  ["walking", "walk"],
  ["ran", "run"],
  ["running", "run"],
  ["talked", "talk"],
  ["talking", "talk"],
  ["called", "call"],
  ["calling", "call"],
  ["texted", "text"],
  ["texting", "text"],
  ["friends", "friend"],
  ["families", "family"],
  ["meetings", "meeting"],
  ["appointments", "appointment"],
  ["deadlines", "deadline"],
  ["ideas", "idea"],
  ["stories", "story"],
  ["classes", "class"],
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

function normalizeToken(value: string) {
  const clean = value.toLowerCase().replace(/[^\w'-]/g, "").replace(/'s$/, "");
  return tokenAliases.get(clean) ?? clean;
}

function getNormalizedWords(body: string) {
  return (body.toLowerCase().match(/[a-z][a-z'-]{1,}/g) ?? []).map(normalizeToken).filter(Boolean);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function phraseHits(normalizedBody: string, phrases: string[] = []) {
  return phrases.filter((phrase) => {
    const pattern = phrase.toLowerCase().trim().split(/\s+/).map(escapeRegExp).join("\\s+");
    return new RegExp(`\\b${pattern}\\b`).test(normalizedBody);
  }).length;
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1).toLowerCase()}`)
    .join(" ");
}

function threadName(kind: ThreadKind, label: string) {
  return kind === "theme" ? label : `${kind}: ${label}`;
}

function parseThreadName(name: string) {
  const prefixedKinds: Exclude<ThreadKind, "theme">[] = ["who", "event", "place", "emotion"];

  for (const kind of prefixedKinds) {
    const prefix = `${kind}: `;
    if (name.startsWith(prefix)) {
      return {
        kind,
        label: name.replace(prefix, ""),
      };
    }
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

function extractThreadCandidates(body: string) {
  const normalized = body.toLowerCase();
  const words = getNormalizedWords(body);
  const wordSet = new Set(words);
  const matchedPeople = extractPeopleThreads(body, words);
  const matchedGroups = [...threadKeywordGroups, ...eventKeywordGroups, ...placeKeywordGroups].flatMap((group) => {
    const keywordScore = group.keywords.reduce((score, keyword) => {
      return score + (wordSet.has(normalizeToken(keyword)) ? 1 : 0);
    }, 0);
    const phraseScore = phraseHits(normalized, group.phrases) * 2;
    const total = keywordScore + phraseScore;

    return total > 0
      ? [
          {
            name: threadName(group.kind, group.name),
            score: total,
          },
        ]
      : [];
  });
  const wordCounts = new Map<string, number>();

  for (const word of words) {
    const clean = normalizeToken(word);
    if (clean.length < 4 || stopWords.has(clean)) continue;
    wordCounts.set(clean, (wordCounts.get(clean) ?? 0) + 1);
  }

  const fallbackWords = [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .filter(([word]) => ![...matchedGroups, ...matchedPeople].some((candidate) => candidate.name.toLowerCase().includes(word)))
    .map(([word, count]) => ({
      name: threadName("theme", word),
      score: Math.min(2, count),
    }))
    .slice(0, 2);

  const candidates = [...matchedPeople, ...matchedGroups, ...fallbackWords].reduce<ThreadCandidate[]>((acc, candidate) => {
    const existing = acc.find((item) => item.name === candidate.name);
    if (existing) {
      existing.score = Math.max(existing.score, candidate.score);
      return acc;
    }

    acc.push(candidate);
    return acc;
  }, []);

  const sorted = candidates.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, 6);

  return sorted.length > 0 ? sorted : [{ name: "loose thoughts", score: 1 }];
}

function extractPeopleThreads(body: string, words: string[]) {
  const people = new Map<string, number>();
  const capitalizedPersonPattern =
    /\b(?:with|about|for|from|to|called|texted|met|saw|missed|seeing|helped|thanked|visited|invited|told|asked)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g;
  const lowerPersonPattern =
    /\b(?:with|about|for|from|to|called|texted|met|saw|missed|seeing|helped|thanked|visited|invited|told|asked)\s+([a-z][a-z]+(?:\s+[a-z][a-z]+)?)/g;
  const ignoredNames = new Set([
    "today",
    "tomorrow",
    "yesterday",
    "morning",
    "night",
    "work",
    "school",
    "home",
    "gym",
    "class",
    "meeting",
  ]);
  const addPerson = (name: string, score: number) => {
    if (!name || ignoredNames.has(name.toLowerCase())) return;
    const titled = titleCase(name);
    people.set(titled, Math.max(people.get(titled) ?? 0, score));
  };

  for (const match of body.matchAll(capitalizedPersonPattern)) {
    const name = match[1]?.trim();
    if (name) addPerson(name, 4);
  }

  for (const match of body.toLowerCase().matchAll(lowerPersonPattern)) {
    const name = match[1]?.trim();
    if (name) addPerson(name, 3);
  }

  for (const word of words) {
    if (relationshipWords.has(word)) addPerson(word, 2);
  }

  return [...people.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 2)
    .map(([person, score]) => ({
      name: threadName("who", person),
      score,
    }));
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
    description: describeThread(name),
  };

  await db.insert(threads).values(thread);
  return thread;
}

async function connectNoteToThreads(note: { id: string; userId: string; body: string }) {
  const threadCandidates = extractThreadCandidates(note.body);

  for (const [index, candidate] of threadCandidates.entries()) {
    const thread = await findOrCreateThread(note.userId, candidate.name);

    await db
      .insert(notesToThreads)
      .values({
        noteId: note.id,
        threadId: thread.id,
        confidence: Math.max(58, Math.min(98, 66 + candidate.score * 7 - index * 4)),
      })
      .onConflictDoNothing();
  }
}

async function rebuildNoteThreads(note: { id: string; userId: string; body: string }) {
  await db.delete(notesToThreads).where(eq(notesToThreads.noteId, note.id));

  if (note.body.trim()) {
    await connectNoteToThreads(note);
  }
}

function describeThread(name: string) {
  const parsed = parseThreadName(name);

  if (parsed.kind === "who") return `Notes that mention ${parsed.label} or your relationship with them.`;
  if (parsed.kind === "event") return `Notes connected to ${parsed.label} moments, plans, or follow-ups.`;
  if (parsed.kind === "place") return `Notes tied to ${parsed.label} as a setting or destination.`;
  if (parsed.kind === "emotion") return `Notes where ${parsed.label} seems to be part of the mood.`;

  return `Notes that seem connected to ${parsed.label}.`;
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

export async function updateNote(input: { userId: string; noteId: string; body: string }) {
  const body = input.body.trim();
  if (!body) throw new Error("A note cannot be empty.");

  const existing = await getNoteById(input.userId, input.noteId);
  if (!existing) return null;

  await db
    .update(notes)
    .set({
      body,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(notes.userId, input.userId),
        eq(notes.id, input.noteId),
      ),
    );

  await rebuildNoteThreads({
    id: input.noteId,
    userId: input.userId,
    body,
  });

  return getNoteById(input.userId, input.noteId);
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

export async function saveReflection(input: { userId: string; writtenFor: string; body: string }) {
  const existing = await getReflection(input.userId, input.writtenFor);

  if (existing) {
    await db
      .update(notes)
      .set({
        body: input.body,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, existing.id));

    await rebuildNoteThreads({
      id: existing.id,
      userId: input.userId,
      body: input.body,
    });

    return {
      ...existing,
      body: input.body,
      updatedAt: new Date(),
    };
  }

  const reflection = {
    id: randomUUID(),
    userId: input.userId,
    body: input.body,
    kind: "reflection" as const,
    writtenFor: input.writtenFor,
  };

  await db.insert(notes).values(reflection);
  await rebuildNoteThreads(reflection);
  return reflection;
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
    await rebuildNoteThreads(note);
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
    .map((thread) => {
      const parsedThread = parseThreadName(thread.name);
      const threadNotes = thread.noteLinks
        .map((link) => ({
          id: link.note.id,
          body: link.note.body,
          confidence: link.confidence,
          createdAt: link.note.createdAt,
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return {
        id: thread.id,
        name: parsedThread.label,
        kind: parsedThread.kind,
        description: thread.description,
        noteCount: thread.noteLinks.length,
        latestNoteAt: threadNotes[0]?.createdAt.getTime() ?? 0,
        notes: threadNotes.slice(0, 4),
      };
    })
    .filter((thread) => thread.noteCount > 0)
    .sort((a, b) => b.noteCount - a.noteCount || b.latestNoteAt - a.latestNoteAt || a.name.localeCompare(b.name))
    .slice(0, 8)
    .map((thread) => ({
      id: thread.id,
      name: thread.name,
      kind: thread.kind,
      description: thread.description,
      noteCount: thread.noteCount,
      notes: thread.notes,
    }));
}
