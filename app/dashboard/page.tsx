"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiCopy, FiArrowRight, FiExternalLink } from "react-icons/fi";
import { QRCodeSVG } from "qrcode.react";
import { BalanceHUD } from "@/components/BalanceHUD";
import { PanelHUD } from "@/components/PanelHUD";
import { VerificationStatusInline, type VerificationStatus } from "@/components/VerificationStatusInline";

type Goal = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  isActive?: boolean;
  isCompleted?: boolean;
};

type DonationRow = {
  donorName: string;
  amount: number;
  message: string | null;
  createdAt: string;
};

export default function DashboardOverviewPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<{
    balance: number;
    streamerSlug: string | null;
    donateLinkId: string | null;
    username: string | null;
  } | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [donateUrl, setDonateUrl] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | undefined>(undefined);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { balance?: number; streamerSlug?: string | null; donateLinkId?: string | null; username?: string | null }) => {
        const linkId = data?.donateLinkId ?? null;
        setStats({
          balance: data?.balance ?? 0,
          streamerSlug: data?.streamerSlug ?? null,
          donateLinkId: linkId,
          username: data?.username ?? null,
        });
        if (typeof window !== "undefined") {
          setDonateUrl(linkId ? `${window.location.origin}/d/${linkId}` : "");
        }
      })
      .catch(() => {
        setStats(null);
        setDonateUrl("");
      });
  }, []);

  useEffect(() => {
    fetch("/api/goals")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: Goal[]) => setGoals(Array.isArray(data) ? data : []))
      .catch(() => setGoals([]));
  }, []);

  useEffect(() => {
    fetch("/api/dashboard/donations?limit=5")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json: { donations: DonationRow[] }) => setDonations(json.donations ?? []))
      .catch(() => setDonations([]));
  }, []);

  const balance = stats?.balance ?? (session?.user as { balance?: number } | undefined)?.balance ?? 0;
  const currentGoal = goals.find((g) => g.isActive && !g.isCompleted) ?? goals[0] ?? null;

  const copyLink = () => {
    if (donateUrl && typeof navigator?.clipboard?.writeText === "function") {
      navigator.clipboard.writeText(donateUrl);
      alert("Ссылка скопирована");
    }
  };

  const formatDate = (s: string) => {
    const d = new Date(s);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "только что";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
    return d.toLocaleDateString("ru-RU");
  };

  if (status === "loading") return null;
  if (!session) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold text-white">Обзор</h1>

      {/* 1. Виджет баланса — HUD */}
      <BalanceHUD
        balance={balance}
        actions={
          <>
            <button
              type="button"
              onClick={copyLink}
              className="px-4 py-2 rounded-lg border border-gray-500/60 bg-gray-500/10 text-gray-300 hover:bg-gray-500/20 hover:border-gray-400/60 transition text-sm font-medium flex items-center gap-2"
            >
              <FiCopy /> Ссылка
            </button>
            {verificationStatus === "approved" ? (
              <Link
                href="/dashboard/donations"
                className="px-4 py-2 rounded-lg bg-cyan-500 text-white font-medium hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition text-sm flex items-center gap-2"
              >
                Вывести
              </Link>
            ) : (
              <Link
                href="/dashboard/verification"
                className="px-4 py-2 rounded-lg bg-gray-600/50 text-gray-400 font-medium border border-gray-500/50 hover:bg-gray-600/70 hover:text-gray-300 transition text-sm flex items-center gap-2"
                title="Доступно после верификации"
              >
                Вывести
              </Link>
            )}
            <VerificationStatusInline onStatusLoad={setVerificationStatus} />
          </>
        }
      />

      {/* Ссылка и QR для донатов */}
      {donateUrl && (
        <PanelHUD className="p-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Ссылка для донатов</p>
          <p className="text-sm text-gray-400 mb-4">
            Поделитесь ссылкой или QR-кодом — откроется ваша страница с формой доната.
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="flex-shrink-0 p-3 bg-black/40 rounded-lg border border-cyan-500/30">
              <QRCodeSVG value={donateUrl} size={160} level="M" />
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-sm text-cyan-300/90 bg-black/40 px-2 py-1.5 rounded break-all border border-cyan-500/30">
                  {donateUrl}
                </code>
                <button
                  type="button"
                  onClick={copyLink}
                  className="px-4 py-2 rounded-lg border border-gray-500/60 bg-gray-500/10 text-gray-300 hover:bg-gray-500/20 text-sm flex items-center gap-2 flex-shrink-0 font-medium"
                >
                  <FiCopy /> Копировать
                </button>
              </div>
              <Link
                href={donateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
              >
                <FiExternalLink /> Открыть страницу оплаты
              </Link>
            </div>
          </div>
        </PanelHUD>
      )}

      {/* Последние донаты */}
      <PanelHUD className="p-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Последние донаты</p>
          <Link href="/dashboard/donations" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            Вся история <FiArrowRight className="text-xs" />
          </Link>
        </div>
        <div className="space-y-3">
          {donations.length > 0 ? (
            donations.map((d, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-600/40 last:border-0">
                <div>
                  <p className="text-white font-medium">{d.donorName || "Аноним"}</p>
                  <p className="text-xs text-gray-500" suppressHydrationWarning>{formatDate(d.createdAt)}</p>
                </div>
                <p className="text-cyan-400 font-bold">+{d.amount.toLocaleString()} ₽</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm py-4">Пока нет донатов</p>
          )}
        </div>
      </PanelHUD>

      {/* Текущая цель */}
      {currentGoal && (
        <PanelHUD className="p-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Текущая цель</p>
            <Link href="/dashboard/goals" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              Все цели <FiArrowRight className="text-xs" />
            </Link>
          </div>
          <p className="text-white mb-2">{currentGoal.title}</p>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-1">
            <div
              className="h-full bg-cyan-500 transition-all"
              style={{
                width: `${Math.min(100, (currentGoal.currentAmount / currentGoal.targetAmount) * 100)}%`,
                boxShadow: "0 0 12px rgba(34, 211, 238, 0.5)",
              }}
            />
          </div>
          <p className="text-sm text-gray-400">
            {Math.round(currentGoal.currentAmount).toLocaleString()} ₽ из{" "}
            {Math.round(currentGoal.targetAmount).toLocaleString()} ₽
          </p>
        </PanelHUD>
      )}

    </motion.div>
  );
}
