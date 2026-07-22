"use client";

import { type FormEvent, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ListChecks,
  Pencil,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { AssistantAnswer, AssistantTier } from "@/lib/assistant";
import type { ImportantDateDTO, InteractionDTO, PersonDetailDTO } from "@/lib/serialize";
import { cn } from "@/lib/utils";

const SOURCE_OPTIONS = [
  "observation",
  "in-person conversation",
  "message they sent me",
  "phone call",
  "video call",
  "email",
  "group setting",
];

const labelClass = "mb-1 block font-hand text-[14px] text-stone";
const fieldClass =
  "h-auto w-full rounded-none border-0 border-b border-[#d8d5cb] bg-transparent px-0 py-2 text-[15px] shadow-none outline-none placeholder:text-stone/45 focus-visible:border-primary focus-visible:ring-0";
const notePaper =
  "relative overflow-hidden rounded-[4px] border border-[#e2dfd4] bg-[#faf9f5] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-[#d9c7b6]";
const ruledArea =
  "min-h-[7.5rem] w-full resize-none border-0 bg-transparent px-0 py-1 text-[15px] leading-7 text-foreground outline-none placeholder:text-stone/45 [background-image:repeating-linear-gradient(transparent,transparent_27px,rgba(222,220,210,0.55)_28px)] [background-position:0_7px]";

const TIER_LABEL: Record<AssistantTier, string> = {
  "directly-stated": "directly stated",
  interpretation: "your interpretation",
  suggestion: "ai suggestion",
};

const TIER_STYLE: Record<AssistantTier, string> = {
  "directly-stated": "border-olive/30 bg-secondary/50 text-olive",
  interpretation: "border-stone/30 bg-background text-stone",
  suggestion: "border-primary/30 bg-primary/5 text-primary",
};

function toLocalInput(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDay(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function csv(values: string[]) {
  return values.join(", ");
}

function parseCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

type InteractionDraft = {
  occurredAt: string;
  source: string;
  context: string;
  facts: string;
  interpretation: string;
  topics: string;
  tags: string;
  followUp: string;
};

function emptyDraft(): InteractionDraft {
  return {
    occurredAt: toLocalInput(new Date().toISOString()),
    source: SOURCE_OPTIONS[0],
    context: "",
    facts: "",
    interpretation: "",
    topics: "",
    tags: "",
    followUp: "",
  };
}

function draftFrom(interaction: InteractionDTO): InteractionDraft {
  return {
    occurredAt: toLocalInput(interaction.occurredAt),
    source: interaction.source,
    context: interaction.context ?? "",
    facts: interaction.facts,
    interpretation: interaction.interpretation ?? "",
    topics: csv(interaction.topics),
    tags: csv(interaction.tags),
    followUp: interaction.followUp ?? "",
  };
}

function draftToPayload(draft: InteractionDraft) {
  return {
    occurredAt: draft.occurredAt
      ? new Date(draft.occurredAt).toISOString()
      : new Date().toISOString(),
    source: draft.source,
    context: draft.context || null,
    facts: draft.facts,
    interpretation: draft.interpretation || null,
    topics: parseCsv(draft.topics),
    tags: parseCsv(draft.tags),
    followUp: draft.followUp || null,
  };
}

function InteractionForm({
  draft,
  setDraft,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
}: {
  draft: InteractionDraft;
  setDraft: (updater: (prev: InteractionDraft) => InteractionDraft) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitting: boolean;
  submitLabel: string;
}) {
  const isObservation = draft.source === "observation";

  function handle(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handle} className={cn(notePaper, "grid gap-6 px-5 py-5 sm:px-6 sm:py-6")}>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4 border-b border-[#e4e1d7] pb-4">
        <div className="min-w-[180px] flex-1">
          <Label className={labelClass}>when</Label>
          <DateTimePicker
            value={draft.occurredAt}
            onChange={(occurredAt) => setDraft((d) => ({ ...d, occurredAt }))}
            className="h-auto justify-start rounded-none border-0 border-b border-[#d8d5cb] bg-transparent px-0 py-2 shadow-none hover:bg-transparent"
          />
        </div>
        <div className="min-w-[180px] flex-1">
          <Label className={labelClass}>how it happened</Label>
          <Select
            value={draft.source}
            onValueChange={(source) => setDraft((d) => ({ ...d, source }))}
          >
            <SelectTrigger className={cn(fieldClass, "[&>svg]:opacity-50")}>
              <SelectValue placeholder="choose one" />
            </SelectTrigger>
            <SelectContent className="rounded-[12px] border-border bg-card">
              {SOURCE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option} className="rounded-[8px]">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className={labelClass}>{isObservation ? "where you noticed it" : "where / why, if it helps"}</Label>
        <Input
          className={fieldClass}
          value={draft.context}
          onChange={(e) => setDraft((d) => ({ ...d, context: e.target.value }))}
          placeholder={isObservation ? "at work, in class, on a walk…" : "over coffee, after class…"}
        />
      </div>

      <div>
        <Label className={labelClass}>{isObservation ? "what you observed" : "what they said or did"}</Label>
        <p className="mb-2 text-[12px] text-stone/65">
          {isObservation
            ? "write only what you noticed directly — behavior, patterns, preferences, or context."
            : "stick to what actually happened — this is the note itself."}
        </p>
        <Textarea
          value={draft.facts}
          onChange={(e) => setDraft((d) => ({ ...d, facts: e.target.value }))}
          placeholder={isObservation ? "they seemed energized after talking about…" : "write freely…"}
          className={ruledArea}
        />
      </div>

      <div>
        <Label className={labelClass}>{isObservation ? "what it might mean to you" : "your private read"}</Label>
        <p className="mb-2 text-[12px] text-stone/65">optional. kept separate from the facts on purpose.</p>
        <Textarea
          value={draft.interpretation}
          onChange={(e) => setDraft((d) => ({ ...d, interpretation: e.target.value }))}
          placeholder="what you made of it…"
          className={cn(ruledArea, "min-h-[4.5rem]")}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label className={labelClass}>topics</Label>
          <Input
            className={fieldClass}
            value={draft.topics}
            onChange={(e) => setDraft((d) => ({ ...d, topics: e.target.value }))}
            placeholder="climbing, new job…"
          />
        </div>
        <div>
          <Label className={labelClass}>tags</Label>
          <Input
            className={fieldClass}
            value={draft.tags}
            onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))}
            placeholder="work, catch-up…"
          />
        </div>
      </div>

      <div>
        <Label className={labelClass}>a follow-up you owe</Label>
        <Input
          className={fieldClass}
          value={draft.followUp}
          onChange={(e) => setDraft((d) => ({ ...d, followUp: e.target.value }))}
          placeholder="send that article…"
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={!draft.facts.trim() || submitting}>
          {submitting ? "saving…" : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            never mind
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function TierBadge({ tier }: { tier: AssistantTier }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] tracking-[0.06em] uppercase",
        TIER_STYLE[tier],
      )}
    >
      {TIER_LABEL[tier]}
    </span>
  );
}

