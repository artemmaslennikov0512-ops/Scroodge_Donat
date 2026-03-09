import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminToken } from "@/lib/adminAuth";

const HIGH_VALUE_THRESHOLD_RUB = 10_000;
const SUSPICIOUS_DAYS = 7;

/** GET — сводка и списки для раздела антифрод: мониторинг, отслеживание */
export async function GET() {
  const admin = await verifyAdminToken();
  if (!admin) {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  try {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const daysAgo = new Date(now.getTime() - SUSPICIOUS_DAYS * 24 * 60 * 60 * 1000);

    const [
      failedCount24h,
      canceledCount24h,
      pendingCount,
      highValueCount,
      totalSucceeded24h,
      recentFailedOrCanceled,
      recentHighValue,
      securityLogs,
      adminActionsFraudRelevant,
    ] = await Promise.all([
      db.donation.count({
        where: { status: "failed", createdAt: { gte: dayAgo } },
      }),
      db.donation.count({
        where: { status: "canceled", createdAt: { gte: dayAgo } },
      }),
      db.donation.count({ where: { status: "pending" } }),
      db.donation.count({
        where: { amountRub: { gte: HIGH_VALUE_THRESHOLD_RUB }, status: "succeeded" },
      }),
      db.donation.aggregate({
        where: { status: "succeeded", createdAt: { gte: dayAgo } },
        _sum: { amountRub: true },
        _count: true,
      }),
      db.donation.findMany({
        where: {
          status: { in: ["failed", "canceled"] },
          createdAt: { gte: daysAgo },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          streamer: { select: { id: true, slug: true, displayName: true, userId: true } },
        },
      }),
      db.donation.findMany({
        where: {
          amountRub: { gte: HIGH_VALUE_THRESHOLD_RUB },
          status: "succeeded",
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          streamer: { select: { id: true, slug: true, displayName: true } },
        },
      }),
      db.systemLog.findMany({
        where: { category: "security" },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, level: true, message: true, details: true, ipAddress: true, createdAt: true },
      }),
      db.adminAction.findMany({
        where: {
          OR: [
            { targetType: "donation" },
            { targetType: "user" },
            { actionType: { in: ["update", "ban", "delete"] } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 25,
        select: {
          id: true,
          actionType: true,
          targetType: true,
          targetId: true,
          details: true,
          createdAt: true,
        },
      }),
    ]);

    const suspiciousList = recentFailedOrCanceled.map((d) => ({
      id: d.id,
      amountRub: d.amountRub,
      status: d.status,
      isAnonymous: d.isAnonymous,
      message: d.message,
      createdAt: d.createdAt.toISOString(),
      streamer: d.streamer,
    }));

    const highValueList = recentHighValue.map((d) => ({
      id: d.id,
      amountRub: d.amountRub,
      message: d.message,
      isAnonymous: d.isAnonymous,
      createdAt: d.createdAt.toISOString(),
      streamer: d.streamer,
    }));

    const logs = securityLogs.map((l) => ({
      id: l.id,
      level: l.level,
      message: l.message,
      details: l.details,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt.toISOString(),
    }));

    const actions = adminActionsFraudRelevant.map((a) => ({
      id: a.id,
      actionType: a.actionType,
      targetType: a.targetType,
      targetId: a.targetId,
      details: a.details,
      createdAt: a.createdAt.toISOString(),
    }));

    return NextResponse.json({
      stats: {
        failedCount24h,
        canceledCount24h,
        pendingCount,
        highValueCount,
        totalSucceeded24h: totalSucceeded24h._sum.amountRub ?? 0,
        succeededCount24h: totalSucceeded24h._count,
      },
      recentSuspicious: suspiciousList,
      recentHighValue: highValueList,
      securityLogs: logs,
      adminActions: actions,
    });
  } catch (e) {
    console.error("Antifraud API error:", e);
    return NextResponse.json(
      { error: "Ошибка загрузки данных антифрода" },
      { status: 500 }
    );
  }
}
