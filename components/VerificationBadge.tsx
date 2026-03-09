"use client";

import { motion } from "framer-motion";
import { FiCheckCircle, FiShield } from "react-icons/fi";

interface VerificationBadgeProps {
  type: "email" | "streamer";
  verified: boolean;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

export function VerificationBadge({
  type,
  verified,
  size = "md",
  showTooltip = true,
}: VerificationBadgeProps) {
  if (!verified) return null;

  const sizes = {
    sm: { icon: 12, text: "text-xs", padding: "px-1.5 py-0.5" },
    md: { icon: 14, text: "text-sm", padding: "px-2 py-1" },
    lg: { icon: 16, text: "text-base", padding: "px-2.5 py-1.5" },
  };

  const config = {
    email: {
      icon: FiCheckCircle,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      label: "Email подтвержден",
    },
    streamer: {
      icon: FiShield,
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/40",
      label: "Верифицированный стример",
    },
  };

  const { icon: Icon, color, bg, border, label } = config[type];
  const s = sizes[size];

  const badge = (
    <div
      className={`inline-flex items-center gap-1 border ${bg} ${border} rounded-full ${s.padding}`}
    >
      <Icon size={s.icon} className={color} />
      <span className={`${s.text} ${color}`}>
        {type === "email" ? "✓" : "Верифицирован"}
      </span>
    </div>
  );

  if (!showTooltip) return badge;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className="relative group"
    >
      {badge}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1a1a2e] border border-pink-500/40 rounded-lg text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#1a1a2e]" />
      </div>
    </motion.div>
  );
}
