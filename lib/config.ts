/**
 * Конфиг из env (Zod). Переменные приложения.
 * Платёжный шлюз (редирект на ввод карты) настраивается отдельно.
 */

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().or(z.literal("")),
  NEXTAUTH_URL: z.string().optional(),
  VERCEL_URL: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

type EnvSchema = z.infer<typeof envSchema>;

let parsed: EnvSchema | null = null;

function getEnv(): EnvSchema {
  if (parsed) return parsed;
  const result = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, ""),
    NEXTAUTH_URL: process.env.NEXTAUTH_URL?.trim().replace(/\/$/, ""),
    VERCEL_URL: process.env.VERCEL_URL?.trim(),
    SMTP_FROM: process.env.SMTP_FROM?.trim(),
  });
  if (!result.success) {
    throw new Error(`Invalid env: ${JSON.stringify(result.error.flatten())}`);
  }
  parsed = result.data;
  return parsed;
}

export function getNodeEnv(): "development" | "production" | "test" {
  return getEnv().NODE_ENV;
}

export function getDatabaseUrl(): string {
  const url = getEnv().DATABASE_URL;
  if (!url?.trim()) throw new Error("DATABASE_URL должен быть установлен в .env");
  return url;
}

export function getAppUrl(): string {
  const u = getEnv().NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  return u ?? "";
}

/** Базовый URL приложения для сервера (письма, ссылки сброса пароля). Приоритет: NEXTAUTH_URL → NEXT_PUBLIC_APP_URL → VERCEL_URL → localhost. */
export function getBaseUrl(): string {
  const env = getEnv();
  const url =
    env.NEXTAUTH_URL ||
    env.NEXT_PUBLIC_APP_URL ||
    (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : null) ||
    "http://localhost:3000";
  return url.startsWith("http") ? url.replace(/\/$/, "") : `https://${url}`.replace(/\/$/, "");
}

export function getSmtpFrom(smtpUser: string | undefined): string {
  const from = getEnv().SMTP_FROM;
  if (from?.trim()) return from;
  return smtpUser ? `"ScroogeDonat" <${smtpUser}>` : "ScroogeDonat";
}
