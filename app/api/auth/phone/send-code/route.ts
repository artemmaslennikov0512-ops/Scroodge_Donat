import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPhoneCode } from "@/lib/sms";
import { requireSession } from "@/lib/session";

const COOLDOWN_MINUTES = 2;
const CODE_LENGTH = 6;
const CODE_EXPIRES_MINUTES = 10;

function generateCode(): string {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^8/, "7");
}

export async function POST(req: Request) {
  try {
    const result = await requireSession();
    if (result.error) return result.error;
    const userId = result.session.user.id;

    const body = await req.json().catch(() => ({}));
    const rawPhone = body.phone;
    if (!rawPhone || typeof rawPhone !== "string") {
      return NextResponse.json({ error: "Укажите номер телефона" }, { status: 400 });
    }

    const phone = normalizePhone(rawPhone.trim());
    if (phone.length < 10) {
      return NextResponse.json({ error: "Некорректный номер" }, { status: 400 });
    }

    const lastCode = await db.phoneVerificationCode.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (lastCode) {
      const minutesSince = (Date.now() - lastCode.createdAt.getTime()) / 1000 / 60;
      if (minutesSince < COOLDOWN_MINUTES) {
        return NextResponse.json(
          {
            error: "Код уже отправлен",
            canResendAfter: Math.ceil(COOLDOWN_MINUTES - minutesSince),
          },
          { status: 429 }
        );
      }
    }

    await db.phoneVerificationCode.deleteMany({ where: { userId } });

    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRES_MINUTES * 60 * 1000);

    await db.phoneVerificationCode.create({
      data: {
        userId,
        phone: phone.startsWith("7") ? phone : `7${phone}`,
        code,
        expiresAt,
      },
    });

    const sendResult = await sendPhoneCode(phone.startsWith("7") ? phone : `7${phone}`, code);
    if (!sendResult.ok) {
      return NextResponse.json(
        { error: sendResult.error ?? "Ошибка отправки SMS" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Код отправлен",
      canResendAfter: COOLDOWN_MINUTES,
    });
  } catch (e) {
    console.error("[phone/send-code]", e);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
