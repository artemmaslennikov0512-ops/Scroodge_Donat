"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";

export interface GoalFormData {
  title: string;
  description: string;
  targetAmount: number;
  endDate: string;
  isActive?: boolean;
}

interface GoalCreatorProps {
  goal?: {
    id: string;
    title: string;
    description: string | null;
    targetAmount: number;
    currentAmount?: number;
    endDate: string | null;
    isActive?: boolean;
  } | null;
  onSave: (data: GoalFormData) => Promise<void>;
  onClose: () => void;
  /** Если true, рендерится только форма без модального окна (для страницы редактирования). */
  inline?: boolean;
}

export default function GoalCreator({ goal, onSave, onClose, inline = false }: GoalCreatorProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description ?? "");
      setTargetAmount(String(goal.targetAmount));
      setEndDate(goal.endDate ? new Date(goal.endDate).toISOString().slice(0, 10) : "");
      setIsActive(goal.isActive ?? true);
    }
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const titleTrim = title.trim();
    if (!titleTrim) {
      setError("Введите название цели");
      return;
    }
    const target = parseFloat(targetAmount.replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(target) || target <= 0) {
      setError("Укажите корректную целевую сумму");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title: titleTrim,
        description: description.trim(),
        targetAmount: target,
        endDate: endDate || "",
        isActive,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="goal-title" className="block text-gray-300 text-sm font-medium mb-1">
                Название цели *
              </label>
              <input
                id="goal-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-pink-500/40 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                placeholder="Например: Новый компьютер"
                required
              />
            </div>

            <div>
              <label htmlFor="goal-desc" className="block text-gray-300 text-sm font-medium mb-1">
                Описание (необязательно)
              </label>
              <textarea
                id="goal-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-black/30 border border-pink-500/40 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 resize-none"
                placeholder="Кратко опишите, на что пойдут средства"
              />
            </div>

            <div>
              <label htmlFor="goal-target" className="block text-gray-300 text-sm font-medium mb-1">
                Целевая сумма (₽) *
              </label>
              <input
                id="goal-target"
                type="text"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-pink-500/40 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                placeholder="150000"
                required
              />
            </div>

            <div>
              <label htmlFor="goal-end" className="block text-gray-300 text-sm font-medium mb-1">
                Дата окончания (необязательно)
              </label>
              <input
                id="goal-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-pink-500/40 rounded-lg text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            {goal && (
              <div className="flex items-center gap-2">
                <input
                  id="goal-active"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-gray-600 bg-black/30 text-pink-400 focus:ring-pink-500"
                />
                <label htmlFor="goal-active" className="text-gray-300 text-sm">
                  Цель активна (отображается на странице доната)
                </label>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Сохранение..." : goal ? "Сохранить" : "Создать цель"}
              </button>
            </div>
          </form>
  );

  if (inline) {
    return formContent;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#1a1a2e] rounded-2xl border border-pink-500/40 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-pink-500/40 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {goal ? "Редактировать цель" : "Новая цель"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
              aria-label="Закрыть"
            >
              <FiX className="text-xl" />
            </button>
          </div>
          {formContent}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
