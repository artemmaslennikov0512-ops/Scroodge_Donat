import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

const MIN_WITHDRAWAL = 100;
const MAX_WITHDRAWAL = 1_000_000;

/** POST — запрос на вывод (заглушка: сразу списание с баланса и запись в историю) */
export async function POST(request: NextRequest) {
  const result = await requireSession();
  if (result.error) return result.error;
  const { session } = result;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Неверное тело запроса" }, { status: 400 });
  }

  const amount = typeof body === "object" && body !== null && "amount" in body
    ? Number((body as { amount: unknown }).amount)
    : NaN;

  if (!Number.isFinite(amount) || amount < MIN_WITHDRAWAL || amount > MAX_WITHDRAWAL) {
    return NextResponse.json(
      { error: `Сумма вывода от ${MIN_WITHDRAWAL} до ${MAX_WITHDRAWAL} ₽` },
      { status: 400 }
    );
  }

  const amountRub = Math.round(amount);

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { balance: true, streamerVerified: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  if (!user.streamerVerified) {
    return NextResponse.json(
      { error: "Вывод средств доступен только после прохождения верификации стримера." },
      { status: 403 }
    );
  }

  if (user.balance < amountRub) {
    return NextResponse.json(
      { error: "Недостаточно средств на балансе" },
      { status: 400 }
    );
  }

  const [_, withdrawal] = await db.$transaction([
    db.user.update({
      where: { id: session.user.id },
      data: { balance: { decrement: amountRub } },
    }),
    db.withdrawal.create({
      data: {
        userId: session.user.id,
        amountRub,
        status: "completed",
      },
    }),
  ]);

  const updated = await db.user.findUnique({
    where: { id: session.user.id },
    select: { balance: true },
  });

  return NextResponse.json({
    success: true,
    id: withdrawal.id,
    balance: updated?.balance ?? 0,
    message: "Заглушка: вывод зачислен в историю. Реальный вывод будет доступен после подключения платёжной системы.",
  });
}
