"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiHome,
  FiUsers,
  FiDollarSign,
  FiUserCheck,
  FiShield,
  FiCreditCard,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiMessageCircle,
  FiAlertTriangle,
} from "react-icons/fi";

const menu = [
  { id: "dashboard", label: "Обзор", icon: FiHome, href: "/admin/dashboard" },
  { id: "streamers", label: "Стримеры", icon: FiUserCheck, href: "/admin/streamers" },
  { id: "donations", label: "Донаты", icon: FiDollarSign, href: "/admin/donations" },
  { id: "users", label: "Пользователи", icon: FiUsers, href: "/admin/users" },
  { id: "antifraud", label: "Антифрод", icon: FiAlertTriangle, href: "/admin/antifraud" },
  { id: "support", label: "Поддержка", icon: FiMessageCircle, href: "/admin/support" },
  { id: "verifications", label: "Верификации", icon: FiShield, href: "/admin/verifications" },
  { id: "payments", label: "Платежи", icon: FiCreditCard, href: "/admin/payments" },
  { id: "analytics", label: "Аналитика", icon: FiBarChart2, href: "/admin/analytics" },
  { id: "settings", label: "Настройки", icon: FiSettings, href: "/admin/settings" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") return pathname === "/admin/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-black/50 backdrop-blur-lg border-r border-cyan-500/40 min-h-screen p-4 shrink-0 relative z-10">
      <div className="mb-8 text-center">
        <Link href="/" className="text-xl font-light hover:opacity-90 transition">
          <span className="font-bold text-cyan-400">SCROOGE</span>
          <span className="text-white"> DONAT</span>
        </Link>
        <div className="text-xs text-gray-500 mt-1">Админ-панель</div>
      </div>
      <nav className="space-y-2">
        {menu.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition text-sm ${
              isActive(item.href)
                ? "bg-cyan-500/10 border border-cyan-500/40 text-cyan-200"
                : "text-gray-400 hover:text-white hover:bg-cyan-500/10 hover:text-cyan-200"
            }`}
          >
            <item.icon className={`text-lg shrink-0 ${isActive(item.href) ? "text-cyan-400" : ""}`} />
            <span>{item.label}</span>
          </Link>
        ))}
        <Link
          href="/admin/change-password"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-cyan-200 hover:bg-cyan-500/10 transition text-sm"
        >
          <FiSettings className="text-lg shrink-0" />
          <span>Смена пароля</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition w-full text-sm"
        >
          <FiLogOut className="text-lg shrink-0" />
          <span>Выйти</span>
        </button>
      </nav>
    </aside>
  );
}
