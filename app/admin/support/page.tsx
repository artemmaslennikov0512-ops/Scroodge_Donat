"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiMessageCircle, FiChevronRight } from "react-icons/fi";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface Ticket {
  userId: string;
  user: { id: string; name: string; email: string; username: string } | null;
  lastMessage: { body: string; role: string; createdAt: string } | null;
  messageCount: number;
}

export default function AdminSupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
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
    fetch("/api/admin/support/tickets", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { tickets: [] }))
      .then((data) => setTickets(Array.isArray(data.tickets) ? data.tickets : []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Поддержка</h1>
      <p className="text-gray-400 text-sm mb-6">
        Один пользователь — одна заявка. Откройте заявку, чтобы видеть чат и отвечать.
      </p>

      <div className="bg-black/30 backdrop-blur border border-cyan-500/40 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Загрузка...</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            Пока нет заявок. Сообщения появятся, когда пользователи напишут в чат поддержки.
          </div>
        ) : (
          <ul className="divide-y divide-cyan-500/20">
            {tickets.map((t) => (
              <li key={t.userId}>
                <Link
                  href={`/admin/support/${t.userId}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-cyan-500/5 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500/80 to-pink-600/80 flex items-center justify-center text-white shrink-0">
                    <FiMessageCircle className="text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">
                      {t.user?.name ?? "—"}
                    </div>
                    <div className="text-gray-400 text-sm truncate">
                      {t.user?.email ?? t.user?.username ?? "—"}
                    </div>
                    {t.lastMessage && (
                      <div className="text-gray-500 text-sm mt-1 truncate">
                        {t.lastMessage.body.slice(0, 80)}
                        {t.lastMessage.body.length > 80 ? "…" : ""}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-gray-500 text-xs">
                      {t.lastMessage
                        ? format(new Date(t.lastMessage.createdAt), "dd.MM.yyyy HH:mm", {
                            locale: ru,
                          })
                        : "—"}
                    </div>
                    <div className="text-cyan-400 text-xs mt-1">
                      {t.messageCount} сообщ.
                    </div>
                  </div>
                  <FiChevronRight className="text-gray-500 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
