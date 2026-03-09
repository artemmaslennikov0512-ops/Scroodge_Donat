import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

/** GET — статистика ЛК стримера: баланс, кол-во донатов, сумма (по своим стримерам) */
export async function GET() {
  const result = await requireSession();
  if (result.error) return result.error;
  const { session } = result;

  const { ensureStreamerForUser } = await import("@/lib/streamer");
  await ensureStreamerForUser(session.user.id);
  const streamers = await db.streamer.findMany({
    where: { userId: session.user.id },
    select: { id: true, slug: true, donateLinkId: true },
  });
  const streamerIds = streamers.map((s) => s.id);

  const [user, agg] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true, name: true, username: true },
    }),
    streamerIds.length > 0
      ? db.donation.aggregate({
          where: {
            streamerId: { in: streamerIds },
            status: "succeeded",
          },
          _sum: { amountRub: true },
          _count: true,
        })
      : Promise.resolve({ _sum: { amountRub: null }, _count: 0 }),
  ]);

  const totalRevenue = agg._sum.amountRub ?? 0;
  const donationsCount = agg._count;
  const balance = user?.balance ?? 0;
  const primarySlug = streamers[0]?.slug ?? null;
  const primaryDonateLinkId = streamers[0]?.donateLinkId ?? null;

  const username = user?.username ?? null;

  return NextResponse.json({
    balance,
    totalRevenue,
    donationsCount,
    streamerSlug: primarySlug,
    donateLinkId: primaryDonateLinkId,
    username,
    streamers: streamers.map((s) => ({ id: s.id, slug: s.slug, donateLinkId: s.donateLinkId })),
  });
}
