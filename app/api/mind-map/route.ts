import { auth } from "@/auth";
import { ensureUser, getMindMap } from "@/db/queries";

export const dynamic = "force-dynamic";

async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  return ensureUser({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });
}

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
