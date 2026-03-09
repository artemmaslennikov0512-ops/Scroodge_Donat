import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadAvatar } from "@/lib/upload";
import { requireSession } from "@/lib/session";

/** POST — загрузить аватар (multipart/form-data, поле "file") */
export async function POST(req: Request) {
  const result = await requireSession();
  if (result.error) return result.error;
  const userId = result.session.user.id;

  let file: File;
  try {
    const formData = await req.formData();
    const raw = formData.get("file");
    if (!raw || !(raw instanceof File) || !raw.size) {
      return NextResponse.json(
        { error: "Выберите изображение (JPG, PNG или WebP, до 2MB)" },
        { status: 400 }
      );
    }
    file = raw;
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  try {
    const url = await uploadAvatar(file, userId);
    await db.user.update({
      where: { id: userId },
      data: { image: url },
    });
    return NextResponse.json({ image: url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка загрузки";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
