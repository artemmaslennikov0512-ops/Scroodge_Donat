"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheck,
  FiX,
  FiEye,
  FiDownload,
  FiSearch,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";

interface Verification {
  id: string;
  user: {
    id: string;
    username: string | null;
    email: string | null;
    name: string | null;
  };
  fullName: string;
  telegram: string | null;
  phone: string | null;
  status: string;
  submittedAt: string;
  passportFile: string;
  selfieFile: string;
  adminComment: string | null;
}

export default function VerificationsAdmin() {
  const router = useRouter();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Verification | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    fetch("/api/admin/check")
      .then((res) => res.json())
      .then((data) => {
        if (!data?.admin) router.replace("/admin/login");
      })
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  useEffect(() => {
    loadVerifications();
  }, [filter]);

  const loadVerifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/verifications?status=${filter}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error ?? (res.status === 403 ? "Доступ запрещен" : "Ошибка загрузки");
        throw new Error(msg);
      }
      setVerifications(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки");
      setVerifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (
    id: string,
    action: "approve" | "reject"
  ) => {
    try {
      const res = await fetch(`/api/admin/verify-streamer/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          comment: action === "reject" ? comment : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      toast.success(
        action === "approve" ? "Заявка одобрена" : "Заявка отклонена"
      );
      setShowModal(false);
      setSelected(null);
      setComment("");
      loadVerifications();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const filtered =
    search.trim() === ""
      ? verifications
      : verifications.filter(
          (v) =>
            v.fullName.toLowerCase().includes(search.toLowerCase()) ||
            v.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
            v.user?.username?.toLowerCase().includes(search.toLowerCase())
        );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">
        Модерация верификации
      </h1>

      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-cyan-500/40 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Поиск по имени или email..."
              className="w-full pl-10 pr-4 py-2 bg-black/30 border border-cyan-500/40 rounded-lg text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                filter === "pending"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-white/10 text-gray-400"
              }`}
            >
              <FiClock />
              Ожидают
            </button>
            <button
              type="button"
              onClick={() => setFilter("approved")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                filter === "approved"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-white/10 text-gray-400"
              }`}
            >
              <FiCheckCircle />
              Одобренные
            </button>
            <button
              type="button"
              onClick={() => setFilter("rejected")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                filter === "rejected"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-white/10 text-gray-400"
              }`}
            >
              <FiXCircle />
              Отклоненные
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Загрузка заявок...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl border border-cyan-500/40">
            <FiAlertCircle className="text-4xl text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Нет заявок</p>
          </div>
        ) : (
          filtered.map((v) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-cyan-500/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center text-2xl text-white">
                    {(v.user?.username || v.fullName || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">
                        {v.fullName}
                      </h3>
                      <span className="text-sm text-gray-500">
                        @{v.user?.username ?? "—"}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          v.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : v.status === "approved"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {v.status === "pending"
                          ? "Ожидает"
                          : v.status === "approved"
                            ? "Одобрено"
                            : "Отклонено"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Email: </span>
                        <span className="text-gray-300">{v.user?.email ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Телефон: </span>
                        <span className="text-gray-300">{v.phone ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Telegram: </span>
                        <span className="text-gray-300">{v.telegram ?? "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(v);
                      setComment("");
                      setShowModal(true);
                    }}
                    className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                    title="Просмотр"
                  >
                    <FiEye />
                  </button>
                  {v.passportFile ? (
                    <a
                      href={v.passportFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30"
                      title="Скачать паспорт"
                    >
                      <FiDownload />
                    </a>
                  ) : (
                    <span className="p-2 text-gray-500 cursor-default" title="Файл удалён с сервера">
                      <FiDownload />
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showModal && selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1a1a2e] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-4">
                Модерация заявки
              </h2>
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Пользователь</label>
                    <p className="text-white">{selected.user?.username ?? "—"}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Email</label>
                    <p className="text-white">{selected.user?.email ?? "—"}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Полное имя</label>
                    <p className="text-white">{selected.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Telegram</label>
                    <p className="text-white">{selected.telegram ?? "—"}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Документы</label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {selected.passportFile ? (
                      <a
                        href={selected.passportFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 bg-cyan-500/20 border border-cyan-500/40 rounded-lg text-center hover:bg-cyan-500/30"
                      >
                        <FiEye className="mx-auto mb-2" />
                        <span className="text-sm">Скан паспорта</span>
                      </a>
                    ) : (
                      <div className="p-4 bg-gray-500/10 border border-gray-500/30 rounded-lg text-center text-gray-500">
                        <span className="text-sm">Скан паспорта удалён с сервера</span>
                      </div>
                    )}
                    {selected.selfieFile ? (
                      <a
                        href={selected.selfieFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 bg-cyan-500/20 border border-cyan-500/40 rounded-lg text-center hover:bg-cyan-500/30"
                      >
                        <FiEye className="mx-auto mb-2" />
                        <span className="text-sm">Селфи с паспортом</span>
                      </a>
                    ) : (
                      <div className="p-4 bg-gray-500/10 border border-gray-500/30 rounded-lg text-center text-gray-500">
                        <span className="text-sm">Селфи удалён с сервера</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Комментарий (при отказе обязателен)
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2 bg-black/30 border border-cyan-500/40 rounded-lg text-white"
                    placeholder="Причина отказа..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleVerify(selected.id, "approve")}
                  className="flex-1 min-w-[120px] py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-bold"
                >
                  Одобрить
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!comment.trim()) {
                      toast.error("Укажите причину отказа");
                      return;
                    }
                    handleVerify(selected.id, "reject");
                  }}
                  className="flex-1 min-w-[120px] py-3 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg font-bold"
                >
                  Отклонить
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-white/10 rounded-lg hover:bg-white/20"
                >
                  Закрыть
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
