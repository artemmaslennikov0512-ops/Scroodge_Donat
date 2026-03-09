import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

/** GET — получить профиль текущего пользователя */
export async function GET() {
  const result = await requireSession();
  if (result.error) return result.error;
  const { session } = result;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
      phone: true,
      phoneVerified: true,
      bio: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    name: user.name ?? "",
    username: user.username ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    phoneVerified: !!user.phoneVerified,
    bio: user.bio ?? "",
    image: user.image ?? null,
  });
}

const ALLOWED_KEYS = ["name", "username", "email", "phone", "bio"] as const;

/** PATCH — обновить профиль (name, username, email, phone, bio) */
export async function PATCH(req: Request) {
  const result = await requireSession();
  if (result.error) return result.error;
  const { session } = result;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Partial<{ name: string; username: string; email: string; phone: string; bio: string }> = {};
  for (const key of ALLOWED_KEYS) {
    if (body[key] !== undefined) {
      const val = body[key];
      data[key] = typeof val === "string" ? val.trim() : "";
    }
  }

  if (data.username !== undefined) {
    const existing = await db.user.findFirst({
      where: {
        username: data.username,
        NOT: { id: session.user.id },
      },
    });
    if (existing) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }
  }

  if (data.email !== undefined && data.email) {
    const existing = await db.user.findFirst({
      where: {
        email: { equals: data.email, mode: "insensitive" },
        NOT: { id: session.user.id },
      },
    });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
  }

  const updated = await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(data.name !== undefined && { name: data.name || null }),
      ...(data.username !== undefined && { username: data.username || null }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.bio !== undefined && { bio: data.bio || null }),
      ...(data.phone !== undefined && {
        phone: data.phone || null,
        phoneVerified: null, // при смене номера нужно подтвердить снова
      }),
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      phone: true,
      bio: true,
    },
  });

  const { ensureStreamerForUser } = await import("@/lib/streamer");
  await ensureStreamerForUser(session.user.id);

  return NextResponse.json({
    name: updated.name,
    username: updated.username,
    email: updated.email,
    phone: updated.phone,
    bio: updated.bio,
  });
}
