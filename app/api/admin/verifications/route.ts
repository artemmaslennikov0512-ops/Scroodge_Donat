import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const admin = await verifyAdminToken();
    if (!admin) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";

    const verifications = await db.streamerVerification.findMany({
      where: status === "all" ? undefined : { status },
      orderBy: { submittedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(verifications);
  } catch (err) {
    console.error("Admin verifications list error:", err);
    return NextResponse.json(
      { error: "Ошибка загрузки" },
      { status: 500 }
    );
  }
}
