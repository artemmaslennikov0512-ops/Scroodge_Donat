import { NextResponse } from "next/server";
import { cleanupReviewedVerificationFiles } from "@/lib/cleanupVerificationFiles";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET не задан" },
      { status: 500 }
    );
  }
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (token !== secret) {
    return NextResponse.json({ error: "Неверный секрет" }, { status: 401 });
  }

  try {
    const result = await cleanupReviewedVerificationFiles();
    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (err) {
    console.error("Cleanup verification files error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ошибка очистки" },
      { status: 500 }
    );
  }
}
