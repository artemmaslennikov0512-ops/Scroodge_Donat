import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { getClientIp } from "@/lib/request-utils";
import { checkForgotPasswordRateLimit } from "@/lib/rate-limit";

import { getBaseUrl } from "@/lib/config";

/** POST — запрос на сброс пароля. Body: { login, phone }. Ищем пользователя по логину и номеру телефона, отправляем ссылку на email. */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkForgotPasswordRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: rateLimit.reason }, { status: 429 });
    }
    const body = await req.json();
    const login = typeof body.login === "string" ? body.login.trim() : "";
    const phoneRaw = typeof body.phone === "string" ? body.phone.trim() : "";

    if (!login) {
      return NextResponse.json({ error: "Укажите логин" }, { status: 400 });
    }
    if (!phoneRaw) {
      return NextResponse.json({ error: "Укажите номер телефона" }, { status: 400 });
    }
    if (!isValidPhone(phoneRaw)) {
      return NextResponse.json({ error: "Неверный формат номера телефона" }, { status: 400 });
    }

    const phoneNorm = normalizePhone(phoneRaw);

    const user = await db.user.findFirst({
      where: {
        username: login,
        phone: phoneNorm,
      },
      select: { id: true, email: true, password: true },
    });

    if (!user || !user.email || !user.password) {
      return NextResponse.json({
        message: "Если аккаунт с таким логином и номером телефона существует, на привязанную почту отправлена ссылка для сброса пароля.",
      });
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret || secret.length < 32) {
      return NextResponse.json({ error: "Сервер не настроен для сброса пароля" }, { status: 500 });
    }

    const token = jwt.sign(
      { userId: user.id, purpose: "password-reset" },
      secret,
      { expiresIn: "1h" }
    );
    const resetUrl = `${getBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;

    await sendPasswordResetEmail(user.email, resetUrl);

    return NextResponse.json({
      message: "Если аккаунт с таким логином и номером телефона существует, на привязанную почту отправлена ссылка для сброса пароля.",
    });
  } catch (e) {
    console.error("[forgot-password]", e);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
