import { NextResponse } from "next/server";
import { regenerateDonateLinkId } from "@/lib/streamer";
import { requireSession } from "@/lib/session";
import { getBaseUrl } from "@/lib/config";

/** POST — выдать новую ссылку на донат (старая перестаёт работать). */
export async function POST() {
  const result = await requireSession();
  if (result.error) return result.error;
  const { session } = result;

  const newId = await regenerateDonateLinkId(session.user.id);
  if (!newId) {
    return NextResponse.json(
      { error: "Сначала создайте профиль стримера (укажите имя пользователя в профиле)" },
      { status: 400 }
    );
  }

  const base = getBaseUrl();
  const donateUrl = base ? `${base}/d/${newId}` : `/d/${newId}`;

  return NextResponse.json({ donateLinkId: newId, donateUrl });
}
