import { checkDatabase } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await checkDatabase();

    return Response.json({
      status: result.ok === 1 ? "ok" : "error",
      database: "postgres",
      error: "error" in result ? result.error : undefined,
    });
  } catch {
    return Response.json(
      {
        status: "error",
        database: "postgres",
      },
      { status: 503 },
    );
  }
}
