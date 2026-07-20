import { getNoteById, updateNote } from "@/db/queries";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

function serializeNote(note: {
  id: string;
  body: string;
  kind: "quick" | "reflection";
  writtenFor: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: note.id,
    body: note.body,
    kind: note.kind,
    writtenFor: note.writtenFor,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export async function GET(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const note = await getNoteById(user.id, id);
  if (!note) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ note: serializeNote(note) });
}

export async function PATCH(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { body?: unknown } | null;
  const noteBody = typeof body?.body === "string" ? body.body : "";

  try {
    const note = await updateNote({
      userId: user.id,
      noteId: id,
      body: noteBody,
    });

    if (!note) return Response.json({ error: "Not found" }, { status: 404 });

    return Response.json({ note: serializeNote(note) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update note.";
    return Response.json({ error: message }, { status: 400 });
  }
}
