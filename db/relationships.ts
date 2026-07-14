import "server-only";

import { randomUUID } from "node:crypto";

import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { importantDates, interactions, people } from "@/db/schema";

function cleanTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of input) {
    if (typeof value !== "string") continue;
    const tag = value.trim().toLowerCase();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    result.push(tag);
  }
  return result;
}

export async function createPerson(input: {
  userId: string;
  name: string;
  relationship?: string | null;
  howWeMet?: string | null;
  tags?: unknown;
  summary?: string | null;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("A person needs a name.");

  const person = {
    id: randomUUID(),
    userId: input.userId,
    name,
    relationship: input.relationship?.trim() || null,
    howWeMet: input.howWeMet?.trim() || null,
    tags: cleanTags(input.tags),
    summary: input.summary?.trim() || null,
  };

  await db.insert(people).values(person);
  return person;
}

export function getPeople(userId: string) {
  return db.query.people.findMany({
    where: eq(people.userId, userId),
    orderBy: [desc(people.updatedAt)],
    with: {
      interactions: {
        columns: { id: true, occurredAt: true, followUp: true, followUpDone: true },
      },
    },
  });
}

export function getPersonDeep(userId: string, personId: string) {
  return db.query.people.findFirst({
    where: and(eq(people.userId, userId), eq(people.id, personId)),
    with: {
      interactions: {
        orderBy: [desc(interactions.occurredAt)],
      },
      importantDates: {
        orderBy: [asc(importantDates.dateText)],
      },
    },
  });
}

export async function updatePerson(
  userId: string,
  personId: string,
  patch: {
    name?: string;
    relationship?: string | null;
    howWeMet?: string | null;
    tags?: unknown;
    summary?: string | null;
  },
) {
  const values: Record<string, unknown> = { updatedAt: new Date() };

  if (typeof patch.name === "string") {
    const name = patch.name.trim();
    if (!name) throw new Error("A person needs a name.");
    values.name = name;
  }
  if (patch.relationship !== undefined) values.relationship = patch.relationship?.trim() || null;
  if (patch.howWeMet !== undefined) values.howWeMet = patch.howWeMet?.trim() || null;
  if (patch.tags !== undefined) values.tags = cleanTags(patch.tags);
  if (patch.summary !== undefined) values.summary = patch.summary?.trim() || null;

  await db
    .update(people)
    .set(values)
    .where(and(eq(people.userId, userId), eq(people.id, personId)));
}

export async function deletePerson(userId: string, personId: string) {
  await db.delete(people).where(and(eq(people.userId, userId), eq(people.id, personId)));
}

async function assertPersonOwned(userId: string, personId: string) {
  const person = await db.query.people.findFirst({
    columns: { id: true },
    where: and(eq(people.userId, userId), eq(people.id, personId)),
  });
  if (!person) throw new Error("Person not found.");
}

export async function createInteraction(input: {
  userId: string;
  personId: string;
  occurredAt?: Date;
  context?: string | null;
  source?: string | null;
  facts: string;
  interpretation?: string | null;
  topics?: unknown;
  tags?: unknown;
  followUp?: string | null;
}) {
  await assertPersonOwned(input.userId, input.personId);

  const facts = input.facts.trim();
  if (!facts) throw new Error("An entry needs at least some factual notes.");

  const interaction = {
    id: randomUUID(),
    userId: input.userId,
    personId: input.personId,
    occurredAt: input.occurredAt ?? new Date(),
    context: input.context?.trim() || null,
    source: input.source?.trim() || "in-person conversation",
    facts,
    interpretation: input.interpretation?.trim() || null,
    topics: cleanTags(input.topics),
    tags: cleanTags(input.tags),
    followUp: input.followUp?.trim() || null,
    followUpDone: false,
  };

  await db.insert(interactions).values(interaction);
  await db.update(people).set({ updatedAt: new Date() }).where(eq(people.id, input.personId));
  return interaction;
}

export async function updateInteraction(
  userId: string,
  interactionId: string,
  patch: {
    occurredAt?: Date;
    context?: string | null;
    source?: string | null;
    facts?: string;
    interpretation?: string | null;
    topics?: unknown;
    tags?: unknown;
    followUp?: string | null;
    followUpDone?: boolean;
  },
) {
  const values: Record<string, unknown> = { updatedAt: new Date() };

  if (patch.occurredAt !== undefined) values.occurredAt = patch.occurredAt;
  if (patch.context !== undefined) values.context = patch.context?.trim() || null;
  if (patch.source !== undefined) values.source = patch.source?.trim() || "in-person conversation";
  if (typeof patch.facts === "string") {
    const facts = patch.facts.trim();
    if (!facts) throw new Error("An entry needs at least some factual notes.");
    values.facts = facts;
  }
  if (patch.interpretation !== undefined) values.interpretation = patch.interpretation?.trim() || null;
  if (patch.topics !== undefined) values.topics = cleanTags(patch.topics);
  if (patch.tags !== undefined) values.tags = cleanTags(patch.tags);
  if (patch.followUp !== undefined) values.followUp = patch.followUp?.trim() || null;
  if (typeof patch.followUpDone === "boolean") values.followUpDone = patch.followUpDone;

  await db
    .update(interactions)
    .set(values)
    .where(and(eq(interactions.userId, userId), eq(interactions.id, interactionId)));
}

export async function deleteInteraction(userId: string, interactionId: string) {
  await db
    .delete(interactions)
    .where(and(eq(interactions.userId, userId), eq(interactions.id, interactionId)));
}

export async function addImportantDate(input: {
  userId: string;
  personId: string;
  label: string;
  dateText: string;
  note?: string | null;
}) {
  await assertPersonOwned(input.userId, input.personId);

  const label = input.label.trim();
  const dateText = input.dateText.trim();
  if (!label) throw new Error("An important date needs a label.");
  if (!dateText) throw new Error("An important date needs a date.");

  const record = {
    id: randomUUID(),
    userId: input.userId,
    personId: input.personId,
    label,
    dateText,
    note: input.note?.trim() || null,
  };

  await db.insert(importantDates).values(record);
  return record;
}

export async function deleteImportantDate(userId: string, dateId: string) {
  await db
    .delete(importantDates)
    .where(and(eq(importantDates.userId, userId), eq(importantDates.id, dateId)));
}
