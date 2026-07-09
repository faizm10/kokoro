"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Archive, BookOpen, Check, Feather, Network, Settings, Sparkles } from "lucide-react";

import { MindMap } from "@/components/mind-map";
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

const notes = [
  { time: "11:42 pm", text: "there is a different kind of focus after everyone goes quiet." },
  { time: "4:18 pm", text: "make the first version smaller than the fear around it." },
  { time: "9:07 am", text: "I want to leave more room between deciding and reacting." },
];

export function Dashboard() {
  const [quickNote, setQuickNote] = useState("");
  const [saved, setSaved] = useState(false);

  function saveQuickNote() {
    if (!quickNote.trim()) return;
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
    setQuickNote("");
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[216px] border-r border-border bg-[#f1f0e9] px-6 py-8 lg:flex lg:flex-col">
        <p className="font-hand text-xl text-olive">kokoro</p>
        <nav aria-label="Primary" className="mt-16 space-y-1">
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
        </nav>
        <div className="mt-auto border-t border-border pt-5">
          <p className="text-xs text-stone">your words stay yours.</p>
        </div>
      </aside>

      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/95 px-5 lg:hidden">
        <p className="font-hand text-xl text-olive">kokoro</p>
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
        </nav>
      </header>

      <main id="today" className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8 sm:py-14 lg:ml-[216px] lg:px-12 xl:px-16">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs tracking-[0.08em] text-stone">WEDNESDAY, JULY 8</p>
          <h1 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-normal tracking-[-0.045em]">good evening.</h1>
          <p className="mt-3 font-hand text-lg text-olive">what is still with you?</p>
        </motion.div>

        <div className="mt-10 grid items-start gap-5 xl:grid-cols-[1.3fr_0.8fr]">
          <div className="grid gap-5">
            <Card className="p-6 sm:p-7">
              <CardHeader>
                <CardTitle>quick note</CardTitle>
                <span className="font-hand text-sm text-stone">uncategorized is fine</span>
              </CardHeader>
              <Textarea
                value={quickNote}
                onChange={(event) => setQuickNote(event.target.value)}
                placeholder="drop a thought..."
                aria-label="Quick note"
                className="mt-6 min-h-24"
              />
              <div className="mt-4 flex items-center justify-end gap-3 border-t border-border pt-4">
                {saved ? <span className="flex items-center gap-1.5 text-xs text-stone"><Check className="size-3.5" /> saved</span> : null}
                <Button type="button" onClick={saveQuickNote} disabled={!quickNote.trim()}>
                  save note
                </Button>
              </div>
            </Card>

            <Card id="journal" className="p-6 sm:p-7">
              <CardHeader>
                <div>
                  <p className="text-xs tracking-[0.08em] text-stone">TODAY’S REFLECTION</p>
                  <CardTitle className="mt-2 text-base">July 8, 2026</CardTitle>
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
              <MindMap />
            </Card>
          </div>

          <div className="grid gap-5">
            <Card id="threads" className="p-6">
              <CardHeader>
                <CardTitle>thought threads</CardTitle>
                <Network className="size-4 text-stone" strokeWidth={1.5} />
              </CardHeader>
              <div className="mt-6 flex flex-wrap gap-2">
                {["career", "school", "ideas", "stress", "people"].map((tag, index) => (
                  <button
                    key={tag}
                    type="button"
                    className={cn(
                      "rounded-full border border-border px-3 py-1.5 text-xs text-olive transition-colors hover:bg-secondary",
                      index === 2 && "border-[#c7ccd2] text-primary",
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <CardHeader>
                <CardTitle>quiet insight</CardTitle>
                <Sparkles className="size-4 text-primary" strokeWidth={1.5} />
              </CardHeader>
              <p className="mt-8 font-hand text-[22px] leading-8 text-olive">
                you often write about momentum after late nights.
              </p>
              <p className="mt-5 text-xs leading-5 text-stone">noticed across 7 notes this month</p>
            </Card>

            <Card id="archive" className="p-6">
              <CardHeader>
                <CardTitle>recent notes</CardTitle>
                <a href="#archive" className="text-xs text-primary hover:underline">all notes</a>
              </CardHeader>
              <div className="mt-4 divide-y divide-border">
                {notes.map((note) => (
                  <article key={note.time} className="py-5 first:pt-3 last:pb-1">
                    <time className="text-[10px] tracking-[0.06em] text-stone">{note.time}</time>
                    <p className="mt-2 text-sm leading-6 text-olive">{note.text}</p>
                  </article>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
