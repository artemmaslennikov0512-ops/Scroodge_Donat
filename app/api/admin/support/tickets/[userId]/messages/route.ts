import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";
import { db } from "@/lib/db";

const MAX_BODY_LENGTH = 2000;

/** GET — сообщения заявки (чата) пользователя userId */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await verifyAdminToken();
  if (!admin) {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "userId обязателен" }, { status: 400 });
  }

  const messages = await db.supportMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      role: true,
      createdAt: true,
    },
  });

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, username: true },
  });

  return NextResponse.json({
    messages,
    user: user
      ? {
          id: user.id,
          name: user.name ?? user.username ?? user.email ?? "—",
          email: user.email ?? "—",
          username: user.username ?? "—",
        }
      : null,
  });
}

/** POST — ответ поддержки в заявку пользователя */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await verifyAdminToken();
  if (!admin) {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "userId обязателен" }, { status: 400 });
  }

  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body.message === "string" ? body.message.trim() : "";
  if (!text) {
    return NextResponse.json(
      { error: "Сообщение не может быть пустым" },
      { status: 400 }
    );
  }
  if (text.length > MAX_BODY_LENGTH) {
    return NextResponse.json(
      { error: `Сообщение не длиннее ${MAX_BODY_LENGTH} символов` },
      { status: 400 }
    );
  }

  const exists = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!exists) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  const message = await db.supportMessage.create({
    data: {
      userId,
      body: text,
      role: "support",
    },
    select: {
      id: true,
      body: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ message });
}
