"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  FiDollarSign,
  FiTrendingUp,
  FiUsers,
  FiCalendar,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#22d3ee", "#06b6d4", "#0891b2", "#0e7490"];

type DonationRow = {
  id: string;
  donorName: string;
  amount: number;
  message: string | null;
  createdAt: string;
  status: string;
};

export default function AnalyticsPage() {
  const { status } = useSession();
  const [stats, setStats] = useState<{
    balance: number;
    totalRevenue: number;
    donationsCount: number;
    streamerSlug: string | null;
  } | null>(null);
  const [donations, setDonations] = useState<DonationRow[]>([]);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  useEffect(() => {
    fetch("/api/dashboard/donations?period=month&limit=500")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json: { donations: DonationRow[] }) => {
        setDonations(json.donations ?? []);
      })
      .catch(() => setDonations([]));
  }, []);

  const computed = useMemo(() => {
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    const count = donations.length;
    const avg = count > 0 ? totalAmount / count : 0;
    const uniqueDonors = new Set(donations.map((d) => d.donorName)).size;
    return { totalAmount, donationsCount: count, avgAmount: avg, uniqueDonors };
  }, [donations]);

  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    donations.forEach((d) => {
      const day = d.createdAt.split("T")[0];
      grouped[day] = (grouped[day] || 0) + d.amount;
    });
    return Object.entries(grouped)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [donations]);

  const topDonors = useMemo(() => {
    const donorMap: Record<string, number> = {};
    donations.forEach((d) => {
      donorMap[d.donorName] = (donorMap[d.donorName] || 0) + d.amount;
    });
    return Object.entries(donorMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [donations]);

  const totalRevenue = stats?.totalRevenue ?? computed.totalAmount;

  if (status === "loading") return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Аналитика</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: FiDollarSign, label: "Всего получено", value: `${totalRevenue.toLocaleString()} ₽` },
          { icon: FiTrendingUp, label: "Количество донатов", value: String(stats?.donationsCount ?? computed.donationsCount) },
          { icon: FiUsers, label: "Уникальных донатеров", value: String(computed.uniqueDonors) },
          { icon: FiCalendar, label: "Средний чек", value: `${Math.round(computed.avgAmount)} ₽` },
        ].map((item, i) => (
          <div key={i} className="panel-hud p-6">
            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <item.icon />
              <span className="text-xs text-gray-400 uppercase tracking-wider">{item.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 panel-hud p-6">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">Динамика донатов</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorAnalytics" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(34, 211, 238, 0.5)", borderRadius: "0.5rem" }}
              />
              <Area type="monotone" dataKey="amount" stroke="#22d3ee" fill="url(#colorAnalytics)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="panel-hud p-6">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">Топ донатеры</p>
          {topDonors.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={topDonors}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {topDonors.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid rgba(34, 211, 238, 0.5)", borderRadius: "0.5rem" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {topDonors.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-400 truncate">{item.name}</span>
                    <span className="text-cyan-300 font-medium shrink-0 ml-2">{item.value.toLocaleString()} ₽</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-400">Нет данных</p>
          )}
        </div>
      </div>
    </div>
  );
}
