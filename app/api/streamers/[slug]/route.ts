import { NextRequest, NextResponse } from "next/server";
import { getStreamerBySlug } from "@/lib/composition";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: "slug обязателен" }, { status: 400 });
  }
  const streamer = await getStreamerBySlug(slug);
  if (!streamer) {
    return NextResponse.json({ error: "Стример не найден" }, { status: 404 });
  }
  return NextResponse.json(streamer);
}
