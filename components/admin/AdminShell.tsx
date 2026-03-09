"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiUserCheck, FiBell, FiLogOut } from "react-icons/fi";
import { parseJsonFromResponse } from "@/lib/fetchJson";
import AdminSidebar from "./Sidebar";
import MatrixRain from "@/components/MatrixRain";

type Admin = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  mustChangePassword?: boolean;
};

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/admin/check");
        if (!res.ok) {
          router.push("/admin/login");
          return;
        }
        const data = await parseJsonFromResponse<{ admin?: Admin }>(res);
        if (data.admin?.mustChangePassword) {
          router.push("/admin/change-password");
          return;
        }
        setAdmin(data.admin ?? null);
      } catch {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex relative">
      <MatrixRain color="#00ff41" fontSize={16} speed={16} density={0.35} className="opacity-20 z-0" />
      <div className="cyber-sphere-1" />
      <div className="cyber-sphere-2" />
      <div className="fixed inset-0 bg-cyber-grid opacity-20 pointer-events-none" />

      <AdminSidebar />

      <div className="flex-1 flex flex-col relative z-10">
        <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-lg border-b border-cyan-500/40 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="text-lg font-semibold text-white hover:opacity-90">
              Панель управления
            </Link>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">Система работает</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" className="p-2 text-gray-400 hover:text-cyan-400 transition" aria-label="Уведомления">
              <FiBell className="text-xl" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-500/50 bg-cyan-500/20 flex items-center justify-center">
                <FiUserCheck className="text-cyan-400 text-sm" />
              </div>
              <div>
                <div className="text-white text-sm">{admin.name ?? admin.email}</div>
                <div className="text-xs text-gray-500">Администратор</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-cyan-500/10 text-white text-sm border border-cyan-500/40 hover:border-cyan-400/50 transition"
            >
              <FiLogOut /> Выход
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
