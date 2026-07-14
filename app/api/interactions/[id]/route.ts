import { deleteInteraction, updateInteraction } from "@/db/relationships";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

function parseOccurredAt(value: unknown): Date | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function PATCH(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Invalid request." }, { status: 400 });

  try {
    await updateInteraction(user.id, id, {
      occurredAt: parseOccurredAt(body.occurredAt),
      context: "context" in body ? (body.context as string | null) : undefined,
      source: "source" in body ? (body.source as string | null) : undefined,
      facts: typeof body.facts === "string" ? body.facts : undefined,
      interpretation: "interpretation" in body ? (body.interpretation as string | null) : undefined,
      topics: "topics" in body ? body.topics : undefined,
      tags: "tags" in body ? body.tags : undefined,
      followUp: "followUp" in body ? (body.followUp as string | null) : undefined,
      followUpDone: typeof body.followUpDone === "boolean" ? body.followUpDone : undefined,
    });
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update the entry.";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteInteraction(user.id, id);
  return Response.json({ ok: true });
}
