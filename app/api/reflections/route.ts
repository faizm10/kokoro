import { getReflection, saveReflection } from "@/db/queries";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;

function parseWrittenFor(value: unknown) {
  return typeof value === "string" && dateKeyPattern.test(value) ? value : null;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const writtenFor = parseWrittenFor(url.searchParams.get("writtenFor"));
  if (!writtenFor) return Response.json({ error: "Invalid reflection date." }, { status: 400 });

  const reflection = await getReflection(user.id, writtenFor);
  return Response.json({
    reflection: reflection
      ? {
          id: reflection.id,
          body: reflection.body,
          writtenFor: reflection.writtenFor,
          updatedAt: reflection.updatedAt.toISOString(),
        }
      : null,
  });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { body?: unknown; writtenFor?: unknown } | null;
  const writtenFor = parseWrittenFor(body?.writtenFor);
  if (!writtenFor) return Response.json({ error: "Invalid reflection date." }, { status: 400 });

  const reflectionBody = typeof body?.body === "string" ? body.body : "";
  const reflection = await saveReflection({
    userId: user.id,
    writtenFor,
    body: reflectionBody,
  });

  return Response.json({
    reflection: {
      id: reflection.id,
      body: reflection.body,
      writtenFor: reflection.writtenFor,
    },
  });
}
