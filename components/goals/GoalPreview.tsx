"use client";

import { FiCalendar } from "react-icons/fi";
import GoalProgress from "./GoalProgress";

interface GoalPreviewProps {
  title: string;
  description: string | null;
  current: number;
  target: number;
  endDate: string | null;
  currency?: string;
  className?: string;
}

export default function GoalPreview({
  title,
  description,
  current,
  target,
  endDate,
  currency = "₽",
  className = "",
}: GoalPreviewProps) {
  return (
    <div
      className={`bg-gradient-to-r from-pink-600/10 to-pink-500/10 rounded-xl p-6 border border-pink-500/40 max-w-md ${className}`}
    >
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-400 mb-4">{description}</p>}
      <GoalProgress
        current={current}
        target={target}
        currency={currency}
        showPercentage
        size="md"
      />
      {endDate && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
          <FiCalendar className="shrink-0" />
          До {new Date(endDate).toLocaleDateString("ru-RU")}
        </div>
      )}
    </div>
  );
}
