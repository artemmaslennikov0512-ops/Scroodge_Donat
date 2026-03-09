import { NextRequest } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { CSRF_HEADER_NAME } from "@/lib/constants";

export const CSRF_COOKIE_NAME = "csrfToken";
export { CSRF_HEADER_NAME };

export function generateCsrfToken(): string {
  return crypto.randomUUID();
}

function sha256(text: string): Buffer {
  return createHash("sha256").update(text, "utf8").digest();
}

/**
 * Проверка CSRF (cookie vs заголовок). Timing-safe сравнение.
 */
export function verifyCsrfFromRequest(request: NextRequest): boolean {
  const cookie = request.cookies.get(CSRF_COOKIE_NAME)?.value ?? "";
  const header = request.headers.get(CSRF_HEADER_NAME) ?? "";
  if (!cookie || !header) return false;
  const a = sha256(cookie);
  const b = sha256(header);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
