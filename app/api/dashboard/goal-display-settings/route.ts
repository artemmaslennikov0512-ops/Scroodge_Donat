import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

const DEFAULTS = {
  position: "bottom-right",
  backgroundColor: "#1f2937",
  textColor: "#ffffff",
  barColor: "#ec4899",
  fontFamily: "Inter",
  fontSize: 16,
  showTitle: true,
  showDescription: true,
  showEndDate: true,
  borderRadius: 12,
};

/** GET — настройки отображения виджета цели для текущего пользователя */
export async function GET() {
  const result = await requireSession();
  if (result.error) return result.error;
  const { session } = result;

  const row = await db.goalDisplaySettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!row) {
    return NextResponse.json(DEFAULTS);
  }

  return NextResponse.json({
    position: row.position ?? DEFAULTS.position,
    backgroundColor: row.backgroundColor ?? DEFAULTS.backgroundColor,
    textColor: row.textColor ?? DEFAULTS.textColor,
    barColor: row.barColor ?? DEFAULTS.barColor,
    fontFamily: row.fontFamily ?? DEFAULTS.fontFamily,
    fontSize: row.fontSize ?? DEFAULTS.fontSize,
    showTitle: row.showTitle,
    showDescription: row.showDescription,
    showEndDate: row.showEndDate,
    borderRadius: row.borderRadius ?? DEFAULTS.borderRadius,
  });
}

/** PUT — сохранить настройки отображения виджета цели */
export async function PUT(req: Request) {
  const result = await requireSession();
  if (result.error) return result.error;
  const { session } = result;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Неверное тело запроса" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const position = typeof b.position === "string" && ["top-left", "top-right", "bottom-left", "bottom-right", "center"].includes(b.position)
    ? b.position
    : DEFAULTS.position;
  const backgroundColor = b.backgroundColor === undefined || b.backgroundColor === null ? null : String(b.backgroundColor);
  const textColor = b.textColor === undefined || b.textColor === null ? null : String(b.textColor);
  const barColor = b.barColor === undefined || b.barColor === null ? null : String(b.barColor);
  const fontFamily = b.fontFamily === undefined || b.fontFamily === null ? null : String(b.fontFamily);
  const fontSize = typeof b.fontSize === "number" && b.fontSize >= 10 && b.fontSize <= 32 ? b.fontSize : null;
  const showTitle = typeof b.showTitle === "boolean" ? b.showTitle : true;
  const showDescription = typeof b.showDescription === "boolean" ? b.showDescription : true;
  const showEndDate = typeof b.showEndDate === "boolean" ? b.showEndDate : true;
  const borderRadius = typeof b.borderRadius === "number" && b.borderRadius >= 0 && b.borderRadius <= 24 ? b.borderRadius : null;

  await db.goalDisplaySettings.upsert({
    where: { userId: session.user.id },
    update: {
      position,
      backgroundColor,
      textColor,
      barColor,
      fontFamily,
      fontSize,
      showTitle,
      showDescription,
      showEndDate,
      borderRadius,
    },
    create: {
      userId: session.user.id,
      position,
      backgroundColor,
      textColor,
      barColor,
      fontFamily,
      fontSize,
      showTitle,
      showDescription,
      showEndDate,
      borderRadius,
    },
  });

  return NextResponse.json({ success: true });
}
