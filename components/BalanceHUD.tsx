"use client";

import { ReactNode } from "react";

interface BalanceHUDProps {
  balance: number;
  className?: string;
  /** Слот для кнопок (Ссылка, Вывести) */
  actions?: ReactNode;
}

export function BalanceHUD({ balance, className = "", actions }: BalanceHUDProps) {
  const formatted = balance.toLocaleString("ru-RU");

  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-black/60 backdrop-blur-sm ${className}`}
      style={{
        border: "1px solid rgba(34, 211, 238, 0.5)",
        boxShadow:
          "0 0 20px rgba(34, 211, 238, 0.2), inset 0 0 0 1px rgba(34, 211, 238, 0.08)",
      }}
    >
      {/* Угловые скобки в стиле HUD */}
      <div
        className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-cyan-400"
        style={{ boxShadow: "0 0 12px rgba(34, 211, 238, 0.6)" }}
      />
      <div
        className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-cyan-400"
        style={{ boxShadow: "0 0 12px rgba(34, 211, 238, 0.6)" }}
      />
      <div
        className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-cyan-400"
        style={{ boxShadow: "0 0 12px rgba(34, 211, 238, 0.6)" }}
      />
      <div
        className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-cyan-400"
        style={{ boxShadow: "0 0 12px rgba(34, 211, 238, 0.6)" }}
      />

      {/* Лёгкая сканлайн-текстура */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.04]"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)",
        }}
      />

      <div className="relative z-0 px-6 py-5 sm:px-8 sm:py-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
          BALANCE
        </p>
        <p
          className="font-mono text-3xl font-bold tabular-nums text-cyan-400 sm:text-4xl md:text-5xl"
          style={{
            textShadow: "0 0 24px rgba(34, 211, 238, 0.6), 0 0 48px rgba(34, 211, 238, 0.3)",
          }}
        >
          {formatted}
          <span className="ml-2 text-2xl text-cyan-300/90 sm:text-3xl md:text-4xl">₽</span>
        </p>

        {actions && (
          <>
            <div className="my-4 border-t border-gray-600/60" />
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          </>
        )}
      </div>
    </div>
  );
}
