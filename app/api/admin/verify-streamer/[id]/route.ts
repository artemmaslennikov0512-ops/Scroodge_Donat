import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import {
  sendVerificationApprovedEmail,
  sendVerificationRejectedEmail,
} from "@/lib/email";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminToken();
    if (!admin) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const action = body.action as string; // "approve" | "reject"
    const comment = (body.comment as string) || "";

    const verification = await db.streamerVerification.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!verification) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }

    if (verification.status !== "pending") {
      return NextResponse.json(
        { error: "Заявка уже обработана" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      await db.$transaction([
        db.streamerVerification.update({
          where: { id },
          data: {
            status: "approved",
            reviewedAt: new Date(),
            reviewedBy: admin.id,
            adminComment: comment || null,
          },
        }),
        db.user.update({
          where: { id: verification.userId },
          data: {
            isStreamer: true,
            streamerVerified: true,
            streamerVerifiedAt: new Date(),
          },
        }),
        db.adminAction.create({
          data: {
            adminId: admin.id,
            actionType: "verify",
            targetType: "user",
            targetId: verification.userId,
            details: { action: "approve_streamer", verificationId: id },
          },
        }),
      ]);
      if (verification.user.email) {
        await sendVerificationApprovedEmail(
          verification.user.email,
          verification.user.username || verification.user.name || "Пользователь"
        );
      }
      return NextResponse.json({ message: "Заявка одобрена" });
    }

    if (action === "reject") {
      await db.$transaction([
        db.streamerVerification.update({
          where: { id },
          data: {
            status: "rejected",
            reviewedAt: new Date(),
            reviewedBy: admin.id,
            adminComment: comment || "Документы не прошли проверку",
          },
        }),
        db.adminAction.create({
          data: {
            adminId: admin.id,
            actionType: "verify",
            targetType: "user",
            targetId: verification.userId,
            details: { action: "reject_streamer", verificationId: id, comment },
          },
        }),
      ]);
      if (verification.user.email) {
        await sendVerificationRejectedEmail(
          verification.user.email,
          verification.user.username || verification.user.name || "Пользователь",
          comment || "Документы не прошли проверку"
        );
      }
      return NextResponse.json({ message: "Заявка отклонена" });
    }

    return NextResponse.json({ error: "Неверное действие" }, { status: 400 });
  } catch (err) {
    console.error("Admin verify-streamer error:", err);
    return NextResponse.json(
      { error: "Ошибка обработки" },
      { status: 500 }
    );
  }
}
