"use client";

import { motion } from "framer-motion";

export interface AlertInlinePreviewSettings {
  enabled?: boolean;
  animation?: string;
  position?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  showName?: boolean;
  showAmount?: boolean;
  showMessage?: boolean;
  messageTemplate?: string | null;
  imageUrl?: string | null;
  textOutline?: string;
  animationSpeed?: number;
}

const SAMPLE_NAME = "Аноним";
const SAMPLE_AMOUNT = 500;
const SAMPLE_MESSAGE = "Спасибо за стрим!";

function formatPreviewMessage(
  template: string | null | undefined,
  name: string,
  amount: number,
  message: string
): string {
  if (template) {
    return template
      .replace(/\{name\}/g, name)
      .replace(/\{amount\}/g, `${amount.toLocaleString("ru-RU")} ₽`)
      .replace(/\{message\}/g, message);
  }
  return `${name} задонатил ${amount.toLocaleString("ru-RU")} ₽!`;
}

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

const TEXT_OUTLINE_STYLE: Record<string, { textShadow?: string }> = {
  thin: {
    textShadow: "0 0 1px #000, 1px 0 0 #000, -1px 0 0 #000, 0 1px 0 #000, 0 -1px 0 #000, 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
  },
  bold: {
    textShadow: "0 0 3px #000, 0 0 3px #000, 2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000",
  },
  none: {},
};

function getAnimationVariant(animation: string, speed: number) {
  const t = speed > 0 ? 0.25 / speed : 0.25;
  const transition = { duration: t };
  switch (animation) {
    case "slide":
      return { initial: { x: -20, opacity: 0 }, animate: { x: 0, opacity: 1 }, transition };
    case "fade":
      return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition };
    case "bounce":
      return { initial: { y: -12, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { type: "spring" as const, bounce: 0.5, duration: t } };
    default:
      return { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition };
  }
}

interface AlertInlinePreviewProps {
  settings: AlertInlinePreviewSettings;
}

/**
 * Живое превью алерта: отображает, как алерт будет выглядеть при текущих настройках.
 * Позиция, цвета, шрифт и содержимое обновляются при изменении настроек.
 */
export default function AlertInlinePreview({ settings }: AlertInlinePreviewProps) {
  const position = settings.position ?? "bottom-right";
  const animation = settings.animation ?? "default";
  const speed = settings.animationSpeed ?? 1;
  const variant = getAnimationVariant(animation, speed);
  const textOutlineStyle = TEXT_OUTLINE_STYLE[settings.textOutline ?? "none"] ?? TEXT_OUTLINE_STYLE.none;
  const displayMessage = formatPreviewMessage(
    settings.messageTemplate,
    SAMPLE_NAME,
    SAMPLE_AMOUNT,
    SAMPLE_MESSAGE
  );

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-black/40 overflow-hidden">
      <div className="px-3 py-2 border-b border-cyan-500/20 flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${settings.enabled !== false ? "bg-green-500" : "bg-gray-500"}`}
          aria-hidden
        />
        <span className="text-xs font-medium text-gray-400">
          {settings.enabled !== false
            ? "Как будет выглядеть алерт"
            : "Алерт выключен — включите для превью"}
        </span>
      </div>
      {/* Мини-экран с алертом в нужной позиции */}
      <div
        className={`relative w-full aspect-video min-h-[140px] bg-gray-900/80 rounded-b-xl ${settings.enabled === false ? "opacity-50" : ""}`}
        aria-hidden
      >
        <motion.div
          key={`${position}-${animation}-${settings.backgroundColor ?? ""}-${settings.fontSize ?? 16}`}
          initial={variant.initial}
          animate={variant.animate}
          transition={variant.transition}
          className={`absolute max-w-[85%] w-44 ${getPositionClasses(position)}`}
          style={{
            backgroundColor: settings.backgroundColor || "#8b5cf6",
            color: settings.textColor || "#ffffff",
            fontFamily: `${settings.fontFamily || "Inter"}, sans-serif`,
            fontSize: `${Math.min(20, Math.max(10, settings.fontSize ?? 16))}px`,
            padding: "0.5rem 0.75rem",
            borderRadius: "0.5rem",
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.4)",
            ...textOutlineStyle,
          }}
        >
          <div className="flex items-center gap-2">
            {settings.imageUrl && (
              <img
                src={settings.imageUrl}
                alt=""
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            )}
            <div className="min-w-0 flex-1" style={textOutlineStyle}>
              {settings.showName !== false && (
                <div className="font-bold truncate text-current" style={{ fontSize: "0.9em" }}>
                  {SAMPLE_NAME}
                </div>
              )}
              {settings.showAmount !== false && (
                <div className="font-semibold text-current" style={{ fontSize: "1em" }}>
                  {SAMPLE_AMOUNT.toLocaleString("ru-RU")} ₽
                </div>
              )}
              {settings.showMessage !== false && (
                <div
                  className="truncate opacity-90 text-current"
                  style={{ fontSize: "0.8em" }}
                  title={displayMessage}
                >
                  {displayMessage}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
