import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import type { AlertType } from "@prisma/client";

const ALERT_TYPES: AlertType[] = [
  "DONATION",
  "SUBSCRIPTION",
  "FOLLOW",
  "RAID",
  "HOST",
  "BITS",
];

function isValidAlertType(t: string): t is AlertType {
  return ALERT_TYPES.includes(t as AlertType);
}

export async function GET() {
  const result = await requireSession();
  if (result.error) return result.error;
  const alerts = await db.alert.findMany({
    where: { userId: result.session.user.id },
  });

  return NextResponse.json(alerts);
}

export async function PUT(req: Request) {
  const result = await requireSession();
  if (result.error) return result.error;
  const { session } = result;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Неверное тело запроса" }, { status: 400 });
  }

  const { alerts: alertsPayload } = body as { alerts?: unknown[] };
  if (!Array.isArray(alertsPayload) || alertsPayload.length === 0) {
    return NextResponse.json({ error: "alerts должен быть непустым массивом" }, { status: 400 });
  }

  const userId = session.user.id;
  const operations = alertsPayload
    .filter((a): a is Record<string, unknown> => a != null && typeof a === "object" && typeof (a as { type?: unknown }).type === "string")
    .filter((a) => isValidAlertType((a as { type: string }).type))
    .map((alert) => {
      const type = alert.type as AlertType;
      const data = {
        enabled: typeof alert.enabled === "boolean" ? alert.enabled : true,
        animation: typeof alert.animation === "string" ? alert.animation : "default",
        duration: typeof alert.duration === "number" && alert.duration >= 1 && alert.duration <= 30 ? alert.duration : 5,
        position: typeof alert.position === "string" ? alert.position : "bottom-right",
        soundEnabled: typeof alert.soundEnabled === "boolean" ? alert.soundEnabled : true,
        soundFile: alert.soundFile === undefined || alert.soundFile === null ? null : String(alert.soundFile),
        soundVolume: typeof alert.soundVolume === "number" && alert.soundVolume >= 0 && alert.soundVolume <= 100 ? alert.soundVolume : 70,
        messageTemplate: alert.messageTemplate === undefined || alert.messageTemplate === null ? null : String(alert.messageTemplate),
        showMessage: typeof alert.showMessage === "boolean" ? alert.showMessage : true,
        showAmount: typeof alert.showAmount === "boolean" ? alert.showAmount : true,
        showName: typeof alert.showName === "boolean" ? alert.showName : true,
        backgroundColor: alert.backgroundColor === undefined || alert.backgroundColor === null ? null : String(alert.backgroundColor),
        textColor: alert.textColor === undefined || alert.textColor === null ? null : String(alert.textColor),
        fontFamily: alert.fontFamily === undefined || alert.fontFamily === null ? null : String(alert.fontFamily),
        fontSize: typeof alert.fontSize === "number" && alert.fontSize > 0 ? alert.fontSize : null,
        imageUrl: alert.imageUrl === undefined || alert.imageUrl === null ? null : String(alert.imageUrl),
        imagePosition: alert.imagePosition === undefined || alert.imagePosition === null ? null : String(alert.imagePosition),
        minAmountRub: alert.minAmountRub === undefined || alert.minAmountRub === null ? null : (typeof alert.minAmountRub === "number" && alert.minAmountRub >= 0 ? alert.minAmountRub : null),
        cooldownSeconds: alert.cooldownSeconds === undefined || alert.cooldownSeconds === null ? null : (typeof alert.cooldownSeconds === "number" && alert.cooldownSeconds >= 0 && alert.cooldownSeconds <= 60 ? alert.cooldownSeconds : null),
        textOutline: alert.textOutline === undefined || alert.textOutline === null ? null : (["none", "thin", "bold"].includes(String(alert.textOutline)) ? String(alert.textOutline) : null),
        animationSpeed: alert.animationSpeed === undefined || alert.animationSpeed === null ? null : (typeof alert.animationSpeed === "number" && [0.5, 1, 1.5].includes(alert.animationSpeed) ? alert.animationSpeed : null),
        useDefaultSound: typeof alert.useDefaultSound === "boolean" ? alert.useDefaultSound : false,
      };
      return db.alert.upsert({
        where: {
          userId_type: { userId, type },
        },
        update: data,
        create: {
          userId,
          type,
          ...data,
        },
      });
    });

  await db.$transaction(operations);
  return NextResponse.json({ success: true });
}
