"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { FiChevronRight, FiHome } from "react-icons/fi";

/** Человекочитаемые названия сегментов пути */
const routeNames: Record<string, string> = {
  dashboard: "Личный кабинет",
  donations: "Донаты",
  settings: "Настройки",
  goals: "Цели сбора",
  alerts: "Алерты",
  integrations: "Интеграции",
  profile: "Профиль",
  verification: "Верификация",
  admin: "Админ-панель",
  users: "Пользователи",
  verifications: "Верификации",
  payments: "Платежи",
  analytics: "Аналитика",
  "change-password": "Смена пароля",
  login: "Вход",
};

function getSegmentName(segment: string): string {
  return routeNames[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const name = getSegmentName(segment);
    const isLast = index === segments.length - 1;
    return { href, name, isLast };
  });

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mb-4" aria-label="Хлебные крошки">
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-white transition shrink-0"
      >
        <FiHome className="text-base shrink-0" />
        <span>Главная</span>
      </Link>
      {breadcrumbs.map((crumb) => (
        <Fragment key={crumb.href}>
          <FiChevronRight className="text-gray-600 shrink-0" aria-hidden />
          {crumb.isLast ? (
            <span className="text-white font-medium">{crumb.name}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-white transition truncate max-w-[120px] sm:max-w-none">
              {crumb.name}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
