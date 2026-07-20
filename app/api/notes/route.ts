import { createNote, getRecentNotes } from "@/db/queries";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

type NoteResponse = {
  id: string;
  body: string;
  kind: "quick" | "reflection";
  writtenFor: string | null;
  createdAt: string;
};

function serializeNote(note: {
  id: string;
  body: string;
  kind: "quick" | "reflection";
  writtenFor: string | null;
  createdAt: Date;
}): NoteResponse {
  return {
    id: note.id,
    body: note.body,
    kind: note.kind,
    writtenFor: note.writtenFor,
    createdAt: note.createdAt.toISOString(),
  };
}

async function getSerializedRecentNotes(userId: string) {
  const notes = await getRecentNotes(userId, 5);
  return notes.map(serializeNote);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const notes = await getSerializedRecentNotes(user.id);

  return Response.json({ notes });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { body?: unknown } | null;
  const noteBody = typeof body?.body === "string" ? body.body.trim() : "";

  if (!noteBody) {
    return Response.json({ error: "A note cannot be empty." }, { status: 400 });
  }

  await createNote({
    userId: user.id,
    body: noteBody,
    kind: "quick",
  });

  const notes = await getSerializedRecentNotes(user.id);
  return Response.json({ notes }, { status: 201 });
}
