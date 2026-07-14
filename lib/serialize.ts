// Wire types shared between route handlers, the server pages, and the client
// components. Keeping them in one place means the API and the UI can never
// drift apart.

export type InteractionDTO = {
  id: string;
  occurredAt: string;
  context: string | null;
  source: string;
  facts: string;
  interpretation: string | null;
  topics: string[];
  tags: string[];
  followUp: string | null;
  followUpDone: boolean;
};

export type ImportantDateDTO = {
  id: string;
  label: string;
  dateText: string;
  note: string | null;
};

export type PersonSummaryDTO = {
  id: string;
  name: string;
  relationship: string | null;
  tags: string[];
  interactionCount: number;
  openFollowUps: number;
  lastInteractionAt: string | null;
};

export type PersonDetailDTO = {
  id: string;
  name: string;
  relationship: string | null;
  howWeMet: string | null;
  tags: string[];
  summary: string | null;
  interactions: InteractionDTO[];
  importantDates: ImportantDateDTO[];
};

type InteractionRow = {
  id: string;
  occurredAt: Date;
  context: string | null;
  source: string;
  facts: string;
  interpretation: string | null;
  topics: string[];
  tags: string[];
  followUp: string | null;
  followUpDone: boolean;
};

type DateRow = {
  id: string;
  label: string;
  dateText: string;
  note: string | null;
};

export function serializeInteraction(row: InteractionRow): InteractionDTO {
  return {
    id: row.id,
    occurredAt: row.occurredAt.toISOString(),
    context: row.context,
    source: row.source,
    facts: row.facts,
    interpretation: row.interpretation,
    topics: row.topics ?? [],
    tags: row.tags ?? [],
    followUp: row.followUp,
    followUpDone: row.followUpDone,
  };
}

export function serializeDate(row: DateRow): ImportantDateDTO {
  return { id: row.id, label: row.label, dateText: row.dateText, note: row.note };
}

export function serializePersonDetail(row: {
  id: string;
  name: string;
  relationship: string | null;
  howWeMet: string | null;
  tags: string[];
  summary: string | null;
  interactions: InteractionRow[];
  importantDates: DateRow[];
}): PersonDetailDTO {
  return {
    id: row.id,
    name: row.name,
    relationship: row.relationship,
    howWeMet: row.howWeMet,
    tags: row.tags ?? [],
    summary: row.summary,
    interactions: row.interactions.map(serializeInteraction),
    importantDates: row.importantDates.map(serializeDate),
  };
}

export function serializePersonSummary(row: {
  id: string;
  name: string;
  relationship: string | null;
  tags: string[];
  interactions: { occurredAt: Date; followUp: string | null; followUpDone: boolean }[];
}): PersonSummaryDTO {
  const sorted = [...row.interactions].sort((a, b) => +b.occurredAt - +a.occurredAt);
  const openFollowUps = row.interactions.filter((i) => i.followUp && !i.followUpDone).length;
  return {
    id: row.id,
    name: row.name,
    relationship: row.relationship,
    tags: row.tags ?? [],
    interactionCount: row.interactions.length,
    openFollowUps,
    lastInteractionAt: sorted[0] ? sorted[0].occurredAt.toISOString() : null,
  };
}
