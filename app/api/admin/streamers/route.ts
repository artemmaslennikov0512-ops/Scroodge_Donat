import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";
import { db } from "@/lib/db";

/** GET — список всех стримеров для админки (slug, пользователь, сумма донатов) */
export async function GET() {
  const admin = await verifyAdminToken();
  if (!admin) {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  const streamers = await db.streamer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, username: true, email: true },
      },
      _count: { select: { donations: true } },
    },
  });

  const withRevenue = await Promise.all(
    streamers.map(async (s) => {
      const agg = await db.donation.aggregate({
        where: { streamerId: s.id, status: "succeeded" },
        _sum: { amountRub: true },
      });
      return {
        id: s.id,
        slug: s.slug,
        displayName: s.displayName,
        userId: s.userId,
        userName: s.user?.name ?? s.user?.username ?? "—",
        userEmail: s.user?.email ?? "—",
        donationsCount: s._count.donations,
        totalRevenue: agg._sum.amountRub ?? 0,
      };
    })
  );

  return NextResponse.json(withRevenue);
}
