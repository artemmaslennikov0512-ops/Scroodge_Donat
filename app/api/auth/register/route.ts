import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { getClientIp } from "@/lib/request-utils";
import { checkRegisterRateLimit } from "@/lib/rate-limit";

const MIN_PASSWORD_LENGTH = 8;
const USERNAME_MAX_LENGTH = 50;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRegisterRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json({ message: rateLimit.reason }, { status: 429 });
    }

    const { email, password, username, name, phone } = await req.json();

    if (!email || !password || !username) {
      return NextResponse.json(
        { message: "Email, пароль и имя пользователя обязательны" },
        { status: 400 }
      );
    }
    const passwordStr = typeof password === "string" ? password : "";
    if (passwordStr.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { message: `Пароль должен быть не менее ${MIN_PASSWORD_LENGTH} символов` },
        { status: 400 }
      );
    }
    const unameTrimmed = typeof username === "string" ? username.trim() : "";
    if (unameTrimmed.length > USERNAME_MAX_LENGTH) {
      return NextResponse.json(
        { message: "Имя пользователя слишком длинное" },
        { status: 400 }
      );
    }

    const phoneRaw = typeof phone === "string" ? phone.trim() : "";
    if (!phoneRaw) {
      return NextResponse.json(
        { message: "Укажите номер телефона" },
        { status: 400 }
      );
    }
    if (!isValidPhone(phoneRaw)) {
      return NextResponse.json(
        { message: "Неверный формат номера. Пример: +7 999 123-45-67" },
        { status: 400 }
      );
    }
    const phoneNorm = normalizePhone(phoneRaw);

    const emailNorm = typeof email === "string" ? email.trim().toLowerCase() : "";
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email: { equals: emailNorm, mode: "insensitive" } },
          { username: unameTrimmed },
          { phone: phoneNorm },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Пользователь с такими данными уже существует (email, имя пользователя или телефон)" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(passwordStr, 10);

    const uname = unameTrimmed;
    const user = await db.user.create({
      data: {
        email: emailNorm,
        password: hashedPassword,
        username: uname,
        name: name?.trim() || null,
        phone: phoneNorm,
        settings: {
          create: {},
        },
      },
    });
    const { ensureStreamerForUser } = await import("@/lib/streamer");
    await ensureStreamerForUser(user.id);

    try {
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db.emailVerificationToken.create({
        data: {
          token: verificationToken,
          userId: user.id,
          type: "email",
          expiresAt,
        },
      });

      await sendVerificationEmail(user.email!, verificationToken);
    } catch (verifyErr) {
      console.error("Verification email error (user created):", verifyErr instanceof Error ? verifyErr.message : "unknown");
      return NextResponse.json(
        {
          message:
            "Пользователь создан. Подтверждение по email временно недоступно — вы можете войти по паролю.",
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { message: "Пользователь успешно создан. Проверьте email для подтверждения." },
      { status: 201 }
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const prismaCode = (error as { code?: string })?.code;
    console.error("Registration error:", err.message, prismaCode ? `[${prismaCode}]` : "");
    if (process.env.NODE_ENV === "development") {
      console.error(err.stack);
    }
    const message =
      prismaCode === "P2002"
        ? "Пользователь с таким email, именем или телефоном уже существует."
        : prismaCode === "P2021" || err.message?.includes("does not exist")
          ? "Ошибка БД: таблицы не найдены. Выполните миграции (prisma migrate deploy)."
          : "Ошибка при создании пользователя. Проверьте логи приложения.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
