"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FiSettings, FiArrowRight, FiCreditCard } from "react-icons/fi";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import toast from "react-hot-toast";

type DonationRow = {
  id?: string;
  donorName: string;
  amount: number;
  message: string | null;
  createdAt: string;
  status?: string;
};

type WithdrawalRow = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
};

type TabId = "history" | "withdraw" | "settings";

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-t-lg transition ${
        active
          ? "bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400"
          : "text-gray-400 hover:text-cyan-200 hover:bg-cyan-500/10"
      }`}
    >
      {children}
    </button>
  );
}

export default function DonationsPage() {
  const router = useRouter();
  const { status, data: session } = useSession();
  const streamerVerified = !!session?.user?.streamerVerified;
  const [activeTab, setActiveTab] = useState<TabId>("history");
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  const loadStats = () => {
    fetch("/api/dashboard/stats")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { balance?: number }) => {
        setBalance(typeof data.balance === "number" ? data.balance : 0);
      })
      .catch(() => setBalance(null));
  };

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      setLoading(true);
      fetch("/api/dashboard/donations?limit=100")
        .then((res) => (res.ok ? res.json() : Promise.reject(res)))
        .then((json: { donations: DonationRow[] }) => setDonations(json.donations ?? []))
        .catch(() => setDonations([]))
        .finally(() => setLoading(false));
    } else if (activeTab === "withdraw") {
      setLoading(true);
      fetch("/api/dashboard/withdrawals")
        .then((res) => (res.ok ? res.json() : Promise.reject(res)))
        .then((json: { withdrawals: WithdrawalRow[] }) => setWithdrawals(json.withdrawals ?? []))
        .catch(() => setWithdrawals([]))
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Math.round(parseFloat(withdrawAmount) || 0);
    if (amount < 100) {
      toast.error("Минимальная сумма вывода 100 ₽");
      return;
    }
    if (balance !== null && amount > balance) {
      toast.error("Недостаточно средств на балансе");
      return;
    }
    setWithdrawing(true);
    fetch("/api/dashboard/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast.error(data.error);
          return;
        }
        toast.success(data.message ?? "Запрос на вывод создан");
        setWithdrawAmount("");
        loadStats();
        if (data.id) {
          setWithdrawals((prev) => [
            { id: data.id, amount, status: "completed", createdAt: new Date().toISOString() },
            ...prev,
          ]);
        } else {
          fetch("/api/dashboard/withdrawals")
            .then((res) => (res.ok ? res.json() : Promise.reject(res)))
            .then((json: { withdrawals: WithdrawalRow[] }) => setWithdrawals(json.withdrawals ?? []))
            .catch(() => {});
        }
      })
      .catch(() => toast.error("Ошибка запроса"))
      .finally(() => setWithdrawing(false));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Донаты</h1>

      <div className="flex gap-2 border-b border-cyan-500/40 pb-2">
        <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")}>
          История пополнений
        </TabButton>
        <TabButton active={activeTab === "withdraw"} onClick={() => setActiveTab("withdraw")}>
          Вывод средств
        </TabButton>
        <TabButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")}>
          Настройки
        </TabButton>
      </div>

      <div className="panel-hud overflow-hidden">
        {activeTab === "history" && (
          <div className="p-6">
            {loading ? (
              <p className="text-gray-400 py-8">Загрузка...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="text-left text-gray-400 border-b border-cyan-500/40">
                    <tr>
                      <th className="pb-3 pr-4">Сумма</th>
                      <th className="pb-3 pr-4">От кого</th>
                      <th className="pb-3 pr-4">Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-gray-500">
                          Нет зачисленных донатов
                        </td>
                      </tr>
                    ) : (
                      donations.map((d, i) => (
                        <tr key={d.id ?? i} className="border-b border-gray-600/40 hover:bg-cyan-500/5 transition">
                          <td className="py-3 text-cyan-400 font-bold">+{d.amount.toLocaleString()} ₽</td>
                          <td className="py-3 text-white">{d.donorName || "Аноним"}</td>
                          <td className="py-3 text-gray-400 text-sm">
                            {format(new Date(d.createdAt), "dd MMM yyyy, HH:mm", { locale: ru })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "withdraw" && (
          <div className="p-6 space-y-6">
            <div className="p-4 border border-cyan-500/40 rounded-lg bg-black/40">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Доступный баланс</p>
              <p className="text-2xl font-bold text-cyan-400">
                {balance !== null ? `${balance.toLocaleString("ru-RU")} ₽` : "—"}
              </p>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-3">
              <label className="block text-gray-400 text-sm">Сумма вывода (₽)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={100}
                  max={balance ?? 0}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="flex-1 px-4 py-2 bg-black/40 border border-cyan-500/40 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                  placeholder="Минимум 100"
                />
                <button
                  type="submit"
                  disabled={withdrawing || balance === null || balance < 100 || !streamerVerified}
                  className="px-4 py-2 bg-cyan-500 text-white font-medium rounded-lg hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition disabled:opacity-50 flex items-center gap-2"
                >
                  <FiCreditCard /> Вывести
                </button>
              </div>
              {!streamerVerified && (
                <p className="text-amber-400/90 text-sm">
                  Вывод средств возможен только после прохождения верификации. Для не идентифицированных пользователей вывод недоступен до подтверждения личности.
                </p>
              )}
            </form>

            <div className="p-3 border border-cyan-500/30 rounded-lg bg-cyan-500/5 text-cyan-200/90 text-sm">
              Заглушка: сумма списывается с баланса и записывается в историю. Реальный вывод на карту будет после подключения платёжной системы.
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">История выводов</p>
              {loading ? (
                <p className="text-gray-400 text-sm">Загрузка...</p>
              ) : withdrawals.length === 0 ? (
                <p className="text-gray-500 text-sm">Выводов пока нет</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-400 border-b border-cyan-500/30">
                    <tr>
                      <th className="pb-2 pr-2">Сумма</th>
                      <th className="pb-2 pr-2">Статус</th>
                      <th className="pb-2">Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="border-b border-gray-600/40">
                        <td className="py-2 text-cyan-400">−{w.amount.toLocaleString()} ₽</td>
                        <td className="py-2 text-gray-400">{w.status === "completed" ? "Выполнен" : w.status}</td>
                        <td className="py-2 text-gray-500">{format(new Date(w.createdAt), "dd MMM yyyy, HH:mm", { locale: ru })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="p-6">
            <p className="text-gray-400 mb-4">
              Минимальная и максимальная сумма доната, сообщение по умолчанию, уведомления по email и Discord.
            </p>
            <Link
              href="/dashboard/donations/settings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white font-medium rounded-lg hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition"
            >
              <FiSettings /> Открыть настройки донатов <FiArrowRight />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
