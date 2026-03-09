/**
 * Секрет для JWT админ-панели. В production обязан быть задан в env.
 */
const DEV_FALLBACK = "dev-secret-change-in-production";

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET должен быть установлен в .env в production");
  }
  return DEV_FALLBACK;
}
