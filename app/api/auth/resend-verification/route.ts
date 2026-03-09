import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";
import { requireSession } from "@/lib/session";

const COOLDOWN_MINUTES = 5;

export async function POST() {
  try {
    const result = await requireSession();
    if (result.error) return result.error;
    const userId = result.session.user.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        emailVerificationTokens: {
          where: { type: "email" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user?.email) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ error: "Email уже подтвержден" }, { status: 400 });
    }

    const lastToken = user.emailVerificationTokens[0];
    if (lastToken) {
      const minutesSince = (Date.now() - lastToken.createdAt.getTime()) / 1000 / 60;
      if (minutesSince < COOLDOWN_MINUTES) {
        return NextResponse.json(
          {
            error: "Письмо уже отправлено",
            canResendAfter: Math.ceil(COOLDOWN_MINUTES - minutesSince),
          },
          { status: 429 }
        );
      }
    }

    await db.emailVerificationToken.deleteMany({
      where: { userId: user.id, type: "email", usedAt: null },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.emailVerificationToken.create({
      data: {
        token,
        userId: user.id,
        type: "email",
        expiresAt,
      },
    });

    await sendVerificationEmail(user.email, token);

    const maskedEmail = user.email.replace(
      /(.{2})(.*)(?=@)/,
      (_, a, b) => a + "*".repeat(Math.min(b.length, 10))
    );

    return NextResponse.json({
      message: "Письмо отправлено",
      email: maskedEmail,
    });
  } catch (error) {
    console.error("Resend error:", error);
    return NextResponse.json(
      { error: "Ошибка отправки письма" },
      { status: 500 }
    );
  }
}