function AssistantAnswerView({
  answer,
  onCite,
}: {
  answer: AssistantAnswer;
  onCite: (interactionId: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p
        className={cn(
          "text-sm leading-6",
          answer.kind === "refusal" ? "text-olive" : "text-foreground",
        )}
      >
        {answer.lead}
      </p>

      {answer.sections.map((section, index) => (
        <div key={`${section.heading}-${index}`} className="rounded-[10px] border border-border bg-background/50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <TierBadge tier={section.tier} />
            <span className="text-[11px] tracking-[0.06em] text-stone">{section.heading}</span>
          </div>
          <ul className="space-y-1.5">
            {section.lines.map((line, lineIndex) => (
              <li key={lineIndex} className="text-sm leading-6 text-foreground">
                {line}
              </li>
            ))}
          </ul>
          {section.citations.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-border pt-2.5">
              {section.citations.map((citation) => (
                <button
                  key={`${citation.interactionId}-${citation.snippet.slice(0, 8)}`}
                  type="button"
                  onClick={() => onCite(citation.interactionId)}
                  className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-stone transition-colors hover:border-ring/50 hover:text-foreground"
                  title={citation.snippet}
                >
                  note · {formatDay(citation.occurredAt).replace(/,.*$/, "")}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ))}

      {answer.caution ? (
        <p className="text-[12px] leading-5 text-stone">
          <span className="text-olive">a note on certainty: </span>
          {answer.caution}
        </p>
      ) : null}
    </div>
  );
}

type ChatTurn = { id: string; question: string; answer: AssistantAnswer | null };

export function PersonWorkspace({ initialPerson }: { initialPerson: PersonDetailDTO }) {
  const [person, setPerson] = useState(initialPerson);
  const [adding, setAdding] = useState(false);
  const [addDraft, setAddDraft] = useState<InteractionDraft>(emptyDraft);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<InteractionDraft>(emptyDraft);
  const [editSaving, setEditSaving] = useState(false);

  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);

  const [highlightId, setHighlightId] = useState<string | null>(null);

  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    name: person.name,
    relationship: person.relationship ?? "",
    howWeMet: person.howWeMet ?? "",
    tags: csv(person.tags),
    summary: person.summary ?? "",
  });

  const [dateForm, setDateForm] = useState({ label: "", dateText: "", note: "" });
  const [addingDate, setAddingDate] = useState(false);

  const timelineRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  const sharedTopics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const interaction of person.interactions) {
      for (const topic of interaction.topics) {
        counts.set(topic, (counts.get(topic) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .filter(([, count]) => count >= 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [person.interactions]);

  const openFollowUps = useMemo(
    () => person.interactions.filter((i) => i.followUp && !i.followUpDone),
    [person.interactions],
  );

  const allSources = useMemo(
    () => [...new Set(person.interactions.map((i) => i.source))],
    [person.interactions],
  );

  const filtered = useMemo(() => {
    const terms = query.trim().toLowerCase();
    return person.interactions.filter((interaction) => {
      if (tagFilter && !interaction.tags.includes(tagFilter) && !interaction.topics.includes(tagFilter)) {
        return false;
      }
      if (sourceFilter && interaction.source !== sourceFilter) return false;
      if (!terms) return true;
      const haystack = [
        interaction.facts,
        interaction.interpretation ?? "",
        interaction.context ?? "",
        interaction.topics.join(" "),
        interaction.tags.join(" "),
        interaction.followUp ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(terms);
    });
  }, [person.interactions, query, tagFilter, sourceFilter]);

  async function reload() {
    const response = await fetch(`/api/people/${person.id}`);
    if (response.ok) {
      const data = (await response.json()) as { person?: PersonDetailDTO };
      if (data.person) setPerson(data.person);
    }
  }

  async function handleAdd() {
    if (!addDraft.facts.trim() || addSaving) return;
    setAddSaving(true);
    setAddError("");
    try {
      const response = await fetch(`/api/people/${person.id}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftToPayload(addDraft)),
      });
      if (!response.ok) throw new Error("save failed");
      const data = (await response.json()) as { person?: PersonDetailDTO };
      if (data.person) setPerson(data.person);
      setAddDraft(emptyDraft());
      setAdding(false);
    } catch {
      setAddError("could not save this entry. try again.");
    } finally {
      setAddSaving(false);
    }
  }

  async function handleEditSave() {
    if (!editingId || !editDraft.facts.trim() || editSaving) return;
    setEditSaving(true);
    try {
      const response = await fetch(`/api/interactions/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftToPayload(editDraft)),
      });
      if (!response.ok) throw new Error("update failed");
      setEditingId(null);
      await reload();
    } finally {
      setEditSaving(false);
    }
  }

  async function toggleFollowUp(interaction: InteractionDTO) {
    await fetch(`/api/interactions/${interaction.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followUpDone: !interaction.followUpDone }),
    });
    await reload();
  }

  async function deleteInteraction(id: string) {
    await fetch(`/api/interactions/${id}`, { method: "DELETE" });
    await reload();
  }

  async function saveProfile() {
    const response = await fetch(`/api/people/${person.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: profileDraft.name,
        relationship: profileDraft.relationship || null,
        howWeMet: profileDraft.howWeMet || null,
        tags: parseCsv(profileDraft.tags),
        summary: profileDraft.summary || null,
      }),
    });
    if (response.ok) {
      const data = (await response.json()) as { person?: PersonDetailDTO };
      if (data.person) setPerson(data.person);
      setEditingProfile(false);
    }
  }

  async function addDate(event: FormEvent) {
    event.preventDefault();
    if (!dateForm.label.trim() || !dateForm.dateText.trim()) return;
    const response = await fetch(`/api/people/${person.id}/dates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dateForm),
    });
    if (response.ok) {
      setDateForm({ label: "", dateText: "", note: "" });
      setAddingDate(false);
      await reload();
    }
  }

  async function deleteDate(id: string) {
    await fetch(`/api/dates/${id}`, { method: "DELETE" });
    await reload();
  }

  async function ask(event: FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || asking) return;
    const turnId = crypto.randomUUID();
    setChat((prev) => [...prev, { id: turnId, question: trimmed, answer: null }]);
    setQuestion("");
    setAsking(true);
    try {
      const response = await fetch(`/api/people/${person.id}/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = (await response.json()) as { answer?: AssistantAnswer };
      setChat((prev) =>
        prev.map((turn) => (turn.id === turnId ? { ...turn, answer: data.answer ?? null } : turn)),
      );
    } finally {
      setAsking(false);
    }
  }

  function scrollToInteraction(id: string) {
    const node = timelineRefs.current.get(id);
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightId(id);
      window.setTimeout(() => setHighlightId((current) => (current === id ? null : current)), 1800);
    }
  }

  const suggestedQuestions = [
    "What topics come up most often?",
    "What follow-ups do I owe them?",
    "Summarize what I've learned.",
  ];

  function openAddForm(source = SOURCE_OPTIONS[0]) {
    setAddDraft({
      ...emptyDraft(),
      source,
    });
    setAdding(true);
  }

  return (
    <main className="min-h-screen bg-[rgba(245,244,237,0.72)] px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-[1180px]">
        <Link
          href="/people"
          className="inline-flex items-center gap-2 rounded-[8px] px-2 py-2 text-sm text-stone transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={1.5} />
          all people
        </Link>

        {/* Profile */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="mt-6 border-[#e2dfd4] bg-[#faf9f5]/92 p-6 shadow-[0_14px_40px_rgba(20,20,19,0.05)] sm:p-7">
            {editingProfile ? (
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className={labelClass}>NAME</Label>
                    <Input
                      className={fieldClass}
                      value={profileDraft.name}
                      onChange={(e) => setProfileDraft((d) => ({ ...d, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className={labelClass}>RELATIONSHIP</Label>
                    <Input
                      className={fieldClass}
                      value={profileDraft.relationship}
                      onChange={(e) => setProfileDraft((d) => ({ ...d, relationship: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label className={labelClass}>HOW WE MET</Label>
                  <Input
                    className={fieldClass}
                    value={profileDraft.howWeMet}
                    onChange={(e) => setProfileDraft((d) => ({ ...d, howWeMet: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className={labelClass}>TAGS (COMMA SEPARATED)</Label>
                  <Input
                    className={fieldClass}
                    value={profileDraft.tags}
                    onChange={(e) => setProfileDraft((d) => ({ ...d, tags: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className={labelClass}>
                    HOW YOU SEE THE RELATIONSHIP <span className="text-stone/60">— your words</span>
                  </Label>
                  <div className="rounded-[10px] border border-border bg-background/60 px-3 py-2 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
                    <Textarea
                      value={profileDraft.summary}
                      onChange={(e) => setProfileDraft((d) => ({ ...d, summary: e.target.value }))}
                      placeholder="your own summary — never written for you"
                      className="min-h-16 text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button type="button" onClick={() => void saveProfile()} disabled={!profileDraft.name.trim()}>
                    save profile
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setEditingProfile(false)}>
                    cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Avatar className="size-14 border border-border">
                    <AvatarFallback className="bg-secondary/60 text-lg text-olive">
                      {person.name
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((p) => p.slice(0, 1).toUpperCase())
                        .join("") || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-[clamp(1.6rem,3vw,2.4rem)] font-normal tracking-[-0.04em]">
                      {person.name}
                    </h1>
                    {person.relationship ? (
                      <p className="mt-1 text-sm text-stone">{person.relationship}</p>
                    ) : null}
                    {person.howWeMet ? (
                      <p className="mt-1 font-hand text-base text-olive">met — {person.howWeMet}</p>
                    ) : null}
                    {person.tags.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {person.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="rounded-full px-2.5 py-0.5 text-[11px] font-normal"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileDraft({
                      name: person.name,
                      relationship: person.relationship ?? "",
                      howWeMet: person.howWeMet ?? "",
                      tags: csv(person.tags),
                      summary: person.summary ?? "",
                    });
                    setEditingProfile(true);
                  }}
                  className="rounded-md p-2 text-stone transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label="Edit profile"
                >
                  <Pencil className="size-4" strokeWidth={1.5} />
                </button>
              </div>
            )}

            {!editingProfile && person.summary ? (
              <div className="mt-5 border-t border-border pt-4">
                <p className="text-[11px] tracking-[0.08em] text-stone/80">HOW YOU SEE IT — YOUR WORDS</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{person.summary}</p>
              </div>
            ) : null}
          </Card>
        </motion.div>

        <div className="mt-5 grid items-start gap-5 xl:grid-cols-[1.4fr_0.9fr]">
          {/* Left: timeline */}
          <div className="grid gap-5">
            <Card className="border-[#e2dfd4] bg-[#faf9f5]/92 p-6 shadow-[0_14px_40px_rgba(20,20,19,0.05)]">
              <CardHeader>
                <div>
                  <CardTitle className="font-hand text-base font-normal text-olive">timeline</CardTitle>
                  <p className="mt-1 text-[12px] text-stone/70">entries in the order you lived them</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => (adding ? setAdding(false) : openAddForm())}>
                    <Plus className="size-4" strokeWidth={1.5} />
                    {adding ? "close" : "add entry"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="border border-border bg-background/50"
                    onClick={() => openAddForm("observation")}
                  >
                    <Pencil className="size-4" strokeWidth={1.5} />
                    observation
                  </Button>
                </div>
              </CardHeader>

              <AnimatePresence initial={false}>
                {adding ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5">
                      <InteractionForm
                        draft={addDraft}
                        setDraft={(updater) => setAddDraft(updater)}
                        onSubmit={handleAdd}
                        onCancel={() => setAdding(false)}
                        submitting={addSaving}
                        submitLabel={addDraft.source === "observation" ? "save observation" : "save entry"}
                      />
                      {addError ? <p className="mt-2 text-xs text-error">{addError}</p> : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* Search + filters */}
              <div className="mt-6 space-y-3">
                <Input
                  className={fieldClass}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="find a word in these notes…"
                  aria-label="Search notes"
                />
                {(allSources.length > 1 || sharedTopics.length > 0) ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {tagFilter || sourceFilter ? (
                      <button
                        type="button"
                        onClick={() => {
                          setTagFilter(null);
                          setSourceFilter(null);
                        }}
                        className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-stone hover:text-foreground"
                      >
                        clear filters
                      </button>
                    ) : null}
                    {allSources.map((source) => (
                      <button
                        key={source}
                        type="button"
                        onClick={() => setSourceFilter((current) => (current === source ? null : source))}
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
                          sourceFilter === source
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-stone hover:text-foreground",
                        )}
                      >
                        {source}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Entries */}
              {filtered.length > 0 ? (
                <ul className="mt-2 divide-y divide-[#e4e1d7]">
                  {filtered.map((interaction) => (
                    <li
                      key={interaction.id}
                      ref={(node) => {
                        if (node) timelineRefs.current.set(interaction.id, node);
                        else timelineRefs.current.delete(interaction.id);
                      }}
                      className={cn(
                        "relative py-5 pl-4 transition-colors before:absolute before:inset-y-5 before:left-0 before:w-[2px] before:rounded-full before:bg-[#d9c7b6]",
                        highlightId === interaction.id && "bg-primary/[0.04]",
                      )}
                    >
                      {editingId === interaction.id ? (
                        <InteractionForm
                          draft={editDraft}
                          setDraft={(updater) => setEditDraft(updater)}
                          onSubmit={handleEditSave}
                          onCancel={() => setEditingId(null)}
                          submitting={editSaving}
                          submitLabel="save changes"
                        />
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs text-stone">{formatDay(interaction.occurredAt)}</p>
                              <p className="mt-0.5 font-hand text-[13px] text-olive">{interaction.source}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(interaction.id);
                                  setEditDraft(draftFrom(interaction));
                                }}
                                className="rounded-md p-1.5 text-stone transition-colors hover:bg-secondary hover:text-foreground"
                                aria-label="Edit entry"
                              >
                                <Pencil className="size-3.5" strokeWidth={1.5} />
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteInteraction(interaction.id)}
                                className="rounded-md p-1.5 text-stone transition-colors hover:bg-secondary hover:text-error"
                                aria-label="Delete entry"
                              >
                                <Trash2 className="size-3.5" strokeWidth={1.5} />
                              </button>
                            </div>
                          </div>

                          {interaction.context ? (
                            <p className="mt-3 text-[13px] italic text-stone">{interaction.context}</p>
                          ) : null}

                          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-foreground">
                            {interaction.facts}
                          </p>

                          {interaction.interpretation ? (
                            <div className="mt-3 border-l-2 border-[#d8d5cb] pl-3">
                              <p className="font-hand text-[13px] text-olive">your read</p>
                              <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-6 text-stone">
                                {interaction.interpretation}
                              </p>
                            </div>
                          ) : null}

                          {interaction.topics.length > 0 || interaction.tags.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {interaction.topics.map((topic) => (
                                <button
                                  key={`t-${topic}`}
                                  type="button"
                                  onClick={() => setTagFilter((c) => (c === topic ? null : topic))}
                                  className="rounded-full bg-[#efece3] px-2 py-0.5 text-[11px] text-olive hover:bg-secondary"
                                >
                                  {topic}
                                </button>
                              ))}
                              {interaction.tags.map((tag) => (
                                <button
                                  key={`g-${tag}`}
                                  type="button"
                                  onClick={() => setTagFilter((c) => (c === tag ? null : tag))}
                                  className="rounded-full border border-border px-2 py-0.5 text-[11px] text-stone hover:text-foreground"
                                >
                                  #{tag}
                                </button>
                              ))}
                            </div>
                          ) : null}

                          {interaction.followUp ? (
                            <button
                              type="button"
                              onClick={() => void toggleFollowUp(interaction)}
                              className="mt-3 flex w-full items-center gap-2 border-b border-[#e4e1d7] px-0 py-2 text-left text-[13px] transition-colors hover:border-primary/40"
                            >
                              <span
                                className={cn(
                                  "flex size-4 shrink-0 items-center justify-center rounded-full border",
                                  interaction.followUpDone
                                    ? "border-olive bg-olive text-background"
                                    : "border-stone",
                                )}
                              >
                                {interaction.followUpDone ? <Check className="size-3" /> : null}
                              </span>
                              <span className={cn(interaction.followUpDone && "text-stone line-through")}>
                                {interaction.followUp}
                              </span>
                            </button>
                          ) : null}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-6 font-hand text-[16px] leading-7 text-olive">
                  {person.interactions.length === 0
                    ? "this page is still blank — write the first thing you learned."
                    : "nothing matches your search or filters."}
                </p>
              )}
            </Card>
          </div>

          {/* Right rail */}
          <div className="grid gap-5">
            {/* Assistant */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle>ask your notes</CardTitle>
                <Sparkles className="size-4 text-primary" strokeWidth={1.5} />
              </CardHeader>
              <div className="mt-2 flex items-start gap-2 text-[12px] leading-5 text-stone">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-olive" strokeWidth={1.5} />
                <p>answers come only from these notes, with citations. it won&apos;t guess at feelings, motives, or diagnoses.</p>
              </div>

              <div className="mt-4 space-y-4">
                {chat.length === 0 ? (
                  <div className="space-y-2">
                    {suggestedQuestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setQuestion(suggestion)}
                        className="block w-full rounded-[10px] border border-border bg-background/50 px-3 py-2 text-left text-[13px] text-stone transition-colors hover:border-ring/50 hover:text-foreground"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : (
                  chat.map((turn) => (
                    <div key={turn.id} className="space-y-2">
                      <p className="text-right text-sm text-foreground">
                        <span className="inline-block rounded-[10px] bg-secondary px-3 py-1.5">
                          {turn.question}
                        </span>
                      </p>
                      {turn.answer ? (
                        <AssistantAnswerView answer={turn.answer} onCite={scrollToInteraction} />
                      ) : (
                        <p className="text-sm text-stone">reading your notes…</p>
                      )}
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={ask} className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                <Input
                  className={cn(fieldClass, "flex-1")}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="ask about these notes…"
                  aria-label="Ask a question"
                />
                <Button type="submit" size="icon" disabled={!question.trim() || asking} aria-label="Send">
                  <Send className="size-4" strokeWidth={1.5} />
                </Button>
              </form>
            </Card>

            {/* Shared topics */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle>shared topics</CardTitle>
                <Tags className="size-4 text-stone" strokeWidth={1.5} />
              </CardHeader>
              {sharedTopics.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {sharedTopics.map(([topic, count]) => (
                    <li key={topic}>
                      <button
                        type="button"
                        onClick={() => setTagFilter((c) => (c === topic ? null : topic))}
                        className="flex w-full items-center justify-between rounded-[8px] px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-secondary/60"
                      >
                        <span>{topic}</span>
                        <span className="text-xs text-stone">
                          {count}×
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm leading-6 text-stone">
                  tag your entries with topics and they&apos;ll gather here.
                </p>
              )}
            </Card>

            {/* Open follow-ups */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle>open follow-ups</CardTitle>
                <ListChecks className="size-4 text-stone" strokeWidth={1.5} />
              </CardHeader>
              {openFollowUps.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {openFollowUps.map((interaction) => (
                    <li key={interaction.id}>
                      <button
                        type="button"
                        onClick={() => void toggleFollowUp(interaction)}
                        className="flex w-full items-start gap-2 rounded-[8px] px-2 py-1.5 text-left text-sm transition-colors hover:bg-secondary/60"
                      >
                        <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-stone" />
                        <span className="text-foreground">{interaction.followUp}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm leading-6 text-stone">
                  nothing outstanding. anything you owe will show up here.
                </p>
              )}
            </Card>

            {/* Important dates */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle>important dates</CardTitle>
                <button
                  type="button"
                  onClick={() => setAddingDate((v) => !v)}
                  className="rounded-md p-1.5 text-stone transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label="Add date"
                >
                  {addingDate ? <X className="size-4" /> : <Plus className="size-4" />}
                </button>
              </CardHeader>

              {addingDate ? (
                <form onSubmit={addDate} className="mt-4 grid gap-3">
                  <Input
                    className={fieldClass}
                    value={dateForm.label}
                    onChange={(e) => setDateForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="label — e.g. birthday"
                  />
                  <Input
                    type="date"
                    className={fieldClass}
                    value={dateForm.dateText}
                    onChange={(e) => setDateForm((f) => ({ ...f, dateText: e.target.value }))}
                  />
                  <Input
                    className={fieldClass}
                    value={dateForm.note}
                    onChange={(e) => setDateForm((f) => ({ ...f, note: e.target.value }))}
                    placeholder="note (optional)"
                  />
                  <Button type="submit" disabled={!dateForm.label.trim() || !dateForm.dateText.trim()}>
                    save date
                  </Button>
                </form>
              ) : null}

              {person.importantDates.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {person.importantDates.map((date: ImportantDateDTO) => (
                    <li
                      key={date.id}
                      className="group flex items-center justify-between gap-2 rounded-[8px] px-2 py-1.5 hover:bg-secondary/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <CalendarDays className="size-4 text-stone" strokeWidth={1.5} />
                        <div>
                          <p className="text-sm text-foreground">{date.label}</p>
                          <p className="text-[11px] text-stone">
                            {date.dateText}
                            {date.note ? ` · ${date.note}` : ""}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void deleteDate(date.id)}
                        className="rounded-md p-1 text-stone opacity-0 transition hover:text-error group-hover:opacity-100"
                        aria-label="Remove date"
                      >
                        <Trash2 className="size-3.5" strokeWidth={1.5} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : !addingDate ? (
                <p className="mt-4 text-sm leading-6 text-stone">
                  dates they mention — birthdays, moves, milestones — can live here.
                </p>
              ) : null}
            </Card>
          </div>
        </div>

        <p className="mt-10 text-center text-[11px] text-stone/70">
          {person.interactions.length} {person.interactions.length === 1 ? "entry" : "entries"} ·
          your notes stay yours.
        </p>
      </div>
    </main>
  );
}
