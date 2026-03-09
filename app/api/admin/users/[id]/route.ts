import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";
import { db } from "@/lib/db";

/** GET — полные данные пользователя для админки (профиль, стримеры, последние донаты) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdminToken();
  if (!admin) {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      balance: true,
      isVerified: true,
      streamerVerified: true,
      isStreamer: true,
      createdAt: true,
      streams: { select: { id: true, slug: true, displayName: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  const streamerIds = user.streams.map((s) => s.id);
  const recentDonations =
    streamerIds.length > 0
      ? await db.donation.findMany({
          where: { streamerId: { in: streamerIds } },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            amountRub: true,
            message: true,
            isAnonymous: true,
            status: true,
            createdAt: true,
            streamer: { select: { slug: true } },
          },
        })
      : [];

  const totalRevenue =
    streamerIds.length > 0
      ? await db.donation.aggregate({
          where: { streamerId: { in: streamerIds }, status: "succeeded" },
          _sum: { amountRub: true },
        })
      : { _sum: { amountRub: null } };

  return NextResponse.json({
    ...user,
    recentDonations: recentDonations.map((d) => ({
      id: d.id,
      amount: d.amountRub,
      message: d.message,
      donorName: d.isAnonymous ? "Аноним" : "Донатер",
      status: d.status,
      createdAt: d.createdAt.toISOString(),
      streamerSlug: d.streamer.slug,
    })),
    totalRevenue: totalRevenue._sum.amountRub ?? 0,
  });
}

const ALLOWED_KEYS = ["balance", "isVerified", "streamerVerified", "isStreamer"] as const;

/** PATCH — обновление пользователя (баланс, верификации) — полный доступ админа */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdminToken();
  if (!admin) {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Неверное тело запроса" }, { status: 400 });
  }

  const data: Partial<{ balance: number; isVerified: boolean; streamerVerified: boolean; isStreamer: boolean }> = {};
  if (typeof body.balance === "number" && Number.isFinite(body.balance) && body.balance >= 0) {
    data.balance = Math.round(body.balance);
  }
  if (typeof body.isVerified === "boolean") data.isVerified = body.isVerified;
  if (typeof body.streamerVerified === "boolean") data.streamerVerified = body.streamerVerified;
  if (typeof body.isStreamer === "boolean") data.isStreamer = body.isStreamer;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Нет полей для обновления" }, { status: 400 });
  }

  const updated = await db.user.update({
    where: { id },
    data,
    select: { id: true, balance: true, isVerified: true, streamerVerified: true, isStreamer: true },
  });

  await db.adminAction.create({
    data: {
      adminId: admin.id,
      actionType: "update",
      targetType: "user",
      targetId: id,
      details: { updated: data },
    },
  });

  return NextResponse.json(updated);
}
