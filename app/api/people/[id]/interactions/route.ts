import { createInteraction, getPersonDeep } from "@/db/relationships";
import { getCurrentUser } from "@/lib/current-user";
import { serializePersonDetail } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

function parseOccurredAt(value: unknown): Date | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function POST(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const facts = typeof body?.facts === "string" ? body.facts : "";

  if (!facts.trim()) {
    return Response.json({ error: "An entry needs at least some factual notes." }, { status: 400 });
  }

  try {
    await createInteraction({
      userId: user.id,
      personId: id,
      occurredAt: parseOccurredAt(body?.occurredAt),
      context: typeof body?.context === "string" ? body.context : null,
      source: typeof body?.source === "string" ? body.source : null,
      facts,
      interpretation: typeof body?.interpretation === "string" ? body.interpretation : null,
      topics: body?.topics,
      tags: body?.tags,
      followUp: typeof body?.followUp === "string" ? body.followUp : null,
    });
    const person = await getPersonDeep(user.id, id);
    if (!person) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ person: serializePersonDetail(person) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the entry.";
    return Response.json({ error: message }, { status: 400 });
  }
}
