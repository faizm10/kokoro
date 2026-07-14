// A grounded, retrieval-only assistant for interaction notes.
//
// Design intent (this is a safety boundary, not a stylistic choice):
//   * It can ONLY surface information the user has written down. It never
//     generates free-form claims, so it cannot fabricate facts.
//   * Every statement it makes is tied to specific notes ("citations").
//   * It refuses questions that ask it to infer mental health, personality,
//     private motives, vulnerabilities, stress levels, or hidden intentions,
//     or to devise ways to influence a person.
//   * Its output is grouped into three clearly-labelled tiers so the user can
//     always tell directly-stated facts from their own interpretation from a
//     machine suggestion.
//
// The function signature is deliberately data-in / data-out so that a real
// language model could later be placed behind the same interface without
// weakening any of the guarantees above.

export type AssistantInteraction = {
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

export type AssistantDate = {
  id: string;
  label: string;
  dateText: string;
  note: string | null;
};

export type Citation = {
  interactionId: string;
  occurredAt: string;
  snippet: string;
};

export type AssistantTier = "directly-stated" | "interpretation" | "suggestion";

export type AssistantSection = {
  tier: AssistantTier;
  heading: string;
  lines: string[];
  citations: Citation[];
};

export type AssistantAnswer = {
  kind: "answer" | "refusal" | "empty";
  lead: string;
  sections: AssistantSection[];
  // How confident the grounding is, purely as a function of evidence volume.
  caution: string | null;
};

// Questions that would require the assistant to psychologise, infer hidden
// states, or strategise about a person. These are declined by design.
// A person pronoun/object fragment, so the guards fire regardless of whether
// the question says "them", "her", "him", "she", "he", or "this person".
const WHO = "(?:them|they|her|him|she|he|this person)";

const PROHIBITED_PATTERNS: { pattern: RegExp; topic: string }[] = [
  { pattern: /\b(depress|anxi|adhd|autis|bipolar|ocd|ptsd|narciss|sociopath|psychopath|disorder|diagnos|mental health|neurodiverg)/i, topic: "mental-health" },
  { pattern: new RegExp(`\\b(personality type|what kind of person|are ${WHO} (?:a|an) |true (?:self|nature)|who ${WHO} really (?:is|are)|really like deep down)`, "i"), topic: "personality" },
  { pattern: new RegExp(`\\b(real motive|hidden (?:agenda|intention|motive)|secretly|ulterior|what (?:do|does) ${WHO} really want|why (?:do|does) ${WHO} really)`, "i"), topic: "motive" },
  { pattern: /\b(vulnerab|weakness|insecur|exploit|leverage over|pressure point|soft spot)/i, topic: "vulnerability" },
  { pattern: new RegExp(`\\b(stress(?:ed)? level|how stressed|(?:is|are) ${WHO} (?:stressed|depressed|struggling|okay|ok|sad|angry|upset)|emotional state|how (?:is|are|does) ${WHO} feel|mood (?:is|seems))`, "i"), topic: "internal-state" },
  { pattern: new RegExp(`\\b(manipulat|persuade|convince|influence ${WHO}|win ${WHO} over|get ${WHO} to |talk ${WHO} into|make ${WHO} (?:like|trust|do))`, "i"), topic: "manipulation" },
  { pattern: new RegExp(`\\b(where (?:is|are) ${WHO}|(?:their|her|his) (?:location|whereabouts)|track ${WHO}|who (?:is|are) ${WHO} with|follow ${WHO})`, "i"), topic: "tracking" },
];

const REFUSAL_MESSAGES: Record<string, string> = {
  "mental-health":
    "I won't guess at diagnoses or mental-health labels. Those aren't things a notes app should infer about someone.",
  personality:
    "I won't try to sum up who someone \"really is.\" I can only reflect back specific things you noted they said or did.",
  motive:
    "I won't speculate about hidden motives or intentions. I can show you what was actually said, and you can draw your own conclusions.",
  vulnerability:
    "I won't look for weaknesses, pressure points, or ways to exploit someone. That isn't what this is for.",
  "internal-state":
    "I won't infer someone's stress or emotional state. I can only surface what you explicitly recorded them expressing.",
  manipulation:
    "I won't help plan how to influence, persuade, or manage someone. I can help you remember and prepare respectful, honest questions.",
  tracking:
    "I don't track people, locations, or activity. I only work with the notes you've written from your own direct interactions.",
};

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
  "what", "when", "where", "who", "how", "why", "do", "did", "does", "is", "are",
  "was", "were", "have", "has", "had", "i", "me", "my", "we", "they", "them",
  "their", "this", "that", "these", "those", "about", "over", "time", "most",
  "often", "come", "up", "been", "has", "any", "some", "tell", "show", "give",
  "them", "him", "her", "his", "she", "he", "you", "your", "our", "us", "can",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function snippet(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function citationFor(interaction: AssistantInteraction): Citation {
  return {
    interactionId: interaction.id,
    occurredAt: interaction.occurredAt,
    snippet: snippet(interaction.facts),
  };
}

function detectProhibited(question: string): string | null {
  for (const { pattern, topic } of PROHIBITED_PATTERNS) {
    if (pattern.test(question)) return topic;
  }
  return null;
}

function cautionFor(evidenceCount: number): string | null {
  if (evidenceCount === 0) return null;
  if (evidenceCount === 1) {
    return "This rests on a single note, so treat it as a one-off rather than a pattern.";
  }
  if (evidenceCount === 2) {
    return "This is based on only two notes — it may be a coincidence rather than a real pattern.";
  }
  return null;
}

function topicFrequencies(interactions: AssistantInteraction[]) {
  const counts = new Map<string, AssistantInteraction[]>();
  for (const interaction of interactions) {
    for (const topic of interaction.topics) {
      const list = counts.get(topic) ?? [];
      list.push(interaction);
      counts.set(topic, list);
    }
  }
  return [...counts.entries()]
    .map(([topic, list]) => ({ topic, interactions: list }))
    .sort((a, b) => b.interactions.length - a.interactions.length);
}

function openFollowUps(interactions: AssistantInteraction[]) {
  return interactions.filter((i) => i.followUp && !i.followUpDone);
}

// --- Intent handlers ---------------------------------------------------------

function answerTopics(interactions: AssistantInteraction[]): AssistantAnswer | null {
  const ranked = topicFrequencies(interactions).filter((entry) => entry.interactions.length > 0);
  if (ranked.length === 0) return null;

  const top = ranked.slice(0, 6);
  const lines = top.map(
    (entry) =>
      `“${entry.topic}” — noted in ${entry.interactions.length} ${
        entry.interactions.length === 1 ? "conversation" : "conversations"
      }.`,
  );
  const citations = top.flatMap((entry) => entry.interactions.slice(0, 3).map(citationFor));

  return {
    kind: "answer",
    lead: "Here are the topics that recur across your notes, counted from the topics you tagged.",
    sections: [
      { tier: "directly-stated", heading: "Topics you've recorded", lines, citations },
    ],
    caution: cautionFor(Math.max(...top.map((entry) => entry.interactions.length))),
  };
}

function answerFollowUps(interactions: AssistantInteraction[]): AssistantAnswer | null {
  const open = openFollowUps(interactions);
  if (open.length === 0) {
    return {
      kind: "answer",
      lead: "No open follow-ups right now — every commitment you logged is marked done.",
      sections: [],
      caution: null,
    };
  }

  const lines = open.map((i) => `${i.followUp} — from your note on ${formatDate(i.occurredAt)}.`);
  return {
    kind: "answer",
    lead: "These are the follow-ups you noted for yourself and haven't marked done yet.",
    sections: [
      {
        tier: "directly-stated",
        heading: "Open follow-ups you owe",
        lines,
        citations: open.map(citationFor),
      },
    ],
    caution: null,
  };
}

function answerDates(dates: AssistantDate[]): AssistantAnswer | null {
  if (dates.length === 0) return null;
  const lines = dates.map(
    (d) => `${d.label}: ${d.dateText}${d.note ? ` — ${d.note}` : ""}.`,
  );
  return {
    kind: "answer",
    lead: "These are the dates you recorded that they mentioned to you.",
    sections: [{ tier: "directly-stated", heading: "Important dates", lines, citations: [] }],
    caution: null,
  };
}

function answerSearch(
  question: string,
  interactions: AssistantInteraction[],
): AssistantAnswer | null {
  const terms = tokenize(question);
  if (terms.length === 0) return null;

  const scored = interactions
    .map((interaction) => {
      const haystack = [
        interaction.facts,
        interaction.interpretation ?? "",
        interaction.context ?? "",
        interaction.topics.join(" "),
        interaction.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      const score = terms.reduce((sum, term) => (haystack.includes(term) ? sum + 1 : sum), 0);
      return { interaction, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || +new Date(b.interaction.occurredAt) - +new Date(a.interaction.occurredAt));

  if (scored.length === 0) return null;

  const matches = scored.slice(0, 5).map((entry) => entry.interaction);
  const factLines = matches.map(
    (i) => `On ${formatDate(i.occurredAt)} (${i.source}): ${snippet(i.facts)}`,
  );
  const sections: AssistantSection[] = [
    {
      tier: "directly-stated",
      heading: "What you recorded them saying or doing",
      lines: factLines,
      citations: matches.map(citationFor),
    },
  ];

  const interpretations = matches.filter((i) => i.interpretation);
  if (interpretations.length > 0) {
    sections.push({
      tier: "interpretation",
      heading: "Your own interpretation at the time",
      lines: interpretations.map(
        (i) => `${formatDate(i.occurredAt)}: ${snippet(i.interpretation ?? "")}`,
      ),
      citations: interpretations.map(citationFor),
    });
  }

  return {
    kind: "answer",
    lead: "Here's what your notes contain on that. I've kept what was said separate from how you read it.",
    sections,
    caution: cautionFor(matches.length),
  };
}

function suggestQuestions(interactions: AssistantInteraction[]): AssistantSection | null {
  const ranked = topicFrequencies(interactions);
  const open = openFollowUps(interactions);
  const lines: string[] = [];

  for (const followUp of open.slice(0, 2)) {
    lines.push(`You noted you'd follow up: “${followUp.followUp}”. A natural opener next time.`);
  }
  for (const entry of ranked.slice(0, 2)) {
    lines.push(`They've brought up “${entry.topic}” before — you could ask how that's going.`);
  }

  if (lines.length === 0) return null;
  return {
    tier: "suggestion",
    heading: "Respectful things you might ask next time",
    lines,
    citations: [],
  };
}

// --- Entry point -------------------------------------------------------------

export function answerQuestion(
  question: string,
  interactions: AssistantInteraction[],
  dates: AssistantDate[],
): AssistantAnswer {
  const trimmed = question.trim();

  const prohibited = detectProhibited(trimmed);
  if (prohibited) {
    return {
      kind: "refusal",
      lead: REFUSAL_MESSAGES[prohibited],
      sections: [],
      caution: null,
    };
  }

  if (interactions.length === 0 && dates.length === 0) {
    return {
      kind: "empty",
      lead: "There aren't any notes for this person yet, so there's nothing for me to draw on. Add an interaction first.",
      sections: [],
      caution: null,
    };
  }

  const lowered = trimmed.toLowerCase();
  let answer: AssistantAnswer | null = null;

  if (/\b(topic|talk about|discuss|come up|bring up)\b/.test(lowered)) {
    answer = answerTopics(interactions);
  } else if (/\b(follow[\s-]?up|owe|commit|promis|get back|forgot|forget|to-?do)\b/.test(lowered)) {
    answer = answerFollowUps(interactions);
  } else if (/\b(date|birthday|anniversar|important day)\b/.test(lowered)) {
    answer = answerDates(dates) ?? answerSearch(trimmed, interactions);
  } else if (/\b(summar|overview|everything|learned|recap|catch me up)\b/.test(lowered)) {
    answer = answerSummary(interactions, dates);
  }

  if (!answer) answer = answerSearch(trimmed, interactions);

  if (!answer) {
    return {
      kind: "empty",
      lead: "I couldn't find anything in your notes matching that. Try different words, or ask about topics, follow-ups, or dates.",
      sections: [],
      caution: null,
    };
  }

  // Offer respectful follow-up questions alongside grounded answers.
  if (answer.kind === "answer") {
    const suggestion = suggestQuestions(interactions);
    if (suggestion) answer.sections.push(suggestion);
  }

  return answer;
}

function answerSummary(
  interactions: AssistantInteraction[],
  dates: AssistantDate[],
): AssistantAnswer {
  const ranked = topicFrequencies(interactions).slice(0, 5);
  const open = openFollowUps(interactions);
  const recent = [...interactions]
    .sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt))
    .slice(0, 3);

  const sections: AssistantSection[] = [];

  if (ranked.length > 0) {
    sections.push({
      tier: "directly-stated",
      heading: "Topics that come up most",
      lines: ranked.map(
        (entry) => `“${entry.topic}” — ${entry.interactions.length}×`,
      ),
      citations: ranked.flatMap((entry) => entry.interactions.slice(0, 1).map(citationFor)),
    });
  }

  if (recent.length > 0) {
    sections.push({
      tier: "directly-stated",
      heading: "Most recent notes",
      lines: recent.map((i) => `${formatDate(i.occurredAt)}: ${snippet(i.facts, 120)}`),
      citations: recent.map(citationFor),
    });
  }

  if (open.length > 0) {
    sections.push({
      tier: "directly-stated",
      heading: "Still open on your side",
      lines: open.map((i) => `${i.followUp} (from ${formatDate(i.occurredAt)})`),
      citations: open.map(citationFor),
    });
  }

  if (dates.length > 0) {
    sections.push({
      tier: "directly-stated",
      heading: "Dates they mentioned",
      lines: dates.map((d) => `${d.label}: ${d.dateText}`),
      citations: [],
    });
  }

  return {
    kind: "answer",
    lead: `Here's a recap built only from your ${interactions.length} ${
      interactions.length === 1 ? "note" : "notes"
    }. Nothing here is inferred beyond what you wrote.`,
    sections,
    caution: cautionFor(interactions.length),
  };
}
