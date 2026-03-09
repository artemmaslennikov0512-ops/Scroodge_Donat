"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiAlertTriangle,
  FiAlertCircle,
  FiDollarSign,
  FiClock,
  FiShield,
  FiUsers,
  FiTrendingUp,
  FiActivity,
  FiExternalLink,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiSlash,
} from "react-icons/fi";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { parseJsonFromResponse } from "@/lib/fetchJson";

type AntifraudStats = {
  failedCount24h: number;
  canceledCount24h: number;
  pendingCount: number;
  highValueCount: number;
  totalSucceeded24h: number;
  succeededCount24h: number;
};

type DonationItem = {
  id: string;
  amountRub: number;
  status?: string;
  isAnonymous?: boolean;
  message: string | null;
  createdAt: string;
  streamer: { id: string; slug: string; displayName: string; userId?: string | null };
};

type LogItem = {
  id: string;
  level: string;
  message: string;
  details: unknown;
  ipAddress: string | null;
  createdAt: string;
};

type ActionItem = {
  id: string;
  actionType: string;
  targetType: string;
  targetId: string | null;
  details: unknown;
  createdAt: string;
};

type AntifraudData = {
  stats: AntifraudStats;
  recentSuspicious: DonationItem[];
  recentHighValue: DonationItem[];
  securityLogs: LogItem[];
  adminActions: ActionItem[];
};

function formatDate(s: string) {
  try {
    const d = new Date(s);
    return format(d, "dd.MM.yyyy HH:mm", { locale: ru });
  } catch {
    return "—";
  }
}

