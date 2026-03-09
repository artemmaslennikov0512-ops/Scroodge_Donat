import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/v1/streamers/[slug]/alert-settings
 * Публичный API для оверлея алертов: настройки алерта донатов для стримера по slug.
 * Используется страницей /streamer/[slug]/alerts для отображения алертов в OBS.
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
    return NextResponse.json({ error: "Streamer not found or has no user" }, { status: 404 });
  }

  const alert = await db.alert.findUnique({
    where: {
      userId_type: { userId: streamer.userId, type: "DONATION" },
    },
  });
  if (!alert || !alert.enabled) {
    return NextResponse.json({ error: "Donation alert not configured or disabled" }, { status: 404 });
  }

  return NextResponse.json({
    animation: alert.animation,
    duration: alert.duration,
    position: alert.position,
    soundEnabled: alert.soundEnabled,
    soundFile: alert.soundFile ?? null,
    soundVolume: alert.soundVolume,
    useDefaultSound: alert.useDefaultSound ?? false,
    messageTemplate: alert.messageTemplate ?? null,
    showMessage: alert.showMessage,
    showAmount: alert.showAmount,
    showName: alert.showName,
    backgroundColor: alert.backgroundColor ?? "#8b5cf6",
    textColor: alert.textColor ?? "#ffffff",
    fontFamily: alert.fontFamily ?? "Inter",
    fontSize: alert.fontSize ?? 16,
    imageUrl: alert.imageUrl ?? null,
    imagePosition: alert.imagePosition ?? null,
    minAmountRub: alert.minAmountRub ?? null,
    cooldownSeconds: alert.cooldownSeconds ?? null,
    textOutline: alert.textOutline ?? "none",
    animationSpeed: alert.animationSpeed ?? 1,
  });
}
