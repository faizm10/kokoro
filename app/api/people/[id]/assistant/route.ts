import { getPersonDeep } from "@/db/relationships";
import { getCurrentUser } from "@/lib/current-user";
import { answerQuestion, type AssistantDate, type AssistantInteraction } from "@/lib/assistant";
import { serializeInteraction } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { question?: unknown } | null;
  const question = typeof body?.question === "string" ? body.question.trim() : "";

  if (!question) {
    return Response.json({ error: "Ask a question about your notes." }, { status: 400 });
  }

  const person = await getPersonDeep(user.id, id);
  if (!person) return Response.json({ error: "Not found" }, { status: 404 });

  // The engine only ever sees this person's own notes — never anything else.
  const interactions: AssistantInteraction[] = person.interactions.map(serializeInteraction);
  const dates: AssistantDate[] = person.importantDates.map((d) => ({
    id: d.id,
    label: d.label,
    dateText: d.dateText,
    note: d.note,
  }));

  const answer = answerQuestion(question, interactions, dates);
  return Response.json({ answer });
}