export default function AdminAntifraudPage() {
  const router = useRouter();
  const [data, setData] = useState<AntifraudData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/antifraud", { credentials: "include" });
      if (res.status === 403) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) {
        const err = await parseJsonFromResponse<{ error?: string }>(res).catch(
          (): { error?: string } => ({})
        );
        setError(err.error ?? "Ошибка загрузки");
        return;
      }
      const json = await parseJsonFromResponse<AntifraudData>(res);
      setData(json);
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/admin/check")
      .then((res) => res.json())
      .then((d) => { if (!d?.admin) router.replace("/admin/login"); })
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Антифрод</h1>
        <div className="panel-hud p-8 text-center text-gray-400">
          <FiRefreshCw className="animate-spin inline-block text-2xl mb-2" />
          <p>Загрузка данных…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Антифрод</h1>
        <div className="panel-hud p-6 text-red-400">
          {error ?? "Нет данных"}
          <button type="button" onClick={load} className="ml-4 text-cyan-400 hover:underline">
            Повторить
          </button>
        </div>
      </div>
    );
  }

  const { stats, recentSuspicious, recentHighValue, securityLogs, adminActions } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <FiShield className="text-cyan-400" />
          Антифрод
        </h1>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition disabled:opacity-50"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          Обновить
        </button>
      </div>

      {/* Мониторинг — сводка */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <FiEye className="text-cyan-400" />
          Мониторинг
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="panel-hud p-4">
            <div className="flex items-center gap-2 text-red-400 mb-1">
              <FiXCircle />
              <span className="text-sm">Неуспешные за 24 ч</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.failedCount24h}</div>
          </div>
          <div className="panel-hud p-4">
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <FiSlash />
              <span className="text-sm">Отменённые за 24 ч</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.canceledCount24h}</div>
          </div>
          <div className="panel-hud p-4">
            <div className="flex items-center gap-2 text-yellow-400 mb-1">
              <FiClock />
              <span className="text-sm">В ожидании</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.pendingCount}</div>
          </div>
          <div className="panel-hud p-4">
            <div className="flex items-center gap-2 text-cyan-400 mb-1">
              <FiTrendingUp />
              <span className="text-sm">Крупные (≥10k ₽)</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.highValueCount}</div>
          </div>
          <div className="panel-hud p-4">
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <FiCheckCircle />
              <span className="text-sm">Успешных за 24 ч</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.succeededCount24h}</div>
          </div>
          <div className="panel-hud p-4">
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <FiDollarSign />
              <span className="text-sm">Сумма за 24 ч</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {(stats.totalSucceeded24h / 1000).toFixed(0)}k ₽
            </div>
          </div>
        </div>
      </section>

      {/* Подозрительные донаты и крупные */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel-hud p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FiAlertCircle className="text-amber-400" />
              Подозрительные донаты (неуспешные / отменённые)
            </h3>
            <Link
              href="/admin/donations?status=fraud"
              className="text-sm text-cyan-400 hover:underline flex items-center gap-1"
            >
              Все донаты <FiExternalLink />
            </Link>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            {recentSuspicious.length === 0 ? (
              <p className="text-gray-400 text-sm">Нет записей за последние 7 дней</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="py-2 pr-2">Дата</th>
                    <th className="py-2 pr-2">Сумма</th>
                    <th className="py-2 pr-2">Статус</th>
                    <th className="py-2 pr-2">Стример</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSuspicious.map((d) => (
                    <tr key={d.id} className="border-b border-gray-800/50">
                      <td className="py-2 pr-2 text-gray-300">{formatDate(d.createdAt)}</td>
                      <td className="py-2 pr-2 text-white">{d.amountRub.toLocaleString("ru")} ₽</td>
                      <td className="py-2 pr-2">
                        <span
                          className={
                            d.status === "failed"
                              ? "text-red-400"
                              : "text-amber-400"
                          }
                        >
                          {d.status === "failed" ? "Неуспех" : "Отменён"}
                        </span>
                      </td>
                      <td className="py-2 pr-2">
                        <Link
                          href={`/admin/streamers`}
                          className="text-cyan-400 hover:underline"
                        >
                          {d.streamer.slug}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="panel-hud p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FiTrendingUp className="text-cyan-400" />
              Крупные донаты (≥10 000 ₽)
            </h3>
            <Link
              href="/admin/donations"
              className="text-sm text-cyan-400 hover:underline flex items-center gap-1"
            >
              Донаты <FiExternalLink />
            </Link>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            {recentHighValue.length === 0 ? (
              <p className="text-gray-400 text-sm">Нет крупных донатов</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="py-2 pr-2">Дата</th>
                    <th className="py-2 pr-2">Сумма</th>
                    <th className="py-2 pr-2">Стример</th>
                  </tr>
                </thead>
                <tbody>
                  {recentHighValue.map((d) => (
                    <tr key={d.id} className="border-b border-gray-800/50">
                      <td className="py-2 pr-2 text-gray-300">{formatDate(d.createdAt)}</td>
                      <td className="py-2 pr-2 text-white font-medium">
                        {d.amountRub.toLocaleString("ru")} ₽
                      </td>
                      <td className="py-2 pr-2">
                        <Link
                          href={`/admin/streamers`}
                          className="text-cyan-400 hover:underline"
                        >
                          {d.streamer.slug}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {/* Отслеживание — логи и действия */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <FiActivity className="text-cyan-400" />
          Отслеживание
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="panel-hud p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Лог безопасности</h3>
            <div className="max-h-56 overflow-y-auto space-y-2 text-sm">
              {securityLogs.length === 0 ? (
                <p className="text-gray-400">Записей нет. События категории security пишутся в SystemLog.</p>
              ) : (
                securityLogs.map((l) => (
                  <div
                    key={l.id}
                    className="p-2 rounded bg-black/30 text-gray-300 border-l-2 border-cyan-500/50"
                  >
                    <span className={`font-medium ${
                      l.level === "error" ? "text-red-400" : l.level === "warn" ? "text-amber-400" : "text-gray-400"
                    }`}>
                      [{l.level}]
                    </span>{" "}
                    {l.message}
                    {l.ipAddress && <span className="text-gray-500 ml-1">IP: {l.ipAddress}</span>}
                    <div className="text-xs text-gray-500 mt-1">{formatDate(l.createdAt)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="panel-hud p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Действия админов (донаты/пользователи)</h3>
            <div className="max-h-56 overflow-y-auto space-y-2 text-sm">
              {adminActions.length === 0 ? (
                <p className="text-gray-400">Нет действий</p>
              ) : (
                adminActions.map((a) => (
                  <div
                    key={a.id}
                    className="p-2 rounded bg-black/30 text-gray-300 flex flex-wrap items-center gap-2"
                  >
                    <span className="text-cyan-400">{a.actionType}</span>
                    <span className="text-gray-500">{a.targetType}</span>
                    {a.targetId && (
                      <Link
                        href={
                          a.targetType === "user"
                            ? `/admin/users/${a.targetId}`
                            : "/admin/donations"
                        }
                        className="text-cyan-400 hover:underline"
                      >
                        {a.targetId.slice(0, 8)}…
                      </Link>
                    )}
                    <span className="text-xs text-gray-500">{formatDate(a.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Управление и предотвращение */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <FiShield className="text-cyan-400" />
          Управление и предотвращение
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="panel-hud p-6">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <FiDollarSign className="text-cyan-400" />
              Действия по донатам
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link href="/admin/donations?status=fraud" className="text-cyan-400 hover:underline">
                  Донаты со статусом «Неуспех» →
                </Link>
              </li>
              <li>
                <Link href="/admin/donations?status=refunded" className="text-cyan-400 hover:underline">
                  Отменённые донаты →
                </Link>
              </li>
              <li>
                <Link href="/admin/donations" className="text-cyan-400 hover:underline">
                  Все донаты (фильтры, массовая отмена/пометка) →
                </Link>
              </li>
            </ul>
            <p className="text-sm text-gray-500 mt-3">
              В разделе «Донаты» можно массово пометить выбранные донаты как отменённые или неуспешные.
            </p>
          </div>
          <div className="panel-hud p-6">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <FiUsers className="text-cyan-400" />
              Пользователи и стримеры
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link href="/admin/users" className="text-cyan-400 hover:underline">
                  Список пользователей →
                </Link>
              </li>
              <li>
                <Link href="/admin/streamers" className="text-cyan-400 hover:underline">
                  Стримеры →
                </Link>
              </li>
              <li>
                <Link href="/admin/verifications" className="text-cyan-400 hover:underline">
                  Верификации стримеров →
                </Link>
              </li>
            </ul>
            <p className="text-sm text-gray-500 mt-3">
              В карточке пользователя можно изменить баланс, верификацию и права стримера.
            </p>
          </div>
        </div>
        <div className="panel-hud p-6 border border-amber-500/30 bg-amber-500/5">
          <h3 className="text-lg font-semibold text-amber-200 mb-2 flex items-center gap-2">
            <FiAlertTriangle />
            Рекомендации по предотвращению
          </h3>
          <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
            <li>Регулярно просматривайте неуспешные и отменённые платежи — возможны повторные попытки мошенничества.</li>
            <li>Крупные донаты (≥10k ₽) стоит сверять с выводами и верификацией стримера.</li>
            <li>Используйте Stripe Radar и настройки 3D Secure в кабинете Stripe для автоматической защиты.</li>
            <li>При подозрении отмените донат в разделе «Донаты» и при необходимости скорректируйте баланс пользователя.</li>
            <li>Все действия админов логируются в «Действия админов» и в разделе «Обзор» (экспорт отчёта).</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
