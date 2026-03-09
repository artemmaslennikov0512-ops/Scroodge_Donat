"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiSave, FiDollarSign, FiUser, FiShield } from "react-icons/fi";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type UserDetail = {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  balance: number;
  isVerified: boolean;
  streamerVerified: boolean;
  isStreamer: boolean;
  createdAt: string;
  streams: { id: string; slug: string; displayName: string }[];
  recentDonations: {
    id: string;
    amount: number;
    message: string | null;
    donorName: string;
    status: string;
    createdAt: string;
    streamerSlug: string;
  }[];
  totalRevenue: number;
};

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState({ balance: 0, isVerified: false, streamerVerified: false, isStreamer: false });

  useEffect(() => {
    fetch("/api/admin/check")
      .then((res) => res.json())
      .then((data) => {
        if (!data?.admin) router.replace("/admin/login");
      })
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/users/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data: UserDetail) => {
        setUser(data);
        setEdit({
          balance: data.balance,
          isVerified: data.isVerified,
          streamerVerified: data.streamerVerified,
          isStreamer: data.isStreamer,
        });
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Ошибка сохранения");
      }
      const updated = await res.json();
      setUser((prev) => prev ? { ...prev, ...updated } : null);
      setEdit((e) => ({ ...e, ...updated }));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] p-6">
        <p className="text-gray-400">Пользователь не найден.</p>
        <Link href="/admin/users" className="text-cyan-400 hover:underline mt-4 inline-block">
          ← К списку пользователей
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e]">
      <div className="border-b border-cyan-500/30 bg-black/30 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/admin/users"
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm"
          >
            <FiArrowLeft /> К списку пользователей
          </Link>
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-white text-sm">
            Панель управления
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <FiUser className="text-cyan-400" />
          {user.name || user.username || user.email || user.id}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-cyan-500/30">
            <h2 className="text-lg font-bold text-white mb-4">Профиль</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Email</span>
                <span className="text-white">{user.email ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Username</span>
                <span className="text-white">{user.username ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Регистрация</span>
                <span className="text-white">
                  {format(new Date(user.createdAt), "dd MMM yyyy", { locale: ru })}
                </span>
              </div>
            </dl>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-cyan-500/30">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FiShield className="text-cyan-400" />
              Редактирование (полный доступ)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Баланс (₽)</label>
                <input
                  type="number"
                  min={0}
                  value={edit.balance}
                  onChange={(e) => setEdit((s) => ({ ...s, balance: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                  className="w-full px-4 py-2 bg-black/30 border border-cyan-500/30 rounded-lg text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isVerified"
                  checked={edit.isVerified}
                  onChange={(e) => setEdit((s) => ({ ...s, isVerified: e.target.checked }))}
                  className="rounded border-gray-600 bg-black/30 text-cyan-400"
                />
                <label htmlFor="isVerified" className="text-gray-300 text-sm">Email верифицирован</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="streamerVerified"
                  checked={edit.streamerVerified}
                  onChange={(e) => setEdit((s) => ({ ...s, streamerVerified: e.target.checked }))}
                  className="rounded border-gray-600 bg-black/30 text-cyan-400"
                />
                <label htmlFor="streamerVerified" className="text-gray-300 text-sm">Стример верифицирован</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isStreamer"
                  checked={edit.isStreamer}
                  onChange={(e) => setEdit((s) => ({ ...s, isStreamer: e.target.checked }))}
                  className="rounded border-gray-600 bg-black/30 text-cyan-400"
                />
                <label htmlFor="isStreamer" className="text-gray-300 text-sm">Является стримером</label>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r bg-cyan-500 hover:bg-cyan-400 rounded-lg text-white font-medium disabled:opacity-50"
              >
                <FiSave /> {saving ? "Сохранение…" : "Сохранить"}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-cyan-500/30 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Стримеры и доход</h2>
          {user.streams.length === 0 ? (
            <p className="text-gray-400">Нет привязанных стримеров.</p>
          ) : (
            <ul className="space-y-2">
              {user.streams.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-white font-medium">{s.displayName}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">@{s.slug}</span>
                    <Link
                      href={`/streamer/${s.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline text-sm"
                    >
                      Страница доната
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 pt-4 border-t border-white/10">
            <span className="text-gray-400">Всего получено донатов: </span>
            <span className="text-green-400 font-bold">{user.totalRevenue.toLocaleString()} ₽</span>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-cyan-500/30">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FiDollarSign className="text-green-400" />
            Последние донаты
          </h2>
          {user.recentDonations.length === 0 ? (
            <p className="text-gray-400">Нет донатов.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-white/10">
                    <th className="pb-2">Сумма</th>
                    <th className="pb-2">Донатер</th>
                    <th className="pb-2">Статус</th>
                    <th className="pb-2">Стример</th>
                    <th className="pb-2">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {user.recentDonations.map((d) => (
                    <tr key={d.id} className="border-b border-white/5">
                      <td className="py-2 text-green-400 font-medium">{d.amount} ₽</td>
                      <td className="py-2 text-white">{d.donorName}</td>
                      <td className="py-2">
                        <span className={d.status === "succeeded" ? "text-green-400" : "text-gray-400"}>{d.status}</span>
                      </td>
                      <td className="py-2 text-gray-300">@{d.streamerSlug}</td>
                      <td className="py-2 text-gray-400">
                        {format(new Date(d.createdAt), "dd MMM HH:mm", { locale: ru })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
