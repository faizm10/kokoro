"use client";

import { type FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PersonSummaryDTO } from "@/lib/serialize";
import { cn } from "@/lib/utils";

type Account = { name?: string | null; email?: string | null; image?: string | null };

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

const lineInput =
  "w-full border-0 border-b border-[#d8d5cb] bg-transparent px-0 py-2 text-[15px] text-foreground outline-none placeholder:text-stone/45 focus:border-primary focus:ring-0";

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
    <main className="min-h-screen bg-[rgba(245,244,237,0.72)] px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-[720px]">
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
          className="mt-8"
        >
          <p className="font-hand text-[17px] text-olive">people</p>
          <h1 className="mt-2 text-[clamp(1.9rem,4vw,2.75rem)] font-normal tracking-[-0.045em]">
            who are you keeping notes on?
          </h1>
          <p className="mt-3 max-w-[48ch] text-[15px] leading-7 text-stone">
            think of this as a quiet address book. open a name, write what they told you.
          </p>
        </motion.div>

        <p className="mt-6 flex items-start gap-2 text-[13px] leading-6 text-stone/80">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-olive" strokeWidth={1.5} />
          <span>only what you write from your own conversations lives here — nothing is guessed for you.</span>
        </p>

        <div className="mt-10 flex items-end justify-between gap-4 border-b border-[#d8d5cb] pb-3">
          <p className="text-sm text-stone">
            {people.length === 0
              ? "the page is blank"
              : `${people.length} ${people.length === 1 ? "person" : "people"}`}
          </p>
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm text-primary transition-colors hover:text-[#152d50]"
          >
            <Plus className="size-4" strokeWidth={1.5} />
            {adding ? "close" : "add someone"}
          </button>
        </div>

        {adding ? (
          <motion.form
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleCreate}
            className={cn(
              "relative mt-6 overflow-hidden rounded-[4px] border border-[#e2dfd4] bg-[#faf9f5] px-6 py-7 shadow-[0_18px_50px_rgba(20,20,19,0.06)] sm:px-8",
              "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-[#d9c7b6]",
            )}
          >
            <p className="font-hand text-[15px] text-olive">new page</p>
            <p className="mt-1 text-[12px] text-stone/70">start with a name. the rest can wait.</p>

            <div className="mt-7 space-y-6">
              <label className="block">
                <span className="mb-1 block font-hand text-[14px] text-stone">their name</span>
                <input
                  className={cn(lineInput, "text-[1.35rem] tracking-[-0.02em]")}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Priya Sharma"
                  autoFocus
                />
              </label>

              <label className="block">
                <span className="mb-1 block font-hand text-[14px] text-stone">how you know them</span>
                <input
                  className={lineInput}
                  value={form.relationship}
                  onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
                  placeholder="friend, classmate, coworker…"
                />
              </label>

              <label className="block">
                <span className="mb-1 block font-hand text-[14px] text-stone">loose tags, if you want</span>
                <input
                  className={lineInput}
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="book club, work — comma-separated"
                />
              </label>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={!form.name.trim() || saving}>
                {saving ? "opening page…" : "start their page"}
              </Button>
              {people.length > 0 ? (
                <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
                  not now
                </Button>
              ) : null}
              {error ? <span className="text-xs text-error">{error}</span> : null}
            </div>
          </motion.form>
        ) : null}

        {people.length > 0 ? (
          <ul className="mt-2 divide-y divide-[#e4e1d7]">
            {people.map((person, index) => (
              <motion.li
                key={person.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.35 }}
              >
                <Link
                  href={`/people/${person.id}`}
                  className="group flex items-start gap-4 py-5 transition-colors hover:bg-[#faf9f5]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Avatar className="mt-0.5 size-10 border border-[#e4e1d7]">
                    <AvatarFallback className="bg-[#f1efe6] text-sm text-olive">
                      {initials(person.name) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="truncate text-[16px] tracking-[-0.01em] text-foreground group-hover:text-primary">
                        {person.name}
                      </p>
                      <p className="shrink-0 text-[11px] text-stone/70">
                        {relativeTime(person.lastInteractionAt)}
                      </p>
                    </div>
                    <p className="mt-1 text-[13px] text-stone">
                      {person.relationship ? `${person.relationship} · ` : null}
                      {person.interactionCount} {person.interactionCount === 1 ? "note" : "notes"}
                      {person.openFollowUps > 0 ? ` · ${person.openFollowUps} open` : null}
                    </p>
                    {person.tags.length > 0 ? (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {person.tags.slice(0, 4).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="rounded-full border-0 bg-[#efece3] px-2 py-0 text-[11px] font-normal text-olive"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Link>
              </motion.li>
            ))}
          </ul>
        ) : !adding ? (
          <div className="mt-10 border border-dashed border-[#d8d5cb] px-6 py-14 text-center">
            <Users className="mx-auto size-5 text-stone" strokeWidth={1.5} />
            <p className="mt-4 font-hand text-lg text-olive">the notebook is empty.</p>
            <p className="mx-auto mt-2 max-w-[36ch] text-sm leading-6 text-stone">
              add someone you know, then jot what you learn as you talk.
            </p>
          </div>
        ) : null}

        <p className="mt-12 text-center font-hand text-[13px] text-stone/65">
          signed in as {account.name ?? account.email}
        </p>
      </div>
    </main>
  );
}
