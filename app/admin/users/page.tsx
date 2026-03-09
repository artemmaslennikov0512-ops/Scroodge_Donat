"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiEye, FiCheckCircle } from "react-icons/fi";

interface UserRow {
  id: string;
  name: string;
  fullName: string | null;
  email: string;
  balance: number;
  status: string;
  isVerified: boolean;
  streamerVerified: boolean;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/check")
      .then((res) => res.json())
      .then((data) => {
        if (!data?.admin) router.replace("/admin/login");
      })
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  useEffect(() => {
    fetch("/api/admin/users", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-black/50 backdrop-blur-lg border-b border-cyan-500/40 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/admin/dashboard"
            className="text-gray-400 hover:text-white text-sm"
          >
            ← Панель управления
          </Link>
          <span className="text-gray-500 text-sm">Пользователи</span>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Пользователи</h1>

        <div className="bg-glass rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">
              Загрузка...
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-black/30">
                <tr>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">
                    Пользователь
                  </th>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">
                    ФИО
                  </th>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">
                    Баланс
                  </th>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">
                    Верификация
                  </th>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500/80 to-cyan-600/80 flex items-center justify-center text-white text-sm flex-shrink-0">
                          {(user.name || "?")[0].toUpperCase()}
                        </div>
                        <span className="text-white">{user.name || user.email || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{user.fullName || user.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-300">{user.email}</td>
                    <td className="px-4 py-3 text-green-400 font-bold">
                      {user.balance} ₽
                    </td>
                    <td className="px-4 py-3">
                      {user.streamerVerified ? (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded-full">
                          <FiCheckCircle className="text-blue-400 text-xs" />
                          <span className="text-xs text-blue-400">
                            Верифицированный стример
                          </span>
                        </div>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400">
                          Не верифицирован
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="inline-flex p-2 text-blue-400 hover:text-blue-300 rounded-lg hover:bg-white/5"
                        title="Подробнее"
                      >
                        <FiEye />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && users.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              Нет пользователей
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
