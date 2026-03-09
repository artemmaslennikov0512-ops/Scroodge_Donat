import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subDays, subMonths } from "date-fns";
import { requireSession } from "@/lib/session";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/** GET — список донатов текущего стримера (по своим streamers). period=week|month|all, page, limit, search */
export async function GET(request: NextRequest) {
  const result = await requireSession();
  if (result.error) return result.error;
  const { session } = result;

  const streamers = await db.streamer.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const streamerIds = streamers.map((s) => s.id);
  if (streamerIds.length === 0) {
    return NextResponse.json({ donations: [], total: 0 });
  }

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") ?? "all") as "week" | "month" | "all";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));
  const search = (searchParams.get("search") ?? "").trim().toLowerCase();

  const where: { streamerId: { in: string[] }; status?: string; createdAt?: { gte: Date }; OR?: Array<{ message: { contains: string; mode: "insensitive" } }> } = {
    streamerId: { in: streamerIds },
    status: "succeeded",
  };

  if (period === "week") {
    where.createdAt = { gte: subDays(new Date(), 7) };
  } else if (period === "month") {
    where.createdAt = { gte: subMonths(new Date(), 1) };
  }

  if (search) {
    where.OR = [{ message: { contains: search, mode: "insensitive" } }];
  }

  const [donations, total] = await Promise.all([
    db.donation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        amountRub: true,
        message: true,
        isAnonymous: true,
        status: true,
        createdAt: true,
      },
    }),
    db.donation.count({ where }),
  ]);

  const list = donations.map((d) => ({
    id: d.id,
    donorName: d.isAnonymous ? "Аноним" : "Донатер",
    amount: d.amountRub,
    message: d.message,
    createdAt: d.createdAt.toISOString(),
    status: d.status,
  }));

  return NextResponse.json({ donations: list, total });
}
