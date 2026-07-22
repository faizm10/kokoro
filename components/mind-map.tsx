"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";

type MindMapNote = {
  id: string;
  body: string;
  confidence: number;
  createdAt: string;
};

type MindMapThread = {
  id: string;
  name: string;
  kind: "theme" | "who" | "event" | "place" | "emotion";
  description: string | null;
  noteCount: number;
  notes: MindMapNote[];
};

export type MindMapData = {
  center: {
    id: string;
    label: string;
  };
  threads: MindMapThread[];
};

type PositionedThread = MindMapThread & {
  x: number;
  y: number;
  radius: number;
};

type SelectedNode =
  | { type: "center" }
  | { type: "thread"; threadId: string }
  | { type: "note"; threadId: string; noteId: string };

const kindFilters = [
  { label: "all", value: "all" },
  { label: "themes", value: "theme" },
  { label: "people", value: "who" },
  { label: "places", value: "place" },
  { label: "events", value: "event" },
  { label: "moods", value: "emotion" },
] as const;

const overviewKinds = [
  { label: "themes", value: "theme" },
  { label: "people", value: "who" },
  { label: "places", value: "place" },
  { label: "events", value: "event" },
  { label: "moods", value: "emotion" },
] as const;

function truncateLabel(value: string, length = 18) {
  return value.length > length ? `${value.slice(0, length - 1)}...` : value;
}

function getThreadStyle(kind: MindMapThread["kind"]) {
  if (kind === "who") {
    return {
      fill: "#504e49",
      stroke: "#faf9f5",
      label: "who",
    };
  }

  if (kind === "event") {
    return {
      fill: "#7a6a48",
      stroke: "#faf9f5",
      label: "event",
    };
  }

  if (kind === "place") {
    return {
      fill: "#2f6551",
      stroke: "#faf9f5",
      label: "place",
    };
  }

  if (kind === "emotion") {
    return {
      fill: "#8f4f5f",
      stroke: "#faf9f5",
      label: "mood",
    };
  }

  return {
    fill: "#1b365d",
    stroke: "#faf9f5",
    label: "theme",
  };
}

function formatNoteTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getThreadPositions(threads: MindMapThread[]) {
  const centerX = 360;
  const centerY = 170;
  const spreadX = 230;
  const spreadY = 106;
  const start = threads.length === 1 ? -90 : -155;
  const step = threads.length <= 1 ? 0 : 310 / (threads.length - 1);

  return threads.map((thread, index) => {
    const angle = ((start + step * index) * Math.PI) / 180;

    return {
      ...thread,
      x: centerX + Math.cos(angle) * spreadX,
      y: centerY + Math.sin(angle) * spreadY,
      radius: Math.min(50, 30 + thread.noteCount * 5),
    };
  });
}

function getNotePosition(thread: PositionedThread, index: number, total: number) {
  const angle = ((index / Math.max(total, 1)) * 360 - 90) * (Math.PI / 180);
  const distance = thread.radius + 22;

  return {
    x: thread.x + Math.cos(angle) * distance,
    y: thread.y + Math.sin(angle) * distance,
  };
}

