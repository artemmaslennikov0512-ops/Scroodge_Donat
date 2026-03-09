import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://example.com";

/** Публичные страницы для индексации. Страницы ЛК/админки не включаем. */
const staticRoutes: { url: string; lastModified?: string; changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"; priority?: number }[] = [
  { url: "/", changeFrequency: "daily", priority: 1 },
  { url: "/login", changeFrequency: "monthly", priority: 0.8 },
  { url: "/register", changeFrequency: "monthly", priority: 0.8 },
  { url: "/forgot-password", changeFrequency: "monthly", priority: 0.5 },
  { url: "/terms", changeFrequency: "yearly", priority: 0.4 },
  { url: "/privacy", changeFrequency: "yearly", priority: 0.4 },
  { url: "/oferta", changeFrequency: "yearly", priority: 0.4 },
  { url: "/donation/success", changeFrequency: "monthly", priority: 0.3 },
  { url: "/verify-email", changeFrequency: "monthly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  return staticRoutes.map(({ url, lastModified, changeFrequency, priority }) => ({
    url: `${baseUrl}${url}`,
    lastModified: lastModified || now,
    changeFrequency,
    priority: priority ?? 0.7,
  }));
}
