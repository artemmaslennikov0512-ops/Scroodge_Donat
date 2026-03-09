"use client";

export type GoalDisplaySettings = {
  position?: string;
  backgroundColor?: string;
  textColor?: string;
  barColor?: string;
  fontFamily?: string;
  fontSize?: number;
  showTitle?: boolean;
  showDescription?: boolean;
  showEndDate?: boolean;
  borderRadius?: number;
};

type GoalWidgetStyledProps = {
  title: string;
  description: string | null;
  currentAmount: number;
  targetAmount: number;
  endDate: Date | null;
  currency: string;
  display: GoalDisplaySettings;
  className?: string;
};

export default function GoalWidgetStyled({
  title,
  description,
  currentAmount,
  targetAmount,
  endDate,
  currency,
  display,
  className = "",
}: GoalWidgetStyledProps) {
  const percent = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
  const bg = display.backgroundColor ?? "#1f2937";
  const text = display.textColor ?? "#ffffff";
  const bar = display.barColor ?? "#ec4899";
  const font = display.fontFamily ?? "Inter";
  const size = display.fontSize ?? 16;
  const radius = display.borderRadius ?? 12;

  return (
    <div
      className={className}
      style={{
        backgroundColor: bg,
        color: text,
        fontFamily: `${font}, sans-serif`,
        fontSize: size,
        padding: "0.75rem 1rem",
        borderRadius: radius,
        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)",
      }}
    >
      {display.showTitle !== false && title && (
        <h3 className="font-medium mb-1" style={{ fontSize: "1.05em" }}>
          {title}
        </h3>
      )}
      {display.showDescription !== false && description && (
        <p className="opacity-90 mb-2" style={{ fontSize: "0.9em" }}>
          {description}
        </p>
      )}
      <div className="flex justify-between mb-1" style={{ fontSize: "0.95em" }}>
        <span className="opacity-90">
          {currentAmount.toLocaleString("ru-RU")} {currency} / {targetAmount.toLocaleString("ru-RU")} {currency}
        </span>
        <span className="font-medium" style={{ color: bar }}>
          {Math.round(percent)}%
        </span>
      </div>
      <div
        className="w-full h-3 rounded-full overflow-hidden bg-black/20"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: bar }}
        />
      </div>
      {display.showEndDate !== false && endDate && (
        <p className="text-xs opacity-75 mt-1">
          До {new Date(endDate).toLocaleDateString("ru-RU")}
        </p>
      )}
    </div>
  );
}
