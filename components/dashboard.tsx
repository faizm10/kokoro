"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Archive, BookOpen, Check, Feather, LogOut, Network, Settings, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";

import { DashboardCommandPalette, useDashboardCommandPalette } from "@/components/dashboard-command";
import { MindMap, type MindMapData } from "@/components/mind-map";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "today", icon: Feather },
  { label: "journal", icon: BookOpen },
  { label: "threads", icon: Network },
  { label: "archive", icon: Archive },
  { label: "settings", icon: Settings },
];

type RecentNote = {
  id: string;
  body: string;
  kind: "quick" | "reflection";
  createdAt: string;
};

type RecentPerson = {
  id: string;
  name: string;
  relationship: string | null;
  lastInteractionAt: string | null;
  interactionCount: number;
};

type Account = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function formatDashboardDate(date: Date) {
  return {
    weekday: date
      .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
      .toUpperCase(),
    reflection: date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    greeting:
      date.getHours() < 12 ? "good morning." : date.getHours() < 18 ? "good afternoon." : "good evening.",
  };
}

function formatRecentNoteTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function personInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("");
}

function relativePersonTime(iso: string | null) {
  if (!iso) return "no notes yet";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1mo ago" : `${months}mo ago`;
}

function pickLatestPeople(people: RecentPerson[], limit = 3) {
  return [...people]
    .sort((a, b) => {
      const aTime = a.lastInteractionAt ? +new Date(a.lastInteractionAt) : 0;
      const bTime = b.lastInteractionAt ? +new Date(b.lastInteractionAt) : 0;
      return bTime - aTime;
    })
    .slice(0, limit);
}

function AccountAvatar({ account, size = "default" }: { account: Account | null; size?: "default" | "sm" }) {
  const dimensions = size === "sm" ? "size-8" : "size-9";

  if (account?.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={account.image}
        alt={account.name ?? account.email ?? "Signed in account"}
        className={cn(dimensions, "rounded-full border border-border object-cover")}
      />
    );
  }

  return (
    <div
      aria-label={account ? `Signed in as ${account.name ?? account.email}` : "Account"}
      className={cn(
        dimensions,
        "flex items-center justify-center rounded-full border border-border bg-background text-xs text-stone",
      )}
    >
      {(account?.name ?? account?.email ?? "?").slice(0, 1).toUpperCase()}
    </div>
  );
}

