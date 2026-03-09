"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Пн", revenue: 120000 },
  { name: "Вт", revenue: 145000 },
  { name: "Ср", revenue: 132000 },
  { name: "Чт", revenue: 168000 },
  { name: "Пт", revenue: 195000 },
  { name: "Сб", revenue: 210000 },
  { name: "Вс", revenue: 185000 },
];

const TOOLTIP_STYLE = {
  background: "#1a1a2e",
  border: "1px solid #FBBF24",
  borderRadius: "0.5rem",
  color: "#fff",
};

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Аналитика</h1>
      <div className="panel-hud p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Сводная выручка по дням</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorAdminAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#FBBF24" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Area type="monotone" dataKey="revenue" stroke="#FBBF24" fill="url(#colorAdminAmount)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
