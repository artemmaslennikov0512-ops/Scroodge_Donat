"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FiMessageCircle, FiX, FiSend } from "react-icons/fi";

export type SupportMessageItem = {
  id: string;
  body: string;
  role: string;
  createdAt: string;
};

export default function SupportChatWidget({
  isOpen,
  onClose,
  onOpen,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}) {
  const [messages, setMessages] = useState<SupportMessageItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetch("/api/support/messages");
      if (!res.ok) {
        if (res.status === 401) return;
        if (!silent) throw new Error("Не удалось загрузить сообщения");
        return;
      }
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchMessages(false);
  }, [isOpen]);

  // Обновление при возврате на вкладку и по таймеру (без мигания «Загрузка»)
  useEffect(() => {
    if (!isOpen) return;
    const onRefresh = () => fetchMessages(true);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") onRefresh();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    const interval = setInterval(onRefresh, 15000);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Не удалось отправить");
      }
      setInput("");
      await fetchMessages();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка отправки");
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const avatarLetter = (role: string) => (role === "support" ? "С" : "В");

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition z-50"
      >
        <FiMessageCircle className="text-2xl" />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] bg-[#1a1a2e] rounded-2xl border border-pink-500/40 shadow-2xl z-50 flex flex-col"
    >
      <div className="p-4 border-b border-pink-500/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-white font-medium">Поддержка онлайн</span>
        </div>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
          <FiX />
        </button>
      </div>
      <div className="h-96 p-4 overflow-y-auto flex-1">
        {error && (
          <p className="text-red-400 text-sm mb-2" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <p className="text-gray-400 text-sm">Загрузка...</p>
        ) : (
          <div className="space-y-4">
            {messages.length === 0 && (
              <p className="text-gray-500 text-sm">
                Напишите сообщение — мы ответим в течение 24 часов.
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "support" && (
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center text-white text-sm shrink-0">
                    {avatarLetter(msg.role)}
                  </div>
                )}
                <div
                  className={`flex-1 max-w-[85%] rounded-lg p-3 ${
                    msg.role === "support"
                      ? "bg-pink-600/20"
                      : "bg-blue-600/20"
                  }`}
                >
                  <p className="text-white text-sm whitespace-pre-wrap break-words">
                    {msg.body}
                  </p>
                  <span className="text-xs text-gray-500 mt-1 block">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm shrink-0">
                    {avatarLetter(msg.role)}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-pink-500/40"
      >
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Введите сообщение..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={2000}
            disabled={sending}
            className="flex-1 px-4 py-2 bg-black/30 border border-pink-500/40 rounded-lg text-white placeholder-gray-500 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="w-10 h-10 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-50 hover:opacity-90 transition"
          >
            <FiSend />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
