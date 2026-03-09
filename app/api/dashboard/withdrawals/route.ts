import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

/** GET — список выводов текущего пользователя */
export async function GET() {
  const result = await requireSession();
  if (result.error) return result.error;
  const { session } = result;

  const list = await db.withdrawal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      amountRub: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    withdrawals: list.map((w) => ({
      id: w.id,
      amount: w.amountRub,
      status: w.status,
      createdAt: w.createdAt.toISOString(),
    })),
  });
}
