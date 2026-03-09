import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export type DonationSettingsPayload = {
  enabled?: boolean;
  minAmount?: number;
  maxAmount?: number;
  defaultMessage?: string;
  allowAnonymous?: boolean;
  showDonorName?: boolean;
  notificationEmail?: string | null;
  notificationDiscord?: string | null;
};

const DEFAULTS: DonationSettingsPayload = {
  enabled: true,
  minAmount: 50,
  maxAmount: 100000,
  defaultMessage: "Спасибо за поддержку!",
  allowAnonymous: true,
  showDonorName: true,
  notificationEmail: null,
  notificationDiscord: null,
};

/** GET — настройки донатов текущего пользователя */
export async function GET() {
  const result = await requireSession();
  if (result.error) return result.error;
  const { session } = result;

  const settings = await db.userSettings.findUnique({
    where: { userId: session.user.id },
    select: { donationSettings: true },
  });

  const raw = settings?.donationSettings;
  const donationSettings =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? { ...DEFAULTS, ...(raw as Record<string, unknown>) }
      : DEFAULTS;

  return NextResponse.json({ donationSettings });
}

/** PATCH — сохранить настройки донатов */
export async function PATCH(request: NextRequest) {
  const result = await requireSession();
  if (result.error) return result.error;
  const { session } = result;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
  }

  const allowed: (keyof DonationSettingsPayload)[] = [
    "enabled",
    "minAmount",
    "maxAmount",
    "defaultMessage",
    "allowAnonymous",
    "showDonorName",
    "notificationEmail",
    "notificationDiscord",
  ];

  const updates: DonationSettingsPayload = {};
  for (const key of allowed) {
    const v = (body as Record<string, unknown>)[key];
    if (v === undefined) continue;
    if (key === "enabled" || key === "allowAnonymous" || key === "showDonorName") {
      if (typeof v === "boolean") updates[key] = v;
    } else if (key === "minAmount" || key === "maxAmount") {
      if (typeof v === "number" && Number.isFinite(v)) updates[key] = v;
    } else if (key === "defaultMessage") {
      if (typeof v === "string") updates[key] = v.slice(0, 500);
    } else if (key === "notificationEmail" || key === "notificationDiscord") {
      updates[key] = v === "" || v === null ? null : typeof v === "string" ? v : undefined;
    }
  }

  const existing = await db.userSettings.findUnique({
    where: { userId: session.user.id },
    select: { donationSettings: true },
  });

  const current =
    existing?.donationSettings && typeof existing.donationSettings === "object" && !Array.isArray(existing.donationSettings)
      ? (existing.donationSettings as Record<string, unknown>)
      : {};

  const donationSettings = { ...current, ...updates };

  await db.userSettings.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      donationSettings,
    },
    update: { donationSettings },
  });

  return NextResponse.json({ donationSettings });
}
