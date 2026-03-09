import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * GET /api/v1/streamers/[slug]/donations
 * Публичный API для оверлеев (OBS, StreamElements и др.): последние успешные донаты по slug стримера.
 * Параметры: limit (по умолчанию 20, макс 100).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: "Slug required" }, { status: 400 });
  }

  const streamer = await db.streamer.findUnique({
    where: { slug: slug.trim() },
    select: { id: true },
  });
  if (!streamer) {
    return NextResponse.json({ error: "Streamer not found" }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
  );

  const donations = await db.donation.findMany({
    where: { streamerId: streamer.id, status: "succeeded" },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      amountRub: true,
      message: true,
      isAnonymous: true,
      createdAt: true,
    },
  });

  const list = donations.map((d) => ({
    id: d.id,
    donorName: d.isAnonymous ? "Аноним" : "Донатер",
    amount: d.amountRub,
    message: d.message,
    createdAt: d.createdAt.toISOString(),
  }));

  return NextResponse.json({ donations: list });
}
