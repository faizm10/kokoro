import { deletePerson, getPersonDeep, updatePerson } from "@/db/relationships";
import { getCurrentUser } from "@/lib/current-user";
import { serializePersonDetail } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const person = await getPersonDeep(user.id, id);
  if (!person) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ person: serializePersonDetail(person) });
}

export async function PATCH(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Invalid request." }, { status: 400 });

  try {
    await updatePerson(user.id, id, {
      name: typeof body.name === "string" ? body.name : undefined,
      relationship: "relationship" in body ? (body.relationship as string | null) : undefined,
      howWeMet: "howWeMet" in body ? (body.howWeMet as string | null) : undefined,
      tags: "tags" in body ? body.tags : undefined,
      summary: "summary" in body ? (body.summary as string | null) : undefined,
    });
    const person = await getPersonDeep(user.id, id);
    if (!person) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ person: serializePersonDetail(person) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update person.";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await deletePerson(user.id, id);
  return Response.json({ ok: true });
}
