import { NextResponse } from "next/server";
import { generateCsrfToken, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/security/csrf";

export async function GET() {
  const token = generateCsrfToken();
  const response = NextResponse.json({ csrfToken: token });
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60, // 8 часов
  });
  response.headers.set(CSRF_HEADER_NAME, token);
  return response;
}
