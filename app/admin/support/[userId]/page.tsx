"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiSend } from "react-icons/fi";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface Message {
  id: string;
  body: string;
  role: string;
  createdAt: string;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  username: string;
}

export default function AdminSupportTicketPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchChat = async () => {
    if (!userId) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/support/tickets/${userId}/messages`, {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 403) router.replace("/admin/login");
        throw new Error("Не удалось загрузить чат");
      }
      const data = await res.json();
      setMessages(data.messages ?? []);
      setUser(data.user ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/admin/check")
      .then((res) => res.json())
      .then((data) => {
        if (!data?.admin) router.replace("/admin/login");
      })
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  useEffect(() => {
    if (userId) fetchChat();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const onVisible = () => fetchChat();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") onVisible();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !userId || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/support/tickets/${userId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось отправить");
      setInput("");
      setMessages((prev) => [...prev, data.message]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка отправки");
    } finally {
      setSending(false);
    }
  };

  if (!userId) {
    return (
      <div>
        <p className="text-gray-400">Не указан пользователь.</p>
        <Link href="/admin/support" className="text-cyan-400 hover:underline mt-4 inline-block">
          ← К списку заявок
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/support"
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm"
        >
          <FiArrowLeft /> К списку заявок
        </Link>
      </div>

      <div className="bg-black/30 backdrop-blur border border-cyan-500/40 rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-cyan-500/40">
          <h2 className="text-lg font-semibold text-white">
            Заявка: {user?.name ?? "—"}
          </h2>
          <p className="text-gray-400 text-sm">
            {user?.email ?? "—"} {user?.username ? `@${user.username}` : ""}
          </p>
        </div>

        <div className="h-[420px] overflow-y-auto p-4 space-y-4">
          {error && (
            <p className="text-red-400 text-sm" role="alert">
              {error}
            </p>
          )}
          {loading ? (
            <p className="text-gray-400">Загрузка...</p>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "support" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 flex items-center justify-center text-white text-sm shrink-0">
                      С
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      msg.role === "support"
                        ? "bg-pink-600/20"
                        : "bg-blue-600/20"
                    }`}
                  >
                    <p className="text-white text-sm whitespace-pre-wrap break-words">
                      {msg.body}
                    </p>
                    <span className="text-xs text-gray-500 mt-1 block">
                      {format(new Date(msg.createdAt), "dd.MM HH:mm", {
                        locale: ru,
                      })}
                    </span>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white text-sm shrink-0">
                      В
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <form
          onSubmit={sendReply}
          className="p-4 border-t border-cyan-500/40 flex gap-2"
        >
          <input
            type="text"
            placeholder="Ответ пользователю..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={2000}
            disabled={sending}
            className="flex-1 px-4 py-2 bg-black/30 border border-cyan-500/40 rounded-lg text-white placeholder-gray-500 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/40 rounded-lg text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-50 flex items-center gap-2"
          >
            <FiSend /> Отправить
          </button>
        </form>
      </div>
    </div>
  );
}
