import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

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
    const code = body.code?.trim();
    if (!rawPhone || !code) {
      return NextResponse.json({ error: "Укажите номер и код" }, { status: 400 });
    }

    const phone = normalizePhone(rawPhone);
    const normalizedPhone = phone.startsWith("7") ? phone : `7${phone}`;

    const record = await db.phoneVerificationCode.findFirst({
      where: {
        userId,
        phone: normalizedPhone,
        code,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json({ error: "Неверный код или номер" }, { status: 400 });
    }
    if (record.expiresAt < new Date()) {
      return NextResponse.json({ error: "Код истёк. Запросите новый." }, { status: 400 });
    }

    await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: {
          phone: normalizedPhone,
          phoneVerified: new Date(),
        },
      }),
      db.phoneVerificationCode.deleteMany({
        where: { userId },
      }),
    ]);

    return NextResponse.json({ message: "Номер подтверждён" });
  } catch (e) {
    console.error("[phone/verify]", e);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
