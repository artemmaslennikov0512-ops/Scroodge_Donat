import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";
import { getJwtSecret } from "@/lib/adminJwt";
import { getClientIp } from "@/lib/request-utils";
import { checkAdminLoginRateLimit } from "@/lib/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkAdminLoginRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json({ message: rateLimit.reason }, { status: 429 });
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email и пароль обязательны" },
        { status: 400 }
      );
    }
    const emailNorm = String(email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(emailNorm)) {
      return NextResponse.json(
        { message: "Неверные учётные данные" },
        { status: 401 }
      );
    }

    const admin = await db.adminUser.findUnique({
      where: { email: emailNorm },
    });

    if (!admin) {
      return NextResponse.json(
        { message: "Неверные учётные данные" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(String(password), admin.password);

    if (!isValid) {
      return NextResponse.json(
        { message: "Неверные учётные данные" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      getJwtSecret(),
      { expiresIn: "8h" }
    );

    await db.adminUser.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    await db.adminAction.create({
      data: {
        adminId: admin.id,
        actionType: "login",
        targetType: "system",
        details: { success: true },
        ipAddress: getClientIp(req),
        userAgent: req.headers.get("user-agent") ?? undefined,
      },
    });

    const response = NextResponse.json(
      {
        message: "Успешный вход",
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          mustChangePassword: admin.mustChangePassword,
        },
        mustChangePassword: admin.mustChangePassword,
      },
      { status: 200 }
    );

    const isSecure =
      process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true";
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 8 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Admin auth error:", error);
    return NextResponse.json(
      { message: "Ошибка аутентификации" },
      { status: 500 }
    );
  }
}
