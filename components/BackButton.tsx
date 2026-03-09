"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";

interface BackButtonProps {
  /** Текст кнопки */
  label?: string;
  /** Классы для контейнера */
  className?: string;
}

export default function BackButton({ label = "Назад", className = "" }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={`flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition ${className}`}
    >
      <FiArrowLeft className="text-lg" />
      {label}
    </button>
  );
}
