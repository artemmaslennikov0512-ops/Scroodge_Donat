import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/v1/streamers/[slug]/stats
 * Публичный API для оверлеев: агрегированная статистика по стримеру (всего донатов, сумма).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: "Slug required" }, { status: 400 });
  }

  const streamer = await db.streamer.findUnique({
    where: { slug: slug.trim() },
    select: { id: true, displayName: true },
  });
  if (!streamer) {
    return NextResponse.json({ error: "Streamer not found" }, { status: 404 });
  }

  const [total, recentCount] = await Promise.all([
    db.donation.aggregate({
      where: { streamerId: streamer.id, status: "succeeded" },
      _sum: { amountRub: true },
      _count: true,
    }),
    db.donation.count({
      where: {
        streamerId: streamer.id,
        status: "succeeded",
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  return NextResponse.json({
    streamerId: streamer.id,
    displayName: streamer.displayName,
    totalAmount: total._sum.amountRub ?? 0,
    totalDonations: total._count,
    donationsLast24h: recentCount,
  });
}
