import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/v1/streamers/[slug]/goal
 * Публичный API для оверлея цели сбора: активная цель стримера по slug.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug?.trim()) {
    return NextResponse.json({ error: "Slug required" }, { status: 400 });
  }

  const streamer = await db.streamer.findUnique({
    where: { slug: slug.trim() },
    select: { userId: true },
  });
  if (!streamer?.userId) {
    return NextResponse.json({ error: "Streamer not found" }, { status: 404 });
  }

  const [goal, displayRow] = await Promise.all([
    db.goal.findFirst({
      where: {
        userId: streamer.userId,
        isActive: true,
        isCompleted: false,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        currentAmount: true,
        targetAmount: true,
        endDate: true,
        currency: true,
      },
    }),
    db.goalDisplaySettings.findUnique({
      where: { userId: streamer.userId },
    }),
  ]);

  if (!goal) {
    return NextResponse.json({ error: "No active goal" }, { status: 404 });
  }

  const displayDefaults = {
    position: "bottom-right",
    backgroundColor: "#1f2937",
    textColor: "#ffffff",
    barColor: "#ec4899",
    fontFamily: "Inter",
    fontSize: 16,
    showTitle: true,
    showDescription: true,
    showEndDate: true,
    borderRadius: 12,
  };

  const displaySettings = displayRow
    ? {
        position: displayRow.position ?? displayDefaults.position,
        backgroundColor: displayRow.backgroundColor ?? displayDefaults.backgroundColor,
        textColor: displayRow.textColor ?? displayDefaults.textColor,
        barColor: displayRow.barColor ?? displayDefaults.barColor,
        fontFamily: displayRow.fontFamily ?? displayDefaults.fontFamily,
        fontSize: displayRow.fontSize ?? displayDefaults.fontSize,
        showTitle: displayRow.showTitle,
        showDescription: displayRow.showDescription,
        showEndDate: displayRow.showEndDate,
        borderRadius: displayRow.borderRadius ?? displayDefaults.borderRadius,
      }
    : displayDefaults;

  return NextResponse.json({
    goal: {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      currentAmount: goal.currentAmount,
      targetAmount: goal.targetAmount,
      endDate: goal.endDate?.toISOString() ?? null,
      currency: goal.currency,
    },
    displaySettings,
  });
}
