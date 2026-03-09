/**
 * Единое место создания/обновления записи стримера для пользователя.
 * Ссылка на донат — по уникальному donateLinkId (/d/{id}), не по логину.
 */

import { db } from "@/lib/db";
import { randomBytes } from "crypto";

const SLUG_MAX = 50;
const DISPLAY_NAME_MAX = 255;
const DONATE_LINK_ID_LENGTH = 12;
const DONATE_LINK_ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

/** Уникальный короткий идентификатор для ссылки на донат (только буквы и цифры). */
export function generateDonateLinkId(): string {
  const bytes = randomBytes(DONATE_LINK_ID_LENGTH);
  let id = "";
  for (let i = 0; i < DONATE_LINK_ID_LENGTH; i++) {
    id += DONATE_LINK_ID_CHARS[bytes[i]! % DONATE_LINK_ID_CHARS.length];
  }
  return id;
}

function normalizeSlug(username: string): string {
  return username
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, SLUG_MAX) || "user";
}

/**
 * Возвращает стримера для пользователя: если записи нет — создаёт, если есть — при необходимости обновляет displayName.
 * Идемпотентно, один источник правды для slug/displayName.
 */
export async function ensureStreamerForUser(userId: string): Promise<StreamerInfo | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { username: true, name: true },
  });
  if (!user?.username?.trim()) return null;

  const slug = normalizeSlug(user.username);
  const displayName = (user.name?.trim() || user.username).slice(0, DISPLAY_NAME_MAX) || user.username;

  const existing = await db.streamer.findFirst({
    where: { userId },
  });

  if (existing) {
    const slugOk = slug.slice(0, SLUG_MAX);
    const needsDonateLinkId = existing.donateLinkId == null;
    let donateLinkId = existing.donateLinkId;
    if (needsDonateLinkId) {
      donateLinkId = generateDonateLinkId();
      let ok = false;
      for (let attempt = 0; attempt < 5 && !ok; attempt++) {
        const existingId = await db.streamer.findUnique({ where: { donateLinkId } });
        if (!existingId) ok = true;
        else donateLinkId = generateDonateLinkId();
      }
    }
    try {
      await db.streamer.update({
        where: { id: existing.id },
        data: {
          displayName,
          ...(existing.slug !== slugOk ? { slug: slugOk } : {}),
          ...(needsDonateLinkId && donateLinkId ? { donateLinkId } : {}),
        },
      });
      return {
        id: existing.id,
        slug: existing.slug !== slugOk ? slugOk : existing.slug,
        displayName,
        donateLinkId: donateLinkId ?? undefined,
      };
    } catch (e: unknown) {
      const prisma = e as { code?: string };
      if (prisma?.code === "P2002") {
        await db.streamer.update({
          where: { id: existing.id },
          data: { displayName, ...(needsDonateLinkId && donateLinkId ? { donateLinkId } : {}) },
        });
        return { id: existing.id, slug: existing.slug, displayName, donateLinkId: donateLinkId ?? undefined };
      }
      throw e;
    }
  }

  let finalSlug = slug;
  const slugExists = await db.streamer.findUnique({ where: { slug: finalSlug } });
  if (slugExists) {
    finalSlug = `${slug.slice(0, 44)}-${userId.slice(0, 6)}`;
  }

  let donateLinkId = generateDonateLinkId();
  for (let attempt = 0; attempt < 5; attempt++) {
    const exists = await db.streamer.findUnique({ where: { donateLinkId } });
    if (!exists) break;
    donateLinkId = generateDonateLinkId();
  }

  try {
    const created = await db.streamer.create({
      data: {
        slug: finalSlug,
        displayName,
        donateLinkId,
        userId,
      },
    });
    return { id: created.id, slug: created.slug, displayName: created.displayName, donateLinkId: created.donateLinkId ?? undefined };
  } catch (e: unknown) {
    const prisma = e as { code?: string };
    if (prisma?.code === "P2002") {
      const again = await db.streamer.findFirst({ where: { userId } });
      if (again) return { id: again.id, slug: again.slug, displayName: again.displayName, donateLinkId: again.donateLinkId ?? undefined };
    }
    throw e;
  }
}

export type StreamerInfo = {
  id: string;
  slug: string;
  displayName: string;
  donateLinkId?: string | null;
};

/** Найти стримера по уникальной ссылке на донат. */
export async function getStreamerByDonateLinkId(donateLinkId: string): Promise<{
  id: string;
  slug: string;
  displayName: string;
  userId: string | null;
} | null> {
  if (!donateLinkId?.trim()) return null;
  const s = await db.streamer.findUnique({
    where: { donateLinkId: donateLinkId.trim() },
    select: { id: true, slug: true, displayName: true, userId: true },
  });
  return s;
}

/** Сменить ссылку на донат: выдаёт новый donateLinkId, старый перестаёт работать. */
export async function regenerateDonateLinkId(userId: string): Promise<string | null> {
  const streamer = await db.streamer.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!streamer) return null;
  let newId = generateDonateLinkId();
  for (let attempt = 0; attempt < 10; attempt++) {
    const exists = await db.streamer.findUnique({ where: { donateLinkId: newId } });
    if (!exists) break;
    newId = generateDonateLinkId();
  }
  await db.streamer.update({
    where: { id: streamer.id },
    data: { donateLinkId: newId },
  });
  return newId;
}
