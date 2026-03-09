"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FiUsers,
  FiDollarSign,
  FiActivity,
  FiUserCheck,
  FiLogIn,
  FiDownload,
  FiAward,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, isValid } from "date-fns";
import { ru } from "date-fns/locale";
import { parseJsonFromResponse } from "@/lib/fetchJson";

function formatActionDate(createdAt: string): string {
  const d = new Date(createdAt);
  if (!isValid(d)) return "—";
  const y = d.getFullYear();
  if (y < 2000 || y > 2100) return "—";
  return format(d, "dd.MM.yyyy HH:mm", { locale: ru });
}

const STAT_STYLE = [
  { label: "Стримеров", color: "from-cyan-400 to-cyan-600", icon: FiUsers, change: "+12%" },
  { label: "Донатов", color: "from-cyan-500 to-teal-400", icon: FiActivity, change: "+8%" },
  { label: "Сумма донатов", color: "from-cyan-400 to-cyan-500", icon: FiDollarSign, change: "+23%" },
  { label: "Активных сейчас", color: "from-cyan-600 to-teal-500", icon: FiUserCheck, change: "+5%" },
] as const;

const CHART_COLORS = ["#22d3ee", "#06b6d4", "#0891b2", "#0e7490"];
const TOOLTIP_STYLE = { background: "#0a0a0f", border: "1px solid rgba(34,211,238,0.4)", borderRadius: "0.5rem", color: "#fff" };

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStreamers: 0,
    totalDonations: 0,
    totalRevenue: 0,
    recentActionsCount: 0,
  });
  const [recentActions, setRecentActions] = useState<
    { actionType: string; targetType: string; createdAt: string; details?: unknown }[]
  >([]);

  const loadStatsAndActions = async () => {
    const [statsRes, actionsRes] = await Promise.all([
      fetch("/api/admin/stats"),
      fetch("/api/admin/actions?limit=5"),
    ]);
    if (statsRes.ok) {
      try {
        const data = await parseJsonFromResponse<{
          totalStreamers: number;
          totalDonations: number;
          totalRevenue: number;
          recentActionsCount: number;
        }>(statsRes);
        setStats(data);
      } catch {
        setStats((s) => ({ ...s }));
      }
    }
    if (actionsRes.ok) {
      try {
        const data = await parseJsonFromResponse<{
          actions?: { actionType: string; targetType: string; createdAt: string; details?: unknown }[];
        }>(actionsRes);
        setRecentActions(data.actions ?? []);
      } catch {
        setRecentActions([]);
      }
    }
  };

  useEffect(() => {
    loadStatsAndActions();
    const interval = setInterval(loadStatsAndActions, 30000);
    return () => clearInterval(interval);
  }, []);

  const revenueData = [
    { name: "Пн", revenue: 45000 },
    { name: "Вт", revenue: 52000 },
    { name: "Ср", revenue: 48000 },
    { name: "Чт", revenue: 61000 },
    { name: "Пт", revenue: 78000 },
    { name: "Сб", revenue: 89000 },
    { name: "Вс", revenue: 72000 },
  ];

  const streamersData = [
    { name: "Янв", count: 4 },
    { name: "Фев", count: 6 },
    { name: "Мар", count: 8 },
  ];

  const statValues = [
    stats.totalStreamers,
    stats.totalDonations,
    `${(stats.totalRevenue / 1000).toFixed(0)}k ₽`,
    stats.recentActionsCount,
  ];

  const platformData = [
    { name: "Twitch", value: 540 },
    { name: "YouTube", value: 320 },
    { name: "Kick", value: 180 },
    { name: "Trovo", value: 80 },
  ];

  const exportReport = async () => {
    try {
      const res = await fetch("/api/admin/actions?limit=100");
      if (!res.ok) return;
      const data = await parseJsonFromResponse<{ actions?: { actionType: string; targetType: string; createdAt: string; details?: unknown }[] }>(res);
      const actions = data.actions ?? [];
      const headers = ["Тип", "Объект", "Дата", "Детали"];
      const rows = actions.map((a) => [
        a.actionType,
        a.targetType,
        formatActionDate(a.createdAt),
        typeof a.details === "object" && a.details !== null ? JSON.stringify(a.details) : "",
      ]);
      const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `admin_report_${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Панель управления</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_STYLE.map((s, idx) => (
          <div key={s.label} className="panel-hud p-6">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                <s.icon className="text-2xl text-white" />
              </div>
              <span className="text-sm text-green-400">{s.change}</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{statValues[idx]}</div>
            <div className="text-sm text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel-hud p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FiDollarSign className="text-cyan-400" /> Доход за неделю
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="revenue" stroke="#22d3ee" fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="panel-hud p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FiUsers className="text-cyan-400" /> Стримеры по месяцам
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={streamersData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel-hud p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FiActivity className="text-cyan-400" /> Последние действия
          </h3>
          <div className="space-y-3">
            {recentActions.length === 0 ? (
              <p className="text-gray-400">Нет действий</p>
            ) : (
              recentActions.map((action, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiLogIn className="text-xl text-green-400" />
                    <span className="text-white text-sm">{action.actionType}</span>
                    <span className="text-gray-500 text-xs">{action.targetType}</span>
                  </div>
                  <span className="text-gray-400 text-xs">{formatActionDate(action.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="panel-hud p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FiAward className="text-cyan-400" /> Платформы стримеров
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={platformData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                fill="#FBBF24"
                paddingAngle={5}
                dataKey="value"
              >
                {platformData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4 text-xs">
            {platformData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                <span className="text-gray-400">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={exportReport}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 rounded-lg text-black font-bold hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition"
        >
          <FiDownload />
          Экспорт отчёта
        </button>
      </div>
    </div>
  );
}
