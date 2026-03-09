"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiCalendar,
  FiTarget,
  FiCopy,
  FiExternalLink,
} from "react-icons/fi";
import toast from "react-hot-toast";
import GoalPreview from "@/components/goals/GoalPreview";
import GoalCreator from "@/components/goals/GoalCreator";
import GoalProgress from "@/components/goals/GoalProgress";
import GoalWidgetPreview from "@/components/goals/GoalWidgetPreview";
import type { GoalDisplaySettings } from "@/components/goals/GoalWidgetStyled";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  endDate: string | null;
  isActive: boolean;
  isCompleted: boolean;
}

export default function GoalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [donateLinkId, setDonateLinkId] = useState<string | null>(null);
  const [goalDisplay, setGoalDisplay] = useState<GoalDisplaySettings | null>(null);
  const [goalDisplaySaving, setGoalDisplaySaving] = useState(false);
  const [donateBaseUrl, setDonateBaseUrl] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated") {
      fetchGoals();
      fetch("/api/dashboard/stats", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : Promise.reject(r)))
        .then((d: { donateLinkId?: string | null }) => {
          const linkId = d?.donateLinkId ?? null;
          setDonateLinkId(linkId);
          if (linkId && typeof window !== "undefined") {
            setDonateBaseUrl(`${window.location.origin}/d/${linkId}`);
          } else {
            setDonateBaseUrl("");
          }
        })
        .catch(() => {
          setDonateLinkId(null);
          setDonateBaseUrl("");
        });
      fetch("/api/dashboard/goal-display-settings", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : Promise.reject(r)))
        .then((d: GoalDisplaySettings) => setGoalDisplay(d))
        .catch(() => setGoalDisplay(null));
    }
  }, [status, router]);

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/goals");
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        toast.error(typeof data?.error === "string" ? data.error : "Не удалось загрузить цели");
        setGoals([]);
        return;
      }
      setGoals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch goals", error);
      toast.error("Не удалось загрузить цели");
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (goalData: {
    title: string;
    description: string;
    targetAmount: number;
    endDate: string;
    isActive?: boolean;
  }) => {
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: goalData.title,
        description: goalData.description || null,
        targetAmount: goalData.targetAmount,
        endDate: goalData.endDate || null,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Ошибка создания цели");
    }
    await fetchGoals();
    setShowCreator(false);
    toast.success("Цель создана");
  };

  const handleUpdate = async (
    id: string,
    goalData: {
      title: string;
      description: string;
      targetAmount: number;
      endDate: string;
      isActive?: boolean;
    }
  ) => {
    const res = await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: goalData.title,
        description: goalData.description || null,
        targetAmount: goalData.targetAmount,
        endDate: goalData.endDate || null,
        isActive: goalData.isActive,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Ошибка сохранения");
    }
    await fetchGoals();
    setEditingGoal(null);
    toast.success("Цель обновлена");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить цель?")) return;
    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchGoals();
        toast.success("Цель удалена");
      } else {
        toast.error("Не удалось удалить цель");
      }
    } catch (error) {
      console.error("Failed to delete goal", error);
      toast.error("Ошибка удаления");
    }
  };


  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Загрузка целей...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-6xl space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-3xl font-bold text-white">Цели сбора</h1>
        </div>

        <p className="text-sm text-gray-400">
          Активную цель можно вывести на стрим в OBS (полоска прогресса). Ссылку для источника «Браузер» возьмите в{" "}
          <Link
            href="/dashboard/settings?section=integrations"
            className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
          >
            Настройки → Интеграции
            <FiExternalLink className="w-3.5 h-3.5" />
          </Link>
          .
        </p>

        {/* Настройки виджета цели для стрима: визуал + превью */}
        <details className="panel-hud group">
          <summary className="p-4 cursor-pointer list-none flex items-center justify-between text-white font-medium">
            <span>Виджет цели на стриме</span>
            <span className="text-gray-400 text-sm font-normal group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start px-4 pb-4">
            <div className="space-y-4 min-w-0">
              <p className="text-sm text-gray-400">
                Настройте, как полоска цели будет выглядеть в OBS. Превью справа закреплено — меняйте настройки слева и сразу смотрите результат.
              </p>
              {goalDisplay === null ? (
                <p className="text-gray-500 text-sm">Загрузка настроек…</p>
              ) : (
                <>
                  <div className="p-5 space-y-4 rounded-lg bg-black/20">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Позиция на экране</label>
                      <select
                        value={goalDisplay.position ?? "bottom-right"}
                        onChange={(e) => setGoalDisplay((d) => (d ? { ...d, position: e.target.value } : d))}
                        className="w-full px-3 py-2 text-sm bg-black/30 border border-cyan-500/40 rounded-lg text-white"
                      >
                        <option value="top-left">Сверху слева</option>
                        <option value="top-right">Сверху справа</option>
                        <option value="bottom-left">Снизу слева</option>
                        <option value="bottom-right">Снизу справа</option>
                        <option value="center">Центр</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Фон виджета</label>
                        <input
                          type="color"
                          value={goalDisplay.backgroundColor ?? "#1f2937"}
                          onChange={(e) => setGoalDisplay((d) => (d ? { ...d, backgroundColor: e.target.value } : d))}
                          className="w-full h-9 bg-transparent border border-cyan-500/40 rounded-lg cursor-pointer block"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Цвет текста</label>
                        <input
                          type="color"
                          value={goalDisplay.textColor ?? "#ffffff"}
                          onChange={(e) => setGoalDisplay((d) => (d ? { ...d, textColor: e.target.value } : d))}
                          className="w-full h-9 bg-transparent border border-cyan-500/40 rounded-lg cursor-pointer block"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Цвет полоски прогресса</label>
                        <input
                          type="color"
                          value={goalDisplay.barColor ?? "#ec4899"}
                          onChange={(e) => setGoalDisplay((d) => (d ? { ...d, barColor: e.target.value } : d))}
                          className="w-full h-9 bg-transparent border border-cyan-500/40 rounded-lg cursor-pointer block"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Скругление углов</label>
                        <input
                          type="number"
                          min={0}
                          max={24}
                          value={goalDisplay.borderRadius ?? 12}
                          onChange={(e) => setGoalDisplay((d) => (d ? { ...d, borderRadius: Number(e.target.value) || 0 } : d))}
                          className="w-full px-3 py-2 text-sm bg-black/30 border border-cyan-500/40 rounded-lg text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Шрифт</label>
                        <select
                          value={goalDisplay.fontFamily ?? "Inter"}
                          onChange={(e) => setGoalDisplay((d) => (d ? { ...d, fontFamily: e.target.value } : d))}
                          className="w-full px-3 py-2 text-sm bg-black/30 border border-cyan-500/40 rounded-lg text-white"
                        >
                          <option value="Inter">Inter</option>
                          <option value="Arial">Arial</option>
                          <option value="Roboto">Roboto</option>
                          <option value="Montserrat">Montserrat</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Размер шрифта</label>
                        <input
                          type="number"
                          min={10}
                          max={32}
                          value={goalDisplay.fontSize ?? 16}
                          onChange={(e) => setGoalDisplay((d) => (d ? { ...d, fontSize: Number(e.target.value) || 16 } : d))}
                          className="w-full px-3 py-2 text-sm bg-black/30 border border-cyan-500/40 rounded-lg text-white"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={goalDisplay.showTitle !== false}
                          onChange={(e) => setGoalDisplay((d) => (d ? { ...d, showTitle: e.target.checked } : d))}
                        />
                        Показывать название
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={goalDisplay.showDescription !== false}
                          onChange={(e) => setGoalDisplay((d) => (d ? { ...d, showDescription: e.target.checked } : d))}
                        />
                        Показывать описание
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={goalDisplay.showEndDate !== false}
                          onChange={(e) => setGoalDisplay((d) => (d ? { ...d, showEndDate: e.target.checked } : d))}
                        />
                        Показывать дату окончания
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={goalDisplaySaving}
                    onClick={async () => {
                      setGoalDisplaySaving(true);
                      try {
                        const res = await fetch("/api/dashboard/goal-display-settings", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(goalDisplay),
                          credentials: "include",
                        });
                        if (res.ok) toast.success("Настройки виджета сохранены");
                        else toast.error("Не удалось сохранить");
                      } catch {
                        toast.error("Ошибка сохранения");
                      } finally {
                        setGoalDisplaySaving(false);
                      }
                    }}
                    className="px-5 py-2 bg-cyan-500 text-white text-sm font-medium rounded-lg hover:bg-cyan-400 disabled:opacity-50"
                  >
                    {goalDisplaySaving ? "Сохранение…" : "Сохранить настройки виджета"}
                  </button>
                </>
              )}
            </div>
            <div className="lg:sticky lg:top-4 min-w-0 shrink-0">
              {goalDisplay && (
                <GoalWidgetPreview settings={goalDisplay} />
              )}
            </div>
          </div>
        </details>

        {/* Две колонки: список целей слева, форма создания/редактирования справа — всё видно без прокрутки */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
          {/* Левая колонка: список целей */}
          <div className="space-y-4 min-w-0">
            {goals.length === 0 ? (
              <div className="panel-hud p-8 text-center">
                <FiTarget className="text-4xl text-gray-500 mx-auto mb-3" />
                <h3 className="text-lg text-white mb-2">У вас пока нет целей</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Нажмите «Создать цель» в панели справа
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.map((goal) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`panel-hud p-4 transition-all ${editingGoal?.id === goal.id ? "ring-2 ring-cyan-400" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-bold text-white mb-0.5 truncate">{goal.title}</h2>
                        {goal.description && (
                          <p className="text-gray-400 text-sm line-clamp-1">{goal.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-2 flex-wrap" suppressHydrationWarning>
                          <span>
                            Цель: {goal.targetAmount.toLocaleString()} {goal.currency === "RUB" ? "₽" : goal.currency}
                          </span>
                          <span>Собрано: {goal.currentAmount.toLocaleString()} ₽</span>
                          {goal.endDate && (
                            <span className="flex items-center gap-1">
                              <FiCalendar className="shrink-0" />
                              до {new Date(goal.endDate).toLocaleDateString("ru-RU")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingGoal(goal);
                            setShowCreator(false);
                          }}
                          className="p-2 border border-cyan-500/40 text-cyan-400 rounded-lg hover:bg-cyan-500/20"
                          title="Редактировать"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(goal.id)}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                          title="Удалить"
                        >
                          <FiTrash2 />
                        </button>
                        {donateLinkId && (
                          <Link
                            href={`/d/${donateLinkId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 border border-cyan-500/40 text-cyan-400 rounded-lg hover:bg-cyan-500/20"
                            title="Посмотреть на странице доната"
                          >
                            <FiEye />
                          </Link>
                        )}
                      </div>
                    </div>
                    <GoalProgress
                      current={goal.currentAmount}
                      target={goal.targetAmount}
                      currency={goal.currency === "RUB" ? "₽" : goal.currency}
                      showPercentage
                      className="mt-3"
                    />
                    {donateBaseUrl && (
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={donateBaseUrl}
                          className="flex-1 min-w-0 px-2 py-1.5 bg-black/40 border border-cyan-500/40 rounded text-xs text-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(donateBaseUrl);
                            toast.success("Ссылка скопирована");
                          }}
                          className="p-1.5 border border-gray-500/60 bg-gray-500/10 text-gray-300 rounded hover:bg-gray-500/20"
                          title="Копировать"
                        >
                          <FiCopy />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Правая колонка: форма создания/редактирования — всегда на виду */}
          <div className="lg:sticky lg:top-4">
            <div className="panel-hud p-0 overflow-hidden">
              <div className="p-4 border-b border-cyan-500/30 bg-black/20">
                <h2 className="text-lg font-bold text-white">
                  {editingGoal ? "Редактировать цель" : showCreator ? "Новая цель" : "Цель"}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {editingGoal || showCreator
                    ? "Изменения отобразятся в списке слева после сохранения."
                    : "Выберите цель из списка или создайте новую."}
                </p>
              </div>
              <div className="p-4 min-h-[200px]">
                {(showCreator || editingGoal) ? (
                  <GoalCreator
                    goal={editingGoal}
                    onSave={
                      editingGoal
                        ? (data) => handleUpdate(editingGoal.id, data)
                        : handleCreate
                    }
                    onClose={() => {
                      setShowCreator(false);
                      setEditingGoal(null);
                    }}
                    inline
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FiTarget className="text-4xl text-gray-500 mb-3" />
                    <p className="text-gray-400 text-sm mb-4">
                      Создайте цель или нажмите «Редактировать» у любой цели в списке
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreator(true);
                        setEditingGoal(null);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white font-medium rounded-lg hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition"
                    >
                      <FiPlus />
                      Создать цель
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Превью выбранной цели под формой */}
            {editingGoal && (
              <div className="mt-4 panel-hud p-4">
                <p className="text-sm text-gray-400 mb-2">Как будет выглядеть на странице доната:</p>
                <GoalPreview
                  title={editingGoal.title}
                  description={editingGoal.description}
                  current={editingGoal.currentAmount}
                  target={editingGoal.targetAmount}
                  endDate={editingGoal.endDate}
                  currency={editingGoal.currency === "RUB" ? "₽" : editingGoal.currency}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
