import { deleteImportantDate } from "@/db/relationships";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteImportantDate(user.id, id);
  return Response.json({ ok: true });
}
