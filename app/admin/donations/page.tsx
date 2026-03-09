// app/admin/donations/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiEye,
  FiRotateCcw,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiUser,
  FiTrendingUp,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DonationStatus = "completed" | "pending" | "refunded" | "fraud";

type Donation = {
  id: string;
  donor?: { name: string; email?: string | null };
  donorName?: string;
  recipient: { username: string; name: string };
  amount: number;
  fee: number;
  net: number;
  status: DonationStatus;
  createdAt: string;
  message: string | null;
  platform: string;
};

const statusColors: Record<DonationStatus, string> = {
  completed: "bg-green-500/20 text-green-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  refunded: "bg-blue-500/20 text-blue-400",
  fraud: "bg-red-500/20 text-red-400",
};

const statusIcons: Record<DonationStatus, typeof FiCheckCircle> = {
  completed: FiCheckCircle,
  pending: FiClock,
  refunded: FiRotateCcw,
  fraud: FiAlertCircle,
};

type SortField = "id" | "donor" | "recipient" | "amount" | "status" | "createdAt" | "";

function getSortValue(d: Donation, field: SortField): string | number {
  if (field === "donor") return d.donor?.name ?? d.donorName ?? "";
  if (field === "recipient") return d.recipient?.username ?? "";
  const v = d[field as keyof Donation];
  if (typeof v === "object" || v === null) return "";
  return v as string | number;
}

const VALID_STATUS_FILTERS = ["all", "completed", "pending", "refunded", "fraud"] as const;