export function MindMap({ data }: { data?: MindMapData | null }) {
  const threads = useMemo(() => data?.threads ?? [], [data?.threads]);
  const [selected, setSelected] = useState<SelectedNode>({ type: "center" });
  const [activeKind, setActiveKind] = useState<(typeof kindFilters)[number]["value"]>("all");
  const visibleThreads = useMemo(
    () => threads.filter((thread) => activeKind === "all" || thread.kind === activeKind),
    [activeKind, threads],
  );
  const positionedThreads = getThreadPositions(visibleThreads);
  const selectedThread =
    selected.type === "thread" || selected.type === "note"
      ? visibleThreads.find((thread) => thread.id === selected.threadId)
      : null;
  const selectedNote =
    selected.type === "note" ? selectedThread?.notes.find((note) => note.id === selected.noteId) : null;

  if (threads.length === 0) {
    return (
      <div className="relative mt-5 flex h-[270px] items-center justify-center overflow-hidden rounded-[10px] border border-[#e4e1d7] bg-[#f2f0e7]">
        <p className="max-w-[220px] text-center font-hand text-lg leading-7 text-stone">
          connections will grow as you write.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 overflow-hidden rounded-[10px] border border-[#e4e1d7] bg-[#f2f0e7]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e1d7] px-4 py-3">
        <div className="flex flex-wrap gap-1.5" aria-label="Filter mind map threads">
          {kindFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => {
                setActiveKind(filter.value);
                setSelected({ type: "center" });
              }}
              className={cn(
                "h-8 rounded-[8px] px-3 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeKind === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "text-stone hover:bg-secondary hover:text-foreground",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSelected({ type: "center" })}
          className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-xs text-stone transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCcw className="size-3.5" strokeWidth={1.5} />
          reset
        </button>
      </div>

      <div className="grid min-h-[430px] lg:grid-cols-[1fr_280px]">
        <div className="relative min-h-[330px]">
          <svg
            viewBox="0 0 720 380"
            role="img"
            aria-label="Interactive mind map of connected note threads"
            className="h-[330px] w-full sm:h-[400px] lg:h-full"
          >
            <defs>
              <filter id="mind-map-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#141413" floodOpacity="0.08" />
              </filter>
            </defs>

            {positionedThreads.map((thread) => (
              <g key={`center-link-${thread.id}`}>
                <path
                  d={`M 360 170 C ${(360 + thread.x) / 2} 170, ${(360 + thread.x) / 2} ${thread.y}, ${thread.x} ${thread.y}`}
                  fill="none"
                  stroke={selectedThread?.id === thread.id ? "#1b365d" : "#d5d2c7"}
                  strokeLinecap="round"
                  strokeWidth={selectedThread?.id === thread.id ? "3" : "2"}
                />
              </g>
            ))}

            {positionedThreads.map((thread) =>
              thread.notes.map((note, noteIndex) => {
                const notePosition = getNotePosition(thread, noteIndex, thread.notes.length);
                const isSelected = selected.type === "note" && selected.noteId === note.id;

                return (
                  <line
                    key={`note-link-${thread.id}-${note.id}`}
                    x1={thread.x}
                    y1={thread.y}
                    x2={notePosition.x}
                    y2={notePosition.y}
                    stroke={isSelected ? "#1b365d" : "#ddd9cd"}
                    strokeLinecap="round"
                    strokeWidth={isSelected ? "2.5" : "1.5"}
                  />
                );
              }),
            )}

            <g
              filter="url(#mind-map-shadow)"
              className="cursor-pointer"
              onClick={() => setSelected({ type: "center" })}
            >
              <circle
                cx="360"
                cy="170"
                r="46"
                fill="#faf9f5"
                stroke={selected.type === "center" ? "#1b365d" : "#2d5a8a"}
                strokeWidth={selected.type === "center" ? "3" : "1.5"}
              />
              <text x="360" y="165" textAnchor="middle" className="pointer-events-none fill-foreground text-[15px] font-medium">
                life
              </text>
              <text x="360" y="184" textAnchor="middle" className="pointer-events-none fill-stone text-[10px]">
                {visibleThreads.length} threads
              </text>
            </g>

            {positionedThreads.map((thread) => {
              const style = getThreadStyle(thread.kind);
              const isSelected = selectedThread?.id === thread.id && selected.type !== "note";

              return (
                <g
                  key={thread.id}
                  filter="url(#mind-map-shadow)"
                  className="cursor-pointer outline-none"
                  tabIndex={0}
                  role="button"
                  aria-label={`Select ${thread.name} thread`}
                  onClick={() => setSelected({ type: "thread", threadId: thread.id })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelected({ type: "thread", threadId: thread.id });
                    }
                  }}
                >
                  <circle
                    cx={thread.x}
                    cy={thread.y}
                    r={thread.radius + (isSelected ? 5 : 0)}
                    fill={style.fill}
                    stroke={isSelected ? "#faf9f5" : "transparent"}
                    strokeWidth="3"
                    className="transition-opacity hover:opacity-90"
                  />
                  <circle cx={thread.x} cy={thread.y - thread.radius + 11} r="10" fill={style.stroke} opacity="0.94" />
                  <text
                    x={thread.x}
                    y={thread.y - thread.radius + 15}
                    textAnchor="middle"
                    className="pointer-events-none fill-stone text-[8px] font-medium uppercase"
                  >
                    {style.label}
                  </text>
                  <text
                    x={thread.x}
                    y={thread.y - 3}
                    textAnchor="middle"
                    className="pointer-events-none fill-primary-foreground text-[12px] font-medium"
                  >
                    {truncateLabel(thread.name, 14)}
                  </text>
                  <text
                    x={thread.x}
                    y={thread.y + 15}
                    textAnchor="middle"
                    className="pointer-events-none fill-primary-foreground/80 text-[10px]"
                  >
                    {thread.noteCount} {thread.noteCount === 1 ? "note" : "notes"}
                  </text>
                </g>
              );
            })}

            {positionedThreads.map((thread) =>
              thread.notes.map((note, noteIndex) => {
                const notePosition = getNotePosition(thread, noteIndex, thread.notes.length);
                const isSelected = selected.type === "note" && selected.noteId === note.id;

                return (
                  <g
                    key={`note-dot-${thread.id}-${note.id}`}
                    className="cursor-pointer outline-none"
                    tabIndex={0}
                    role="button"
                    aria-label={`Preview note: ${note.body}`}
                    onClick={() => setSelected({ type: "note", threadId: thread.id, noteId: note.id })}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelected({ type: "note", threadId: thread.id, noteId: note.id });
                      }
                    }}
                  >
                    <circle
                      cx={notePosition.x}
                      cy={notePosition.y}
                      r={isSelected ? "12" : "9"}
                      fill="#faf9f5"
                      stroke={isSelected ? "#1b365d" : "#504e49"}
                      strokeWidth={isSelected ? "2.5" : "1.5"}
                      className="transition-opacity hover:opacity-75"
                    />
                  </g>
                );
              }),
            )}
          </svg>
        </div>

        <aside className="border-t border-[#e4e1d7] bg-[#faf9f5]/60 p-4 lg:border-l lg:border-t-0">
          {selected.type === "center" ? (
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-stone">overview</p>
              <h3 className="mt-2 text-lg font-medium tracking-[-0.02em] text-foreground">life</h3>
              <p className="mt-3 text-sm leading-6 text-stone">
                {threads.length} active {threads.length === 1 ? "thread" : "threads"} from recent notes.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                {overviewKinds.map((kind) => (
                  <button
                    key={kind.value}
                    type="button"
                    onClick={() => setActiveKind(kind.value)}
                    className="rounded-[8px] border border-[#e4e1d7] bg-background/60 px-2 py-2 text-left transition-colors hover:bg-secondary"
                  >
                    <span className="block text-[10px] uppercase tracking-[0.06em] text-stone">{kind.label}</span>
                    <span className="mt-1 block text-sm text-foreground">
                      {threads.filter((thread) => thread.kind === kind.value).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : selectedNote && selectedThread ? (
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-stone">note</p>
              <h3 className="mt-2 text-base font-medium tracking-[-0.01em] text-foreground">
                {selectedThread.name}
              </h3>
              <p className="mt-3 line-clamp-5 text-sm leading-6 text-stone">{selectedNote.body}</p>
              <p className="mt-3 text-[11px] text-stone/70">
                {formatNoteTime(selectedNote.createdAt)} · {selectedNote.confidence}% match
              </p>
              <Link
                href={`/notes/${selectedNote.id}`}
                className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-[#152d50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ExternalLink className="size-3.5" strokeWidth={1.5} />
                open note
              </Link>
            </div>
          ) : selectedThread ? (
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-stone">{selectedThread.kind}</p>
              <h3 className="mt-2 text-lg font-medium tracking-[-0.02em] text-foreground">
                {selectedThread.name}
              </h3>
              <p className="mt-3 text-sm leading-6 text-stone">
                {selectedThread.description ?? `Notes that seem connected to ${selectedThread.name}.`}
              </p>
              <div className="mt-5 space-y-2">
                {selectedThread.notes.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => setSelected({ type: "note", threadId: selectedThread.id, noteId: note.id })}
                    className="block w-full rounded-[8px] border border-[#e4e1d7] bg-background/60 px-3 py-2 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="line-clamp-2 text-xs leading-5 text-foreground">{note.body}</span>
                    <span className="mt-1 block text-[11px] text-stone/70">
                      {formatNoteTime(note.createdAt)} · {note.confidence}% match
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      <div className="border-t border-[#e4e1d7] px-5 py-4">
        <p className="text-xs leading-5 text-stone">
          click a thread to inspect its notes. click a note dot to preview it, then open the full note.
        </p>
      </div>
    </div>
  );
}
