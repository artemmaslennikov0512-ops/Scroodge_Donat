import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

import { getJwtSecret } from "@/lib/adminJwt";
import { getClientIp } from "@/lib/request-utils";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Необходима авторизация" }, { status: 401 });
    }

    const decoded = jwt.verify(token, getJwtSecret()) as { id: string };
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Текущий и новый пароль обязательны" },
        { status: 400 }
      );
    }

    if (String(newPassword).length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { message: `Новый пароль не менее ${MIN_PASSWORD_LENGTH} символов` },
        { status: 400 }
      );
    }

    const admin = await db.adminUser.findUnique({
      where: { id: decoded.id },
    });

    if (!admin) {
      return NextResponse.json({ message: "Пользователь не найден" }, { status: 401 });
    }

    const validCurrent = await bcrypt.compare(String(currentPassword), admin.password);
    if (!validCurrent) {
      return NextResponse.json(
        { message: "Неверный текущий пароль" },
        { status: 400 }
      );
    }

    const hashedNew = await bcrypt.hash(String(newPassword), 10);
    await db.adminUser.update({
      where: { id: admin.id },
      data: {
        password: hashedNew,
        mustChangePassword: false,
      },
    });

    await db.adminAction.create({
      data: {
        adminId: admin.id,
        actionType: "update",
        targetType: "user",
        targetId: admin.id,
        details: { change: "password_changed" },
        ipAddress: getClientIp(req),
        userAgent: req.headers.get("user-agent") ?? undefined,
      },
    });

    return NextResponse.json({
      message: "Пароль успешно изменён",
    });
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ message: "Необходима авторизация" }, { status: 401 });
    }
    console.error("Change password error:", e);
    return NextResponse.json(
      { message: "Ошибка смены пароля" },
      { status: 500 }
    );
  }
}
