import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/health
 * Проверка готовности к продакшену: БД и приложение.
 */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "ok" });
  } catch (e) {
    console.error("[health] DB check failed:", e);
    return NextResponse.json(
      { status: "error", db: "fail" },
      { status: 503 }
    );
  }
}
