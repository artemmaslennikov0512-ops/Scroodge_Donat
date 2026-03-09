"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { VerificationBadge } from "@/components/VerificationBadge";
import {
  FiHome,
  FiDollarSign,
  FiSettings,
  FiBarChart2,
  FiLogOut,
  FiTarget,
  FiShield,
} from "react-icons/fi";
import { useState } from "react";
import SupportChatWidget from "./SupportChatWidget";
import MatrixRain from "@/components/MatrixRain";

const NAV_ITEMS = [
  { id: "overview", href: "/dashboard", icon: FiHome, label: "Обзор" },
  { id: "donations", href: "/dashboard/donations", icon: FiDollarSign, label: "Донаты" },
  { id: "analytics", href: "/dashboard/analytics", icon: FiBarChart2, label: "Аналитика" },
  { id: "goals", href: "/dashboard/goals", icon: FiTarget, label: "Цели" },
  { id: "settings", href: "/dashboard/settings", icon: FiSettings, label: "Настройки" },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [showSupport, setShowSupport] = useState(false);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  if (!session) return null;

  const user = session.user as { name?: string | null; username?: string | null; image?: string | null; isVerified?: boolean; isStreamer?: boolean; streamerVerified?: boolean };
  const isVerified = user?.isVerified ?? false;
  const streamerVerified = user?.streamerVerified ?? user?.isStreamer ?? false;
  const displayName = user?.name || user?.username || "Пользователь";
  const avatar = user?.image ?? "https://i.pravatar.cc/150?img=1";

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative">
      {/* Настройки матричного дождя (фон ЛК):
          color — цвет символов (hex), например #FBBF24 золотой, #22d3ee cyan
          fontSize — размер символов в px (12–20), больше = реже колонки
          speed — скорость падения (10–50), больше = быстрее
          density — плотность 0–1: доля колонок (0.2 = редко, 0.8 = густо)
          trailLength — длина хвоста столбца (по умолчанию 12), видно падение вниз
          className — прозрачность: opacity-15 ... opacity-30 (opacity-25 хорошо видно), z-0 под контентом */}
      <MatrixRain
        color="#00ff41"
        fontSize={16}
        speed={16}
        density={0.35}
        className="opacity-25 z-0"
      />
      <div className="cyber-sphere-1" />
      <div className="cyber-sphere-2" />
      <div className="fixed inset-0 bg-cyber-grid opacity-20 pointer-events-none" />
      <header className="sticky top-0 z-40 h-14 bg-black/50 backdrop-blur-lg border-b border-cyan-500/40 shrink-0 relative z-10">
        <div className="h-full container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-2xl font-bold hover:opacity-90 transition">
              <span className="text-cyan-400">SCROOGE</span>
              <span className="text-white">DONAT</span>
            </Link>
            <nav className="flex items-center gap-1">
              <Link href="/" className="px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-cyan-500/10 hover:text-cyan-200 transition text-sm font-medium">
                Главная
              </Link>
              <Link href="/dashboard" className="px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-cyan-500/10 hover:text-cyan-200 transition text-sm font-medium">
                ЛК
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img src={avatar} alt="" className="w-10 h-10 rounded-full border-2 border-cyan-500/50 object-cover" />
              <span className="text-white font-medium hidden sm:inline">{displayName}</span>
              <span className="hidden sm:flex items-center gap-1">
                <VerificationBadge type="email" verified={isVerified} size="sm" />
                <VerificationBadge type="streamer" verified={streamerVerified} size="sm" />
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="fixed left-0 top-14 w-64 bottom-0 bg-black/50 backdrop-blur-lg border-r border-cyan-500/40 z-30 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  isActive(item.href)
                    ? "bg-cyan-500/20 text-white border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                    : "text-gray-400 hover:text-cyan-200 hover:bg-cyan-500/10"
                }`}
              >
                <item.icon className={`text-xl ${isActive(item.href) ? "text-cyan-400" : ""}`} />
                <span>{item.label}</span>
              </Link>
            ))}
            <Link
              href="/dashboard/verification"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-cyan-400/90 hover:bg-cyan-500/10 hover:text-cyan-300 transition"
            >
              <FiShield className="text-xl" />
              <span>Верификация</span>
            </Link>
            <button
              type="button"
              onClick={() => (window.location.href = "/api/auth/signout")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition mt-8"
            >
              <FiLogOut className="text-xl" />
              <span>Выйти</span>
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-6 space-y-6 ml-64 min-h-[calc(100vh-3.5rem)] relative z-10">
          {children}
        </main>
      </div>

      <SupportChatWidget isOpen={showSupport} onClose={() => setShowSupport(false)} onOpen={() => setShowSupport(true)} />
    </div>
  );
}
