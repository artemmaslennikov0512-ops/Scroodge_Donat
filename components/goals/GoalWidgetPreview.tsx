"use client";

import GoalWidgetStyled, { type GoalDisplaySettings } from "./GoalWidgetStyled";

/** Фиксированная дата для превью, чтобы сервер и клиент рендерили одинаково (избежание hydration mismatch). */
const SAMPLE_END_DATE = new Date("2025-04-15T12:00:00Z");

const SAMPLE_GOAL = {
  title: "Новая камера",
  description: "Соберём на оборудование для стрима",
  currentAmount: 12500,
  targetAmount: 50000,
  endDate: SAMPLE_END_DATE,
  currency: "₽",
};

function getPositionClasses(position: string): string {
  switch (position) {
    case "top-left":
      return "top-2 left-2";
    case "top-right":
      return "top-2 right-2";
    case "bottom-left":
      return "bottom-2 left-2";
    case "bottom-right":
      return "bottom-2 right-2";
    case "center":
      return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
    default:
      return "bottom-2 right-2";
  }
}

interface GoalWidgetPreviewProps {
  settings: GoalDisplaySettings;
}

/**
 * Превью виджета цели: как он будет выглядеть на стриме при текущих настройках.
 */
export default function GoalWidgetPreview({ settings }: GoalWidgetPreviewProps) {
  const position = settings.position ?? "bottom-right";

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-black/40 overflow-hidden">
      <div className="px-3 py-2 border-b border-cyan-500/20 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden />
        <span className="text-xs font-medium text-gray-400">
          Как будет выглядеть виджет цели
        </span>
      </div>
      <div className="relative w-full aspect-video min-h-[140px] bg-gray-900/80 rounded-b-xl" aria-hidden>
        <div
          className={`absolute max-w-[90%] w-56 ${getPositionClasses(position)}`}
        >
          <GoalWidgetStyled
            title={SAMPLE_GOAL.title}
            description={SAMPLE_GOAL.description}
            currentAmount={SAMPLE_GOAL.currentAmount}
            targetAmount={SAMPLE_GOAL.targetAmount}
            endDate={SAMPLE_GOAL.endDate}
            currency={SAMPLE_GOAL.currency}
            display={settings}
          />
        </div>
      </div>
    </div>
  );
}
