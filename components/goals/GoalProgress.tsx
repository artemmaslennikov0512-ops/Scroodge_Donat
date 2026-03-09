"use client";

interface GoalProgressProps {
  /** Заголовок цели */
  title?: string;
  /** Описание (под заголовком) */
  description?: string | null;
  current: number;
  target: number;
  /** Дата окончания цели */
  endDate?: Date | null;
  currency?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "pink" | "amber" | "cyan";
}

export default function GoalProgress({
  title,
  description,
  current,
  target,
  endDate,
  currency = "₽",
  showPercentage = false,
  size = "md",
  className = "",
  variant = "cyan",
}: GoalProgressProps) {
  const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const heightClass = size === "sm" ? "h-2" : size === "lg" ? "h-4" : "h-3";
  const textSize = size === "lg" ? "text-base" : size === "sm" ? "text-xs" : "text-sm";
  const barGradient =
    variant === "cyan"
      ? "bg-cyan-500"
      : variant === "amber"
        ? "bg-gradient-to-r from-amber-400 to-yellow-500"
        : "bg-gradient-to-r from-pink-500 to-pink-600";
  const percentColor = variant === "cyan" ? "text-cyan-400" : variant === "amber" ? "text-amber-400" : "text-pink-400";

  return (
    <div className={className}>
      {title && <h3 className="text-lg font-medium text-white mb-1">{title}</h3>}
      {description && <p className="text-gray-400 text-sm mb-2">{description}</p>}
      <div className={`flex justify-between ${textSize} mb-1`}>
        <span className="text-gray-400">
          {current.toLocaleString()} {currency} / {target.toLocaleString()} {currency}
        </span>
        {showPercentage && (
          <span className={`${percentColor} font-medium`}>{Math.round(percent)}%</span>
        )}
      </div>
      <div
        className={`w-full ${heightClass} bg-gray-700 rounded-full overflow-hidden`}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full ${barGradient} rounded-full transition-all duration-500 ${heightClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {endDate && (
        <p className="text-xs text-gray-500 mt-1">
          До {new Date(endDate).toLocaleDateString("ru-RU")}
        </p>
      )}
    </div>
  );
}
