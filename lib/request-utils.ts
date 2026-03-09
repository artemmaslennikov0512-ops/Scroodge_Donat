import type { NextRequest } from "next/server";

/**
 * Извлечь IP клиента. X-Forwarded-For и X-Real-IP доверяются только при TRUST_PROXY=true
 * (за прокси), иначе возможна подделка заголовка и обход rate limit.
 */
export function getClientIp(request: NextRequest | Request): string {
  if (process.env.TRUST_PROXY !== "true") {
    return "unknown";
  }
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
