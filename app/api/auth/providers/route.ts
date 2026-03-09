import { NextResponse } from "next/server";

/** Список OAuth-провайдеров, для которых заданы переменные окружения (без секретов). */
export async function GET() {
  const providers: string[] = [];
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push("google");
  }
  if (process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET) {
    providers.push("twitch");
  }
  if (process.env.VK_CLIENT_ID && process.env.VK_CLIENT_SECRET) {
    providers.push("vk");
  }
  if (process.env.APPLE_ID && process.env.APPLE_SECRET) {
    providers.push("apple");
  }
  return NextResponse.json({ providers });
}
