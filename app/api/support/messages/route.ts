import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifySupportNewMessage } from "@/lib/supportWebhook";
import { requireSession } from "@/lib/session";
import { getBaseUrl } from "@/lib/config";

const MAX_BODY_LENGTH = 2000;
const WELCOME_MESSAGE =
  "Здравствуйте! Опишите ваш вопрос — мы ответим в течение 24 часов.";

/** GET — история сообщений чата поддержки текущего пользователя */
export async function GET() {
  const result = await requireSession();
  if (result.error) return result.error;
  const { session } = result;

  const messages = await db.supportMessage.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ messages });
}

/** POST — отправить сообщение в чат поддержки */
export async function POST(request: NextRequest) {
  const result = await requireSession();
  if (result.error) return result.error;
  const { session } = result;

  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const text =
    typeof body.message === "string" ? body.message.trim() : "";
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

  const previousCount = await db.supportMessage.count({
    where: { userId: session.user.id },
  });

  const [userMessage] = await db.$transaction([
    db.supportMessage.create({
      data: {
        userId: session.user.id,
        body: text,
        role: "user",
      },
      select: {
        id: true,
        body: true,
        role: true,
        createdAt: true,
      },
    }),
  ]);

  // Первое сообщение от пользователя — добавляем автоответ поддержки
  if (previousCount === 0) {
    await db.supportMessage.create({
      data: {
        userId: session.user.id,
        body: WELCOME_MESSAGE,
        role: "support",
      },
    });
  }

  const appUrl = getBaseUrl();
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, username: true },
  });
  notifySupportNewMessage({
    userId: session.user.id,
    userName: user?.name ?? null,
    userEmail: user?.email ?? null,
    username: user?.username ?? null,
    messagePreview: text,
    appUrl,
  });

  return NextResponse.json({ message: userMessage });
}