export default function DonationsManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFromUrl = searchParams.get("status");
  const initialStatus = statusFromUrl && VALID_STATUS_FILTERS.includes(statusFromUrl as typeof VALID_STATUS_FILTERS[number])
    ? statusFromUrl
    : "all";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [selectedDonations, setSelectedDonations] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);

  const [apiDonations, setApiDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/check")
      .then((res) => res.json())
      .then((data) => {
        if (!data?.admin) router.replace("/admin/login");
      })
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  useEffect(() => {
    const params = new URLSearchParams({ limit: "200" });
    if (statusFilter !== "all") {
      const statusMap: Record<string, string> = {
        completed: "succeeded",
        refunded: "canceled",
        pending: "pending",
        fraud: "failed",
      };
      const apiStatus = statusMap[statusFilter] ?? statusFilter;
      params.set("status", apiStatus);
    }
    fetch(`/api/admin/donations?${params}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json: { donations: Donation[] }) => setApiDonations(json.donations ?? []))
      .catch(() => setApiDonations([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  // Клиентская фильтрация и сортировка по поиску, датам, сумме
  const filteredDonations = useMemo(() => {
    let result = [...apiDonations];

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (d) =>
          (d.donor?.name && d.donor.name.toLowerCase().includes(lower)) ||
          (d.recipient?.username && d.recipient.username.toLowerCase().includes(lower)) ||
          (d.recipient?.name && d.recipient.name.toLowerCase().includes(lower))
      );
    }

    if (dateRange.from) {
      result = result.filter((d) => d.createdAt >= dateRange.from);
    }
    if (dateRange.to) {
      result = result.filter((d) => d.createdAt <= dateRange.to);
    }

    if (minAmount) {
      result = result.filter((d) => d.amount >= Number(minAmount));
    }
    if (maxAmount) {
      result = result.filter((d) => d.amount <= Number(maxAmount));
    }

    if (sortField) {
      result.sort((a, b) => {
        const aVal = getSortValue(a, sortField);
        const bVal = getSortValue(b, sortField);
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDirection === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
    }

    return result;
  }, [apiDonations, search, dateRange, minAmount, maxAmount, sortField, sortDirection]);

  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredDonations.forEach((d) => {
      const day = d.createdAt.split("T")[0];
      grouped[day] = (grouped[day] || 0) + d.amount;
    });
    return Object.entries(grouped)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredDonations]);

  const toggleSelectAll = () => {
    if (selectedDonations.length === filteredDonations.length) {
      setSelectedDonations([]);
    } else {
      setSelectedDonations(filteredDonations.map((d) => d.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedDonations((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const exportToCSV = () => {
    const headers = ["ID", "Донатер", "Получатель", "Сумма", "Комиссия", "Чистыми", "Статус", "Дата", "Сообщение"];
    const rows = filteredDonations.map((d) => [
      d.id,
      d.donor?.name ?? d.donorName ?? "",
      d.recipient.username,
      d.amount,
      d.fee,
      d.net,
      d.status,
      d.createdAt,
      d.message || "",
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `donations_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const exportSelectedToCSV = () => {
    const toExport = filteredDonations.filter((d) => selectedDonations.includes(d.id));
    if (toExport.length === 0) return;
    const headers = ["ID", "Донатер", "Получатель", "Сумма", "Комиссия", "Чистыми", "Статус", "Дата", "Сообщение"];
    const rows = toExport.map((d) => [
      d.id,
      d.donor?.name ?? d.donorName ?? "",
      d.recipient.username,
      d.amount,
      d.fee,
      d.net,
      d.status,
      d.createdAt,
      d.message || "",
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `donations_selected_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const [batchLoading, setBatchLoading] = useState(false);
  const refetchDonations = () => {
    const statusMap: Record<string, string> = {
      completed: "succeeded",
      refunded: "canceled",
      pending: "pending",
      fraud: "failed",
    };
    const apiStatus = statusFilter === "all" ? "" : (statusMap[statusFilter] ?? statusFilter);
    const params = new URLSearchParams({ limit: "200" });
    if (apiStatus) params.set("status", apiStatus);
    fetch(`/api/admin/donations?${params}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json: { donations: Donation[] }) => setApiDonations(json.donations ?? []))
      .catch(() => {});
  };
  const batchUpdateStatus = async (status: "canceled" | "failed", ids?: string[]) => {
    const targetIds = ids?.length ? ids : selectedDonations;
    if (targetIds.length === 0) return;
    setBatchLoading(true);
    try {
      const res = await fetch("/api/admin/donations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: targetIds, status }),
      });
      if (!res.ok) throw new Error("Ошибка обновления");
      if (!ids?.length) setSelectedDonations([]);
      refetchDonations();
    } catch {
      alert("Не удалось обновить статусы");
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e]">
      <div className="bg-black/50 backdrop-blur-lg border-b border-cyan-500/40 sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link
            href="/admin/dashboard"
            className="text-gray-400 hover:text-white text-sm flex items-center gap-2 transition"
          >
            ← Панель управления
          </Link>
          <span className="text-gray-500 text-sm">Управление донатами</span>
        </div>
      </div>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Управление донатами</h1>
        <button
          type="button"
          onClick={exportToCSV}
          style={{
            background: "linear-gradient(to right, #fbbf24, #eab308)",
          }}
          className="px-4 py-2 rounded-lg text-white font-bold flex items-center gap-2 shadow-md hover:opacity-90 transition"
        >
          <FiDownload /> Экспорт CSV
        </button>
      </div>

      {/* График */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-cyan-500/40">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FiTrendingUp className="text-cyan-400" />
          Динамика донатов
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{ background: "#1a1a2e", border: "1px solid #8b5cf6", borderRadius: "0.5rem" }}
            />
            <Area type="monotone" dataKey="amount" stroke="#8b5cf6" fill="url(#colorDonations)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Фильтры */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-cyan-500/40">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-white font-medium mb-4"
        >
          <FiFilter />
          Фильтры
          {showFilters ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        {showFilters && (
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Поиск</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Имя, email..."
                  className="w-full pl-10 pr-4 py-2 bg-black/30 border border-cyan-500/40 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Статус</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-black/30 border border-cyan-500/40 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="all">Все</option>
                <option value="completed">Завершённые</option>
                <option value="pending">Ожидают</option>
                <option value="refunded">Возвращённые</option>
                <option value="fraud">Мошеннические</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Дата с</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="w-full px-4 py-2 bg-black/30 border border-cyan-500/40 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Дата по</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="w-full px-4 py-2 bg-black/30 border border-cyan-500/40 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Мин. сумма</label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2 bg-black/30 border border-cyan-500/40 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Макс. сумма</label>
              <input
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="100000"
                className="w-full px-4 py-2 bg-black/30 border border-cyan-500/40 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Таблица донатов */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-cyan-500/40 overflow-hidden">
        <table className="w-full">
          <thead className="bg-black/30">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedDonations.length === filteredDonations.length && filteredDonations.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-600 bg-black/30 text-cyan-400 focus:ring-cyan-500"
                />
              </th>
              <th
                className="px-4 py-3 text-left text-sm text-gray-400 cursor-pointer hover:text-white"
                onClick={() => handleSort("id")}
              >
                ID {sortField === "id" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-4 py-3 text-left text-sm text-gray-400 cursor-pointer hover:text-white"
                onClick={() => handleSort("donor")}
              >
                Донатер {sortField === "donor" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-4 py-3 text-left text-sm text-gray-400 cursor-pointer hover:text-white"
                onClick={() => handleSort("recipient")}
              >
                Получатель {sortField === "recipient" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-4 py-3 text-left text-sm text-gray-400 cursor-pointer hover:text-white"
                onClick={() => handleSort("amount")}
              >
                Сумма {sortField === "amount" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-4 py-3 text-left text-sm text-gray-400">Комиссия</th>
              <th className="px-4 py-3 text-left text-sm text-gray-400">Чистыми</th>
              <th
                className="px-4 py-3 text-left text-sm text-gray-400 cursor-pointer hover:text-white"
                onClick={() => handleSort("status")}
              >
                Статус {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-4 py-3 text-left text-sm text-gray-400 cursor-pointer hover:text-white"
                onClick={() => handleSort("createdAt")}
              >
                Дата {sortField === "createdAt" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-4 py-3 text-left text-sm text-gray-400">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                  Загрузка...
                </td>
              </tr>
            ) : (
            filteredDonations.map((donation) => {
              const StatusIcon = statusIcons[donation.status];
              return (
                <tr key={donation.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedDonations.includes(donation.id)}
                      onChange={() => toggleSelect(donation.id)}
                      className="rounded border-gray-600 bg-black/30 text-cyan-400 focus:ring-cyan-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{donation.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FiUser className="text-gray-500" />
                      <span className="text-white">{donation.donor?.name ?? donation.donorName ?? "—"}</span>
                    </div>
                    {donation.donor?.email && (
                      <div className="text-xs text-gray-500">{donation.donor.email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{donation.recipient.username}</span>
                    </div>
                    <div className="text-xs text-gray-500">{donation.recipient.name}</div>
                  </td>
                  <td className="px-4 py-3 text-green-400 font-bold">{donation.amount.toLocaleString()} ₽</td>
                  <td className="px-4 py-3 text-gray-400">{donation.fee} ₽</td>
                  <td className="px-4 py-3 text-cyan-400">{donation.net} ₽</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusColors[donation.status]}`}>
                      <StatusIcon className="text-xs" />
                      {donation.status === "completed" && "Завершён"}
                      {donation.status === "pending" && "Ожидает"}
                      {donation.status === "refunded" && "Возврат"}
                      {donation.status === "fraud" && "Мошенник"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm">
                    {format(new Date(donation.createdAt), "dd MMM yyyy HH:mm", { locale: ru })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="p-1 text-blue-400 hover:text-blue-300"
                        title="Просмотр"
                        onClick={() => {}}
                      >
                        <FiEye />
                      </button>
                      {donation.status !== "refunded" && donation.status !== "fraud" && (
                        <button
                          type="button"
                          disabled={batchLoading}
                          className="p-1 text-yellow-400 hover:text-yellow-300 disabled:opacity-50"
                          title="Вернуть"
                          onClick={() => batchUpdateStatus("canceled", [donation.id])}
                        >
                          <FiRotateCcw />
                        </button>
                      )}
                      {donation.status !== "fraud" && (
                        <button
                          type="button"
                          disabled={batchLoading}
                          className="p-1 text-red-400 hover:text-red-300 disabled:opacity-50"
                          title="Пометить как мошеннический"
                          onClick={() => batchUpdateStatus("failed", [donation.id])}
                        >
                          <FiAlertCircle />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>
        {!loading && filteredDonations.length === 0 && (
          <div className="text-center py-12">
            <FiDollarSign className="text-4xl text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Донаты не найдены</p>
          </div>
        )}
      </div>

      {/* Массовые действия */}
      {selectedDonations.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#1a1a2e] border border-cyan-500/40 rounded-full px-6 py-3 flex items-center gap-4 shadow-2xl">
          <span className="text-white">Выбрано: {selectedDonations.length}</span>
          <button
            type="button"
            disabled={batchLoading}
            onClick={() => batchUpdateStatus("canceled")}
            className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 disabled:opacity-50"
          >
            Вернуть выбранные
          </button>
          <button
            type="button"
            disabled={batchLoading}
            onClick={() => batchUpdateStatus("failed")}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 disabled:opacity-50"
          >
            Пометить как мошеннические
          </button>
          <button
            type="button"
            onClick={exportSelectedToCSV}
            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
          >
            Экспорт выбранных
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
