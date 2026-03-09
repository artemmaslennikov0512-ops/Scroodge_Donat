/**
 * Хелперы для проверки сессии в API-роутах.
 * Избегают дублирования getServerSession + 401.
 */

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Сессия с гарантированным user.id (после requireSession). */
export type AuthenticatedSession = Session & { user: Session["user"] & { id: string } };

export type SessionResult =
  | { session: AuthenticatedSession; error?: never }
  | { session?: never; error: NextResponse };

/** Возвращает сессию или NextResponse с 401. В роутах: const result = await requireSession(); if (result.error) return result.error; */
export async function requireSession(): Promise<SessionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session: session as AuthenticatedSession };
}

/** Id текущего пользователя из сессии или undefined. */
export function getUserId(session: Session | null): string | undefined {
  return (session?.user as { id?: string } | undefined)?.id;
}
