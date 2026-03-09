import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { db } from "@/lib/db";

const MIN_PASSWORD_LENGTH = 8;

type JwtPayload = { userId: string; purpose: string };

/** POST — установка нового пароля по токену. Body: { token, newPassword }. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!token) {
      return NextResponse.json({ error: "Не указан токен сброса" }, { status: 400 });
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Пароль должен быть не менее ${MIN_PASSWORD_LENGTH} символов` },
        { status: 400 }
      );
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret || secret.length < 32) {
      return NextResponse.json({ error: "Сервер не настроен" }, { status: 500 });
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, secret) as JwtPayload;
    } catch {
      return NextResponse.json({ error: "Ссылка для сброса пароля недействительна или истекла. Запросите новую." }, { status: 400 });
    }

    const allowedPurposes = ["password-reset", "password-change"];
    if (!allowedPurposes.includes(decoded.purpose) || !decoded.userId) {
      return NextResponse.json({ error: "Неверный токен" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "Пароль успешно изменён. Войдите с новым паролем." });
  } catch (e) {
    console.error("[reset-password]", e);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
