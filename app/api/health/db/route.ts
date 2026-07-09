import { checkDatabase } from "@/db";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    const result = checkDatabase();

    return Response.json({
      status: result.ok === 1 ? "ok" : "error",
      database: "sqlite",
    });
  } catch {
    return Response.json(
      {
        status: "error",
        database: "sqlite",
      },
      { status: 503 },
    );
  }
}
