"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiShield, FiClock, FiXCircle, FiAlertCircle } from "react-icons/fi";

type Status = "pending" | "approved" | "rejected" | null;
type ConfigKey = "pending" | "approved" | "rejected" | "null";

const config: Record<
  ConfigKey,
  { icon: typeof FiShield; label: string; color: string; asLink: boolean }
> = {
  approved: {
    icon: FiShield,
    label: "Верифицирован",
    color: "text-emerald-400",
    asLink: false,
  },
  pending: {
    icon: FiClock,
    label: "На проверке",
    color: "text-amber-400",
    asLink: true,
  },
  rejected: {
    icon: FiXCircle,
    label: "Отклонено",
    color: "text-red-400",
    asLink: true,
  },
  null: {
    icon: FiAlertCircle,
    label: "Не идентифицирован",
    color: "text-gray-400 hover:text-cyan-400",
    asLink: true,
  },
};

export type VerificationStatus = Status;

interface VerificationStatusInlineProps {
  /** Передать статус снаружи (тогда свой запрос не делается) */
  status?: Status;
  /** Вызвать при загрузке статуса (чтобы родитель мог разблокировать кнопку вывода) */
  onStatusLoad?: (status: Status) => void;
}

export function VerificationStatusInline({ status: externalStatus, onStatusLoad }: VerificationStatusInlineProps = {}) {
  const [status, setStatus] = useState<Status>(externalStatus ?? null);
  const [loading, setLoading] = useState(typeof externalStatus === "undefined");

  useEffect(() => {
    if (typeof externalStatus !== "undefined") {
      setStatus(externalStatus);
      setLoading(false);
      return;
    }
    fetch("/api/auth/streamer-verification")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { verification?: { status: string } | null }) => {
        const s = data?.verification?.status;
        const next =
          s === "approved" || s === "pending" || s === "rejected" ? s : null;
        setStatus(next);
        onStatusLoad?.(next);
      })
      .catch(() => {
        setStatus(null);
        onStatusLoad?.(null);
      })
      .finally(() => setLoading(false));
  }, [externalStatus, onStatusLoad]);

  const key = status ?? ("null" as const);
  if (loading) return null;

  const { icon: Icon, label, color, asLink } = config[key];
  const className = `inline-flex items-center gap-1.5 text-sm font-medium ${color} transition`;

  const content = (
    <>
      <Icon size={16} className="flex-shrink-0" />
      <span>{label}</span>
    </>
  );

  if (asLink) {
    return (
      <Link href="/dashboard/verification" className={className}>
        {content}
      </Link>
    );
  }

  return <span className={className}>{content}</span>;
}
