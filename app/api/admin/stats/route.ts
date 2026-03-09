import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminToken } from "@/lib/adminAuth";

export async function GET() {
  const admin = await verifyAdminToken();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [streamersCount, donationsAgg, actionsCount] = await Promise.all([
      db.streamer.count(),
      db.donation.aggregate({
        _count: { id: true },
        _sum: { amountRub: true },
      }),
      db.adminAction.count(),
    ]);

    return NextResponse.json({
      totalStreamers: streamersCount,
      totalDonations: donationsAgg._count.id,
      totalRevenue: donationsAgg._sum.amountRub ?? 0,
      recentActionsCount: actionsCount,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки статистики" },
      { status: 500 }
    );
  }
}
