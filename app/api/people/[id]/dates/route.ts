import { addImportantDate } from "@/db/relationships";
import { getCurrentUser } from "@/lib/current-user";
import { serializeDate } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const label = typeof body?.label === "string" ? body.label : "";
  const dateText = typeof body?.dateText === "string" ? body.dateText : "";

  if (!label.trim() || !dateText.trim()) {
    return Response.json({ error: "A date needs a label and a date." }, { status: 400 });
  }

  try {
    const record = await addImportantDate({
      userId: user.id,
      personId: id,
      label,
      dateText,
      note: typeof body?.note === "string" ? body.note : null,
    });
    return Response.json({ date: serializeDate(record) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the date.";
    return Response.json({ error: message }, { status: 400 });
  }
}
