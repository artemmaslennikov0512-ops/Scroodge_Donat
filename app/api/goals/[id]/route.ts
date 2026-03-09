import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const result = await requireSession();
  if (result.error) return result.error;
  const { session } = result;

  const { id } = await context.params;
  const goal = await db.goal.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!goal) {
    return NextResponse.json({ error: "Цель не найдена" }, { status: 404 });
  }

  return NextResponse.json(goal);
}

export async function PATCH(req: Request, context: RouteContext) {
  const result = await requireSession();
  if (result.error) return result.error;
  const { session } = result;

  const { id } = await context.params;
  const existing = await db.goal.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Цель не найдена" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Неверное тело запроса" }, { status: 400 });
  }

  const {
    title,
    description,
    targetAmount,
    currentAmount,
    endDate,
    isActive,
    isCompleted,
    currency,
  } = body as {
    title?: string;
    description?: string | null;
    targetAmount?: number;
    currentAmount?: number;
    endDate?: string | null;
    isActive?: boolean;
    isCompleted?: boolean;
    currency?: string;
  };

  const data: Parameters<typeof db.goal.update>[0]["data"] = {};
  if (title !== undefined) data.title = typeof title === "string" ? title.trim() : existing.title;
  if (description !== undefined) data.description = typeof description === "string" ? description.trim() || null : null;
  if (targetAmount !== undefined && Number.isFinite(Number(targetAmount)))
    data.targetAmount = Number(targetAmount);
  if (currentAmount !== undefined && Number.isFinite(Number(currentAmount)))
    data.currentAmount = Number(currentAmount);
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
  if (isActive !== undefined) data.isActive = Boolean(isActive);
  if (isCompleted !== undefined) data.isCompleted = Boolean(isCompleted);
  if (currency !== undefined) data.currency = typeof currency === "string" ? currency : existing.currency;

  const goal = await db.goal.update({
    where: { id },
    data,
  });

  return NextResponse.json(goal);
}

export async function DELETE(_req: Request, context: RouteContext) {
  const result = await requireSession();
  if (result.error) return result.error;
  const { session } = result;

  const { id } = await context.params;
  const existing = await db.goal.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Цель не найдена" }, { status: 404 });
  }

  await db.goal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
