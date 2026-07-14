"use client";

import { type FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { PersonSummaryDTO } from "@/lib/serialize";

type Account = { name?: string | null; email?: string | null; image?: string | null };

const fieldClass =
  "w-full rounded-[10px] border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-stone/60 focus:border-ring focus:ring-2 focus:ring-ring/30";
const labelClass = "mb-1.5 block text-[11px] tracking-[0.08em] text-stone/80";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("");
}

function relativeTime(iso: string | null) {
  if (!iso) return "no notes yet";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "seen today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export function PeopleHub({
  initialPeople,
  account,
}: {
  initialPeople: PersonSummaryDTO[];
  account: Account;
}) {
  const router = useRouter();
  const people = initialPeople;
  const [adding, setAdding] = useState(initialPeople.length === 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", relationship: "", tags: "" });

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || saving) return;

    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          relationship: form.relationship || null,
          tags: form.tags ? form.tags.split(",") : [],
        }),
      });
      if (!response.ok) throw new Error("Could not add this person.");
      const data = (await response.json()) as { id: string };
      router.push(`/people/${data.id}`);
    } catch {
      setError("could not add this person. try again.");
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-[960px]">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-[8px] px-2 py-2 text-sm text-stone transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={1.5} />
          back to journal
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6"
        >
          <p className="text-xs tracking-[0.08em] text-stone">INTERACTION NOTES</p>
          <h1 className="mt-3 text-[clamp(1.9rem,4vw,3rem)] font-normal tracking-[-0.045em]">
            people you keep in mind
          </h1>
          <p className="mt-3 max-w-[54ch] font-hand text-lg text-olive">
            a quiet place to remember what people actually told you.
          </p>
        </motion.div>

        <div className="mt-6 flex items-start gap-2.5 rounded-[10px] border border-border bg-secondary/40 px-4 py-3 text-[13px] leading-6 text-stone">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-olive" strokeWidth={1.5} />
          <p>
            only what you record from your own direct interactions lives here. nothing is inferred,
            tracked, or gathered on its own — and the assistant only ever reads these notes.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-stone">
            {people.length} {people.length === 1 ? "person" : "people"}
          </p>
          <Button type="button" variant="secondary" onClick={() => setAdding((v) => !v)}>
            <Plus className="size-4" strokeWidth={1.5} />
            add person
          </Button>
        </div>

        {adding ? (
          <Card className="mt-4 p-6">
            <CardHeader>
              <CardTitle>add a person</CardTitle>
              <span className="font-hand text-sm text-stone">just a name is enough</span>
            </CardHeader>
            <form onSubmit={handleCreate} className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className={labelClass} htmlFor="person-name">
                  NAME
                </label>
                <input
                  id="person-name"
                  className={fieldClass}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Priya Sharma"
                  autoFocus
                />
              </div>
              <div className="sm:col-span-1">
                <label className={labelClass} htmlFor="person-rel">
                  RELATIONSHIP
                </label>
                <input
                  id="person-rel"
                  className={fieldClass}
                  value={form.relationship}
                  onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
                  placeholder="e.g. colleague, friend"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="person-tags">
                  TAGS (COMMA SEPARATED)
                </label>
                <input
                  id="person-tags"
                  className={fieldClass}
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="e.g. work, book club"
                />
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <Button type="submit" disabled={!form.name.trim() || saving}>
                  {saving ? "adding" : "add person"}
                </Button>
                {error ? <span className="text-xs text-error">{error}</span> : null}
              </div>
            </form>
          </Card>
        ) : null}

        {people.length > 0 ? (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {people.map((person) => (
              <li key={person.id}>
                <Link
                  href={`/people/${person.id}`}
                  className="block h-full rounded-[14px] border border-border bg-card p-5 transition-colors hover:border-ring/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-full border border-border bg-secondary/60 text-sm text-olive">
                      {initials(person.name) || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] text-foreground">{person.name}</p>
                      {person.relationship ? (
                        <p className="truncate text-xs text-stone">{person.relationship}</p>
                      ) : null}
                    </div>
                  </div>
                  {person.tags.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {person.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-secondary-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px] text-stone/80">
                    <span>
                      {person.interactionCount}{" "}
                      {person.interactionCount === 1 ? "note" : "notes"} · {relativeTime(person.lastInteractionAt)}
                    </span>
                    {person.openFollowUps > 0 ? (
                      <span className="text-primary">{person.openFollowUps} open</span>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : !adding ? (
          <Card className="mt-6 flex flex-col items-center gap-3 p-12 text-center">
            <Users className="size-6 text-stone" strokeWidth={1.5} />
            <p className="font-hand text-lg text-olive">no one here yet.</p>
            <p className="max-w-[40ch] text-sm text-stone">
              add someone you know, then jot down what you learn as you talk.
            </p>
          </Card>
        ) : null}

        <p className="mt-10 text-center text-[11px] text-stone/70">
          signed in as {account.name ?? account.email} · your notes stay yours.
        </p>
      </div>
    </main>
  );
}
