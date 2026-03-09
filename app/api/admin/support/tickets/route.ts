import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";
import { db } from "@/lib/db";

/** GET — список заявок (1 пользователь = 1 заявка), сортировка по последнему сообщению */
export async function GET() {
  const admin = await verifyAdminToken();
  if (!admin) {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  const userIds = await db.supportMessage.findMany({
    distinct: ["userId"],
    select: { userId: true },
    orderBy: { createdAt: "desc" },
  });

  const tickets = await Promise.all(
    userIds.map(async ({ userId }) => {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
        },
      });
      const lastMsg = await db.supportMessage.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { body: true, role: true, createdAt: true },
      });
      const count = await db.supportMessage.count({
        where: { userId },
      });
      return {
        userId,
        user: user
          ? {
              id: user.id,
              name: user.name ?? user.username ?? user.email ?? "—",
              email: user.email ?? "—",
              username: user.username ?? "—",
            }
          : null,
        lastMessage: lastMsg
          ? {
              body: lastMsg.body,
              role: lastMsg.role,
              createdAt: lastMsg.createdAt,
            }
          : null,
        messageCount: count,
      };
    })
  );

  const withUser = tickets.filter((t) => t.user !== null);
  return NextResponse.json({ tickets: withUser });
}
