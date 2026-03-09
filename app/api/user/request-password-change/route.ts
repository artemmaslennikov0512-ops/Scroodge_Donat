import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";
import { sendPasswordChangeEmail } from "@/lib/email";
import { checkRequestPasswordChangeRateLimit } from "@/lib/rate-limit";
import { requireSession } from "@/lib/session";
import { getBaseUrl } from "@/lib/config";

/** POST — запрос ссылки для смены пароля на email (проверка почты). Требуется сессия. */
export async function POST() {
  const result = await requireSession();
  if (result.error) return result.error;
  const { session } = result;
  const rateLimit = checkRequestPasswordChangeRateLimit(session.user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: rateLimit.reason }, { status: 429 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, password: true },
  });

  if (!user?.email || !user.password) {
    return NextResponse.json(
      { error: "У аккаунта нет email или вход только через OAuth. Смена пароля недоступна." },
      { status: 400 }
    );
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) {
    return NextResponse.json(
      { error: "Сервер не настроен для отправки писем" },
      { status: 500 }
    );
  }

  const token = jwt.sign(
    { userId: user.id, purpose: "password-change" },
    secret,
    { expiresIn: "1h" }
  );
  const resetUrl = `${getBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;

  await sendPasswordChangeEmail(user.email, resetUrl);

  return NextResponse.json({
    message: "На вашу почту отправлена ссылка для смены пароля. Ссылка действительна 1 час.",
  });
}
