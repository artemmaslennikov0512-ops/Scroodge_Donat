"use client";

import { motion } from "framer-motion";
import Image from "next/image";

type ScroogeBalanceCardProps = {
  balance: number;
  currency?: string;
  className?: string;
  /** Дополнительные действия (кнопки) */
  actions?: React.ReactNode;
  /** Классы для текста баланса (размер, цвет) */
  textClassName?: string;
  /** Позиция текста в % или px — подберите под своё изображение (F12 → меняйте top/left) */
  textPosition?: { top: string; left: string };
};

const DEFAULT_TEXT_POSITION = { top: "65%", left: "50%" };

export function ScroogeBalanceCard({
  balance,
  currency = "₽",
  className = "",
  actions,
  textClassName = "",
  textPosition = DEFAULT_TEXT_POSITION,
}: ScroogeBalanceCardProps) {
  const formatted = balance.toLocaleString("ru-RU") + (currency ? ` ${currency}` : "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border-2 border-amber-800/50 bg-gradient-to-br from-amber-950/40 to-stone-900 ${className}`}
      style={{
        boxShadow: "0 20px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(212,175,55,0.1)",
      }}
    >
      {/* Картинка: сейф со Скруджем и купюрой (путь: public/images/scrooge-safe-bill.png) */}
      <div className="relative w-full min-h-[240px] sm:min-h-[280px] md:min-h-[320px]">
        <Image
          src="/images/scrooge-safe-bill.png"
          alt="Scrooge Donat — баланс"
          fill
          className="object-contain object-center block"
          sizes="(max-width: 768px) 100vw, 800px"
          priority
        />
        {/* Текст баланса поверх купюры. Позиция настраивается через textPosition (%, px). */}
        <div
          className={`absolute whitespace-nowrap font-bold tabular-nums pointer-events-none ${textClassName || "text-xl sm:text-2xl md:text-3xl text-amber-900"}`}
          style={{
            top: textPosition.top,
            left: textPosition.left,
            transform: "translate(-50%, -50%)",
            textShadow: "0 1px 2px rgba(255,255,255,0.8)",
          }}
        >
          {formatted}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center justify-center gap-2 p-4 bg-black/20 border-t border-amber-800/30">
          {actions}
        </div>
      )}
    </motion.div>
  );
}
