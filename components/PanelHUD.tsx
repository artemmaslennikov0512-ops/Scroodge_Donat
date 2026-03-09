"use client";

import { ReactNode } from "react";

interface PanelHUDProps {
  children: ReactNode;
  className?: string;
}

/** Панель в стиле HUD: cyan-рамка, угловые скобки, тёмный фон (для ЛК) */
export function PanelHUD({ children, className = "" }: PanelHUDProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-black/60 backdrop-blur-sm ${className}`}
      style={{
        border: "1px solid rgba(34, 211, 238, 0.4)",
        boxShadow: "0 0 16px rgba(34, 211, 238, 0.12), inset 0 0 0 1px rgba(34, 211, 238, 0.06)",
      }}
    >
      <div
        className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-cyan-400/90"
        style={{ boxShadow: "0 0 8px rgba(34, 211, 238, 0.5)" }}
      />
      <div
        className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-cyan-400/90"
        style={{ boxShadow: "0 0 8px rgba(34, 211, 238, 0.5)" }}
      />
      <div
        className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-cyan-400/90"
        style={{ boxShadow: "0 0 8px rgba(34, 211, 238, 0.5)" }}
      />
      <div
        className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-cyan-400/90"
        style={{ boxShadow: "0 0 8px rgba(34, 211, 238, 0.5)" }}
      />
      <div className="relative z-0">{children}</div>
    </div>
  );
}
