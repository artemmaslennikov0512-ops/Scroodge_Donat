"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";
import toast from "react-hot-toast";
import GoalCreator from "@/components/goals/GoalCreator";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  endDate: string | null;
  isActive: boolean;
}

export default function EditGoalPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetch(`/api/goals/${id}`)
      .then((res) => {
        if (res.status === 401) {
          router.replace("/login");
          return null;
        }
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        setGoal(data);
      })
      .catch(() => toast.error("Не удалось загрузить цель"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSave = async (data: {
    title: string;
    description: string;
    targetAmount: number;
    endDate: string;
    isActive?: boolean;
  }) => {
    if (!id) return;
    const res = await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.title,
        description: data.description || null,
        targetAmount: data.targetAmount,
        endDate: data.endDate || null,
        isActive: data.isActive,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Ошибка сохранения");
    }
    toast.success("Цель обновлена");
    router.push("/dashboard/goals");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  if (!id || !goal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] p-6">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-gray-400 mb-4">Цель не найдена</p>
          <Link
            href="/dashboard/goals"
            className="text-pink-400 hover:text-pink-300"
          >
            ← Вернуться к целям
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] p-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard/goals"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <FiArrowLeft />
          К списку целей
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-lg rounded-xl border border-pink-500/40 overflow-hidden"
        >
          <div className="p-6 border-b border-pink-500/40">
            <h1 className="text-2xl font-bold text-white">Редактировать цель</h1>
            <p className="text-gray-400 text-sm mt-1">{goal.title}</p>
          </div>
          <div className="p-6">
            <GoalCreator
              goal={goal}
              onSave={handleSave}
              onClose={() => router.push("/dashboard/goals")}
              inline
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
