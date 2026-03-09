import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadFile, validatePassportNumber, validateINN } from "@/lib/upload";
import bcrypt from "bcrypt";
import { requireSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const result = await requireSession();
    if (result.error) return result.error;
    const userId = result.session.user.id;

    const formData = await req.formData();
    const fullName = (formData.get("fullName") as string)?.trim();
    const passportNumber = (formData.get("passportNumber") as string)?.trim();
    const inn = (formData.get("inn") as string)?.trim() || undefined;
    const telegram = (formData.get("telegram") as string)?.trim() || undefined;
    const phone = (formData.get("phone") as string)?.trim() || undefined;
    const passportFile = formData.get("passportFile") as File | null;
    const selfieFile = formData.get("selfieFile") as File | null;

    if (!fullName || fullName.length < 5) {
      return NextResponse.json(
        { error: "Укажите полное имя (как в паспорте)" },
        { status: 400 }
      );
    }

    if (!validatePassportNumber(passportNumber || "")) {
      return NextResponse.json(
        { error: "Неверный формат номера паспорта (серия 4 цифры + номер 6 цифр)" },
        { status: 400 }
      );
    }

    if (inn && !validateINN(inn)) {
      return NextResponse.json(
        { error: "Неверный формат ИНН (10 или 12 цифр)" },
        { status: 400 }
      );
    }

    if (!passportFile?.size) {
      return NextResponse.json(
        { error: "Загрузите скан паспорта" },
        { status: 400 }
      );
    }

    if (!selfieFile?.size) {
      return NextResponse.json(
        { error: "Загрузите фото с паспортом" },
        { status: 400 }
      );
    }

    const existing = await db.streamerVerification.findUnique({
      where: { userId },
    });

    if (existing?.status === "pending") {
      return NextResponse.json(
        { error: "Заявка уже на рассмотрении" },
        { status: 400 }
      );
    }

    const passportUrl = await uploadFile(passportFile, "passports", userId);
    const selfieUrl = await uploadFile(selfieFile, "selfies", userId);
    const hashedPassport = await bcrypt.hash(passportNumber, 10);

    await db.streamerVerification.upsert({
      where: { userId },
      update: {
        fullName,
        passportNumber: hashedPassport,
        inn: inn || null,
        telegram: telegram || null,
        phone: phone || null,
        passportFile: passportUrl,
        selfieFile: selfieUrl,
        status: "pending",
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        adminComment: null,
      },
      create: {
        userId,
        fullName,
        passportNumber: hashedPassport,
        inn: inn || null,
        telegram: telegram || null,
        phone: phone || null,
        passportFile: passportUrl,
        selfieFile: selfieUrl,
        status: "pending",
      },
    });

    const admins = await db.adminUser.findMany({
      select: { id: true },
      take: 10,
    });
    for (const admin of admins) {
      await db.adminNotification.create({
        data: {
          adminId: admin.id,
          title: "Новая заявка на верификацию",
          message: `Пользователь ${fullName} подал заявку на верификацию стримера`,
          type: "info",
          link: "/admin/verifications",
        },
      });
    }

    return NextResponse.json({
      message: "Заявка отправлена",
      status: "pending",
    });
  } catch (err) {
    console.error("Streamer verification error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ошибка при отправке заявки" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await requireSession();
    if (result.error) return result.error;
    const userId = result.session.user.id;

    const verification = await db.streamerVerification.findUnique({
      where: { userId },
    });

    return NextResponse.json({ verification });
  } catch (err) {
    console.error("Get verification error:", err);
    return NextResponse.json(
      { error: "Ошибка получения данных" },
      { status: 500 }
    );
  }
}
