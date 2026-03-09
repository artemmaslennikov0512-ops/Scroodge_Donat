import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

import { getJwtSecret } from "@/lib/adminJwt";

/** GET — список всех донатов для админки (с пагинацией и фильтрами) */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    jwt.verify(token, getJwtSecret()) as { id: string };
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));
  const statusFilter = searchParams.get("status") ?? "all";

  const where: { status?: string } = {};
  if (statusFilter !== "all" && ["succeeded", "pending", "failed", "canceled"].includes(statusFilter)) {
    where.status = statusFilter;
  }

  const [donations, total] = await Promise.all([
    db.donation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        streamer: { select: { id: true, slug: true, displayName: true, userId: true } },
      },
    }),
    db.donation.count({ where }),
  ]);

  const userIds = [...new Set(donations.map((d) => d.streamer.userId).filter(Boolean))] as string[];
  const users = userIds.length
    ? await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, username: true },
      })
    : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const list = donations.map((d) => ({
    id: d.id,
    donorName: d.isAnonymous ? "Аноним" : "Донатер",
    donor: { name: d.isAnonymous ? "Аноним" : "Донатер", email: null },
    amount: d.amountRub,
    fee: 0,
    net: d.amountRub,
    status: d.status === "succeeded" ? "completed" : d.status === "pending" ? "pending" : d.status === "canceled" ? "refunded" : "fraud",
    createdAt: d.createdAt.toISOString(),
    message: d.message,
    platform: "stub",
    recipient: {
      username: d.streamer.slug,
      name: userMap[d.streamer.userId ?? ""]?.name ?? d.streamer.displayName ?? d.streamer.slug,
    },
  }));

  return NextResponse.json({ donations: list, total });
}

/** PATCH — массовое обновление статуса донатов (refund/fraud) */
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    jwt.verify(token, getJwtSecret()) as { id: string };
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { ids?: string[]; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === "string") : [];
  const status = body.status === "canceled" || body.status === "failed" ? body.status : null;

  if (ids.length === 0 || !status) {
    return NextResponse.json(
      { error: "Укажите ids (массив id) и status (canceled или failed)" },
      { status: 400 }
    );
  }

  await db.donation.updateMany({
    where: { id: { in: ids } },
    data: { status },
  });

  return NextResponse.json({ updated: ids.length });
}
