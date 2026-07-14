type MindMapNote = {
  id: string;
  body: string;
  confidence: number;
};

type MindMapThread = {
  id: string;
  name: string;
  kind: "theme" | "who" | "event";
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

  return {
    fill: "#1b365d",
    stroke: "#faf9f5",
    label: "theme",
  };
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
  const threads = data?.threads ?? [];
  const positionedThreads = getThreadPositions(threads);

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
      <svg
        viewBox="0 0 720 340"
        role="img"
        aria-label="Mind map of connected note threads"
        className="h-[280px] w-full sm:h-[320px]"
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
              stroke="#d5d2c7"
              strokeLinecap="round"
              strokeWidth="2"
            />
          </g>
        ))}

        {positionedThreads.map((thread) =>
          thread.notes.map((note, noteIndex) => {
            const notePosition = getNotePosition(thread, noteIndex, thread.notes.length);

            return (
              <line
                key={`note-link-${thread.id}-${note.id}`}
                x1={thread.x}
                y1={thread.y}
                x2={notePosition.x}
                y2={notePosition.y}
                stroke="#ddd9cd"
                strokeLinecap="round"
                strokeWidth="1.5"
              />
            );
          }),
        )}

        <g filter="url(#mind-map-shadow)">
          <circle cx="360" cy="170" r="42" fill="#faf9f5" stroke="#1b365d" strokeWidth="1.5" />
          <text x="360" y="165" textAnchor="middle" className="fill-foreground text-[15px] font-medium">
            life
          </text>
          <text x="360" y="184" textAnchor="middle" className="fill-stone text-[10px]">
            {threads.length} threads
          </text>
        </g>

        {positionedThreads.map((thread) => {
          const style = getThreadStyle(thread.kind);

          return (
            <g key={thread.id} filter="url(#mind-map-shadow)">
              <circle cx={thread.x} cy={thread.y} r={thread.radius} fill={style.fill} />
              <circle cx={thread.x} cy={thread.y - thread.radius + 11} r="10" fill={style.stroke} opacity="0.94" />
              <text
                x={thread.x}
                y={thread.y - thread.radius + 15}
                textAnchor="middle"
                className="fill-stone text-[8px] font-medium uppercase"
              >
                {style.label}
              </text>
              <text
                x={thread.x}
                y={thread.y - 3}
                textAnchor="middle"
                className="fill-primary-foreground text-[12px] font-medium"
              >
                {truncateLabel(thread.name, 14)}
              </text>
              <text x={thread.x} y={thread.y + 15} textAnchor="middle" className="fill-primary-foreground/80 text-[10px]">
                {thread.noteCount} {thread.noteCount === 1 ? "note" : "notes"}
              </text>
            </g>
          );
        })}

        {positionedThreads.map((thread) =>
          thread.notes.map((note, noteIndex) => {
            const notePosition = getNotePosition(thread, noteIndex, thread.notes.length);

            return (
              <a key={`note-dot-${thread.id}-${note.id}`} href={`/notes/${note.id}`} aria-label={note.body}>
                <circle
                  cx={notePosition.x}
                  cy={notePosition.y}
                  r="8"
                  fill="#faf9f5"
                  stroke="#504e49"
                  strokeWidth="1.5"
                  className="transition-opacity hover:opacity-70"
                />
              </a>
            );
          }),
        )}
      </svg>

      <div className="border-t border-[#e4e1d7] px-5 py-4">
        <p className="text-xs leading-5 text-stone">
          large nodes are who, event, and theme threads. small dots are notes; click one to open it.
        </p>
      </div>
    </div>
  );
}
