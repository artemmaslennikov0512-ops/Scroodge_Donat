import { NextRequest, NextResponse } from "next/server";
import { createDonation } from "@/lib/composition";
import { createDonationBodySchema } from "@/lib/validations";
import { verifyCsrfFromRequest } from "@/lib/security/csrf";
import { checkDonationCreateRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-utils";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  if (!verifyCsrfFromRequest(request)) {
    return NextResponse.json({ error: "Ошибка проверки CSRF" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Неверное тело запроса" }, { status: 400 });
  }

  const parsed = createDonationBodySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const message = Object.values(first).flat().join("; ") || "Ошибка валидации";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const rateLimit = checkDonationCreateRateLimit(getClientIp(request), parsed.data.streamerId);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: rateLimit.reason }, { status: 429 });
  }

  const streamer = await db.streamer.findUnique({
    where: { id: parsed.data.streamerId },
    select: { userId: true },
  });
  if (!streamer) {
    return NextResponse.json({ error: "Стример не найден" }, { status: 404 });
  }
  if (streamer.userId) {
    const userSettings = await db.userSettings.findUnique({
      where: { userId: streamer.userId },
      select: { donationSettings: true },
    });
    const settings = userSettings?.donationSettings as Record<string, unknown> | null;
    if (settings && typeof settings === "object" && settings.enabled === false) {
      return NextResponse.json(
        { error: "Приём донатов временно остановлен стримером" },
        { status: 403 }
      );
    }
  }

  let goalId: string | null = null;
  if (parsed.data.goalId) {
    const [streamer, goal] = await Promise.all([
      db.streamer.findUnique({ where: { id: parsed.data.streamerId }, select: { userId: true } }),
      db.goal.findUnique({ where: { id: parsed.data.goalId }, select: { userId: true, isActive: true, isCompleted: true } }),
    ]);
    if (!streamer || !goal || streamer.userId !== goal.userId || !goal.isActive || goal.isCompleted) {
      return NextResponse.json({ error: "Недопустимая цель для этого стримера" }, { status: 400 });
    }
    goalId = parsed.data.goalId;
  }

  const result = await createDonation({
    streamerId: parsed.data.streamerId,
    streamId: parsed.data.streamId,
    amount: parsed.data.amount,
    message: parsed.data.message,
    isAnonymous: parsed.data.isAnonymous,
    idempotencyKey: parsed.data.idempotencyKey,
    goalId,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    clientSecret: result.clientSecret,
    donationId: result.donationId,
  });
}
