import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminToken } from "@/lib/adminAuth";

export async function GET(req: Request) {
  const admin = await verifyAdminToken();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);

    const actions = await db.adminAction.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        actionType: true,
        targetType: true,
        targetId: true,
        details: true,
        ipAddress: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ actions });
  } catch (error) {
    console.error("Admin actions error:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки действий" },
      { status: 500 }
    );
  }
}
