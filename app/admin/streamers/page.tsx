"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiSearch, FiEye } from "react-icons/fi";

type StreamerRow = {
  id: string;
  slug: string;
  displayName: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  donationsCount: number;
  totalRevenue: number;
};

export default function StreamersPage() {
  const [list, setList] = useState<StreamerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/streamers")
      .then((res) => (res.ok ? res.json() : []))
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = list.filter(
    (s) =>
      s.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      s.userName?.toLowerCase().includes(search.toLowerCase()) ||
      s.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      s.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Стримеры</h1>
      <div className="panel-hud p-6">
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Поиск по имени, email или slug..."
              className="w-full pl-10 pr-4 py-2 bg-black/30 border border-cyan-500/40 rounded-lg text-white focus:border-cyan-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p className="text-gray-400 py-8">Загрузка...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-left text-gray-400 border-b border-cyan-500/40">
                <tr>
                  <th className="pb-2">Стример</th>
                  <th className="pb-2">Slug</th>
                  <th className="pb-2">Пользователь</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Донатов</th>
                  <th className="pb-2">Сумма</th>
                  <th className="pb-2">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-cyan-500/5">
                    <td className="py-3 text-white font-medium">{s.displayName}</td>
                    <td className="py-3 text-gray-300">@{s.slug}</td>
                    <td className="py-3 text-gray-300">{s.userName}</td>
                    <td className="py-3 text-gray-300">{s.userEmail}</td>
                    <td className="py-3 text-gray-400">{s.donationsCount}</td>
                    <td className="py-3 text-cyan-400">{s.totalRevenue.toLocaleString()} ₽</td>
                    <td className="py-3">
                      {s.userId && (
                        <Link
                          href={`/admin/users/${s.userId}`}
                          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                        >
                          <FiEye /> Профиль
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-gray-400 py-8">Нет стримеров.</p>
        )}
      </div>
    </div>
  );
}
