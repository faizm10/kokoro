import { getMindMap } from "@/db/queries";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const threads = await getMindMap(user.id);

  return Response.json({
    center: {
      id: "self",
      label: "you",
    },
    threads: threads.map((thread) => ({
      id: thread.id,
      name: thread.name,
      kind: thread.kind,
      description: thread.description,
      noteCount: thread.noteCount,
      notes: thread.notes.map((note) => ({
        id: note.id,
        body: note.body,
        confidence: note.confidence,
        createdAt: note.createdAt.toISOString(),
      })),
    })),
  });
}
