import { createPerson, getPeople } from "@/db/relationships";
import { getCurrentUser } from "@/lib/current-user";
import { serializePersonSummary } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const people = await getPeople(user.id);
  return Response.json({ people: people.map(serializePersonSummary) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name : "";

  if (!name.trim()) {
    return Response.json({ error: "A person needs a name." }, { status: 400 });
  }

  try {
    const person = await createPerson({
      userId: user.id,
      name,
      relationship: typeof body?.relationship === "string" ? body.relationship : null,
      howWeMet: typeof body?.howWeMet === "string" ? body.howWeMet : null,
      tags: body?.tags,
      summary: typeof body?.summary === "string" ? body.summary : null,
    });
    return Response.json({ id: person.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create person.";
    return Response.json({ error: message }, { status: 400 });
  }
}