function SidebarAccountBar({ account }: { account: Account | null }) {
  return (
    <div className="rounded-[8px] border border-border bg-background/45 p-3">
      <p className="mb-3 text-[11px] tracking-[0.08em] text-stone/70">ACCOUNT</p>
      {account ? (
        <div className="flex items-center gap-3">
          <AccountAvatar account={account} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">{account.name ?? account.email}</p>
            {account.email ? <p className="truncate text-[11px] text-stone">{account.email}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/" })}
            aria-label="Sign out"
            className="rounded-md p-2 text-stone transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <AccountAvatar account={null} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">not signed in</p>
            <p className="truncate text-[11px] text-stone">your words stay yours.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function Dashboard() {
  const [quickNote, setQuickNote] = useState("");
  const [recentNotes, setRecentNotes] = useState<RecentNote[]>([]);
  const [latestPeople, setLatestPeople] = useState<RecentPerson[]>([]);
  const [mindMap, setMindMap] = useState<MindMapData | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noteError, setNoteError] = useState("");
  const quickNoteRef = useRef<HTMLTextAreaElement | null>(null);
  const { open: commandOpen, setOpen: setCommandOpen } = useDashboardCommandPalette();
  const today = formatDashboardDate(new Date());

  function focusQuickNote() {
    quickNoteRef.current?.focus();
    goToSection("#today");
  }

  function goToSection(hash: string) {
    const target = document.querySelector(hash);
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  useEffect(() => {
    let ignore = false;

    async function loadDashboardState() {
      const [notesResponse, mindMapResponse, sessionResponse, peopleResponse] = await Promise.all([
        fetch("/api/notes"),
        fetch("/api/mind-map"),
        fetch("/api/auth/session"),
        fetch("/api/people"),
      ]);

      if (notesResponse.ok) {
        const data = (await notesResponse.json()) as { notes?: RecentNote[] };
        if (!ignore) setRecentNotes(data.notes ?? []);
      }

      if (mindMapResponse.ok) {
        const data = (await mindMapResponse.json()) as MindMapData;
        if (!ignore) setMindMap(data);
      }

      if (sessionResponse.ok) {
        const data = (await sessionResponse.json()) as { user?: Account };
        if (!ignore) setAccount(data.user?.email ? data.user : null);
      }

      if (peopleResponse.ok) {
        const data = (await peopleResponse.json()) as { people?: RecentPerson[] };
        if (!ignore) setLatestPeople(pickLatestPeople(data.people ?? [], 3));
      }
    }

    void loadDashboardState();

    return () => {
      ignore = true;
    };
  }, []);

  async function saveQuickNote() {
    const body = quickNote.trim();

    if (!body || saving) return;

    setSaving(true);
    setNoteError("");

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body }),
      });

      if (!response.ok) {
        throw new Error("Note could not be saved.");
      }

      const data = (await response.json()) as { notes?: RecentNote[] };
      setRecentNotes(data.notes ?? []);
      const mindMapResponse = await fetch("/api/mind-map");
      if (mindMapResponse.ok) {
        setMindMap((await mindMapResponse.json()) as MindMapData);
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
      setQuickNote("");
    } catch {
      setNoteError("note could not be saved. try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleQuickNoteKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void saveQuickNote();
    }
  }

  return (
    <div className="min-h-screen bg-[rgba(245,244,237,0.82)]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[216px] border-r border-border bg-[#f1f0e9] px-6 py-8 lg:flex lg:flex-col">
        <p className="font-hand text-xl text-olive">kokoro</p>
        <div className="mt-8">
          <SidebarAccountBar account={account} />
        </div>
        <nav aria-label="Primary" className="mt-8 space-y-1">
          {navItems.map(({ label, icon: Icon }, index) => (
            <a
              key={label}
              href={label === "today" ? "#today" : `#${label}`}
              className={cn(
                "flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm transition-colors",
                index === 0 ? "bg-secondary text-foreground" : "text-stone hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4" strokeWidth={1.5} />
              {label}
            </a>
          ))}
          <Link
            href="/people"
            className="flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm text-stone transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <Users className="size-4" strokeWidth={1.5} />
            people
          </Link>
        </nav>
        <div className="mt-auto space-y-4 border-t border-border pt-5">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="flex w-full items-center justify-between rounded-[8px] border border-border bg-background/50 px-3 py-2.5 text-left text-sm text-stone transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <span>commands</span>
            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] tracking-[0.08em] text-stone">
              ⌘K
            </kbd>
          </button>
          <p className="text-xs text-stone">your words stay yours.</p>
        </div>
      </aside>

      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/95 px-5 lg:hidden">
        <p className="font-hand text-xl text-olive">kokoro</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            aria-label="Open command menu"
            className="rounded-md border border-border px-2 py-1 text-[10px] tracking-[0.08em] text-stone"
          >
            ⌘K
          </button>
          <nav aria-label="Mobile primary" className="flex items-center gap-1">
            {navItems.slice(0, 4).map(({ label, icon: Icon }, index) => (
              <a
                key={label}
                href={label === "today" ? "#today" : `#${label}`}
                aria-label={label}
                className={cn("rounded-md p-2 text-stone", index === 0 && "bg-secondary text-foreground")}
              >
                <Icon className="size-4" strokeWidth={1.5} />
              </a>
            ))}
            <Link href="/people" aria-label="people" className="rounded-md p-2 text-stone">
              <Users className="size-4" strokeWidth={1.5} />
            </Link>
          </nav>
          {account ? <AccountAvatar account={account} size="sm" /> : null}
        </div>
      </header>

      <DashboardCommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        recentNotes={recentNotes}
        canSaveNote={Boolean(quickNote.trim()) && !saving}
        onFocusQuickNote={focusQuickNote}
        onSaveNote={() => void saveQuickNote()}
      />

      <main id="today" className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8 sm:py-14 lg:ml-[216px] lg:px-12 xl:px-16">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <p className="text-xs tracking-[0.08em] text-stone">{today.weekday}</p>
            <h1 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-normal tracking-[-0.045em]">{today.greeting}</h1>
            <p className="mt-3 font-hand text-lg text-olive">what is still with you?</p>
          </div>
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="hidden items-center gap-2 rounded-[8px] border border-border bg-card/80 px-3 py-2 text-xs text-stone transition-colors hover:bg-secondary hover:text-foreground lg:inline-flex"
          >
            search commands
            <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] tracking-[0.08em]">⌘K</kbd>
          </button>
        </motion.div>

        <div className="mt-10 grid items-start gap-5 xl:grid-cols-[1.3fr_0.8fr]">
          <div className="grid gap-5">
            <Card className="border-[#e4e1d7] bg-[#faf9f5]/95 p-6 shadow-[0_10px_40px_rgba(20,20,19,0.06)] sm:p-7">
              <CardHeader>
                <CardTitle className="text-[15px]">quick note</CardTitle>
                <span className="font-hand text-sm text-stone">uncategorized is fine</span>
              </CardHeader>
              <Textarea
                ref={quickNoteRef}
                value={quickNote}
                onChange={(event) => setQuickNote(event.target.value)}
                onKeyDown={handleQuickNoteKeyDown}
                placeholder="drop a thought..."
                aria-label="Quick note"
                className="mt-5 min-h-[112px] leading-7"
              />
              <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
                {noteError ? <span className="mr-auto text-xs text-error">{noteError}</span> : null}
                {saved ? (
                  <span className="mr-auto flex items-center gap-1.5 text-xs text-stone">
                    <Check className="size-3.5" /> saved
                  </span>
                ) : null}
                <kbd className="rounded-[6px] border border-border bg-secondary/70 px-2 py-1 text-[10px] tracking-[0.06em] text-stone">
                  ⌘ enter
                </kbd>
                <Button
                  type="button"
                  onClick={() => void saveQuickNote()}
                  disabled={!quickNote.trim() || saving}
                  aria-keyshortcuts="Meta+Enter Control+Enter"
                  className="disabled:bg-primary/35 disabled:text-primary-foreground/90 disabled:opacity-100"
                >
                  {saving ? "saving…" : "save note"}
                </Button>
              </div>
            </Card>

            <Card id="journal" className="p-6 sm:p-7">
              <CardHeader>
                <div>
                  <p className="text-xs tracking-[0.08em] text-stone">TODAY’S REFLECTION</p>
                  <CardTitle className="mt-2 text-base">{today.reflection}</CardTitle>
                </div>
                <span className="font-hand text-sm text-stone">take your time</span>
              </CardHeader>
              <Textarea
                placeholder="Start wherever you are..."
                aria-label="Today's reflection"
                className="mt-8 min-h-[230px] leading-8"
              />
              <div className="border-t border-border pt-4 text-right text-[11px] text-stone/70">saved as you write</div>
            </Card>

            <Card className="p-6 sm:p-7">
              <CardHeader>
                <CardTitle>mind map</CardTitle>
                <a href="#threads" className="text-xs text-primary hover:underline">open map</a>
              </CardHeader>
              <MindMap data={mindMap} />
            </Card>
          </div>

          <div className="grid gap-5">
            <Card className="border-[#e2dfd4] bg-[#faf9f5]/95 p-6">
              <CardHeader>
                <CardTitle>people on your mind</CardTitle>
                <Link href="/people" className="text-xs text-primary hover:underline">
                  all people
                </Link>
              </CardHeader>
              {latestPeople.length > 0 ? (
                <ul className="mt-2 divide-y divide-[#e4e1d7]">
                  {latestPeople.map((person) => (
                    <li key={person.id}>
                      <Link
                        href={`/people/${person.id}`}
                        className="-mx-1 flex items-center gap-3 rounded-[8px] px-1 py-3 transition-colors hover:bg-secondary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Avatar className="size-9 border border-[#e4e1d7]">
                          <AvatarFallback className="bg-[#efece3] text-[11px] text-olive">
                            {personInitials(person.name) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-foreground">{person.name}</p>
                          <p className="truncate text-[11px] text-stone">
                            {person.relationship ? `${person.relationship} · ` : null}
                            {person.interactionCount} {person.interactionCount === 1 ? "note" : "notes"}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] text-stone/70">
                          {relativePersonTime(person.lastInteractionAt)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-6">
                  <p className="font-hand text-[17px] leading-7 text-olive">no one here yet.</p>
                  <Link
                    href="/people"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <Users className="size-3.5" strokeWidth={1.5} />
                    add someone
                  </Link>
                </div>
              )}
            </Card>

            <Card id="threads" className="p-6">
              <CardHeader>
                <CardTitle>thought threads</CardTitle>
                <Network className="size-4 text-stone" strokeWidth={1.5} />
              </CardHeader>
              {mindMap?.threads.length ? (
                <ul className="mt-6 space-y-3">
                  {mindMap.threads.slice(0, 5).map((thread) => (
                    <li key={thread.id} className="flex items-center justify-between gap-4 border-t border-border pt-3 first:border-t-0 first:pt-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-[0.06em] text-stone">
                            {thread.kind}
                          </span>
                          <p className="truncate text-sm text-foreground">{thread.name}</p>
                        </div>
                        <p className="mt-1 text-[11px] text-stone">{thread.noteCount} connected notes</p>
                      </div>
                      <span className="size-2 rounded-full bg-primary" />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-8 text-sm leading-6 text-stone">
                  threads will gather here as your notes start to connect.
                </p>
              )}
            </Card>

            <Card className="p-6">
              <CardHeader>
                <CardTitle>quiet insight</CardTitle>
                <Sparkles className="size-4 text-primary" strokeWidth={1.5} />
              </CardHeader>
              <p className="mt-8 font-hand text-[22px] leading-8 text-olive">
                write a little first. patterns arrive later.
              </p>
              <p className="mt-5 text-xs leading-5 text-stone">nothing to notice yet</p>
            </Card>

            <Card id="archive" className="p-6">
              <CardHeader>
                <CardTitle>recent notes</CardTitle>
                <a href="#archive" className="text-xs text-primary hover:underline">all notes</a>
              </CardHeader>
              {recentNotes.length > 0 ? (
                <ul className="mt-6 space-y-4">
                  {recentNotes.map((note) => (
                    <li key={note.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                      <Link
                        href={`/notes/${note.id}`}
                        className="-mx-2 block rounded-[8px] px-2 py-1.5 transition-colors hover:bg-secondary/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <p className="line-clamp-3 text-sm leading-6 text-foreground">{note.body}</p>
                        <p className="mt-2 text-[11px] text-stone/70">{formatRecentNoteTime(note.createdAt)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-8 text-sm leading-6 text-stone">
                  your recent notes will appear here.
                </p>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
