import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const admin = await verifyAdminToken();
    if (!admin) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        balance: true,
        isVerified: true,
        streamerVerified: true,
        streamerVerification: { select: { fullName: true } },
      },
    });

    const list = users.map((u) => ({
      id: u.id,
      name: u.name ?? u.username ?? u.email ?? "—",
      fullName: u.streamerVerification?.fullName ?? u.name ?? null,
      email: u.email ?? "—",
      balance: u.balance,
      status: u.isVerified ? "active" : "inactive",
      isVerified: u.isVerified,
      streamerVerified: u.streamerVerified,
    }));

    return NextResponse.json(list);
  } catch (err) {
    console.error("Admin users list error:", err);
    return NextResponse.json(
      { error: "Ошибка загрузки" },
      { status: 500 }
    );
  }
}
