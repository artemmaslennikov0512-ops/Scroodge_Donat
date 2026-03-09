import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function GET() {
  const result = await requireSession();
  if (result.error) return result.error;
  const { session } = result;

  const goals = await db.goal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(goals);
}

export async function POST(req: Request) {
  const result = await requireSession();
  if (result.error) return result.error;
  const { session } = result;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Неверное тело запроса" }, { status: 400 });
  }

  const { title, description, targetAmount, endDate, currency = "RUB" } = body as {
    title?: string;
    description?: string | null;
    targetAmount?: number;
    endDate?: string | null;
    currency?: string;
  };

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Название цели обязательно" }, { status: 400 });
  }
  const target = Number(targetAmount);
  if (!Number.isFinite(target) || target <= 0) {
    return NextResponse.json({ error: "Целевая сумма должна быть положительным числом" }, { status: 400 });
  }

  const goal = await db.goal.create({
    data: {
      userId: session.user.id,
      title: title.trim(),
      description: typeof description === "string" ? description.trim() || null : null,
      targetAmount: target,
      endDate: endDate ? new Date(endDate) : null,
      currency: typeof currency === "string" ? currency : "RUB",
    },
  });

  return NextResponse.json(goal);
}
