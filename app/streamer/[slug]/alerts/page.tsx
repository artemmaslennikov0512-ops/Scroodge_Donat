"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import AlertPreview from "@/components/alerts/AlertPreview";

type DonationItem = {
  id: string;
  donorName: string;
  amount: number;
  message: string | null;
  createdAt: string;
};

type AlertSettings = {
  animation: string;
  duration: number;
  position: string;
  soundEnabled: boolean;
  soundFile: string | null;
  soundVolume: number;
  useDefaultSound: boolean;
  messageTemplate: string | null;
  showMessage: boolean;
  showAmount: boolean;
  showName: boolean;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  imageUrl: string | null;
  imagePosition: string | null;
  minAmountRub: number | null;
  cooldownSeconds: number | null;
  textOutline: string;
  animationSpeed: number;
};

const POLL_MS = 3000;

export default function StreamerAlertsOverlayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const transparent = searchParams.get("transparent") === "1" || searchParams.get("transparent") === "true";

  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [queue, setQueue] = useState<Array<DonationItem>>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Загрузка настроек алерта
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/v1/streamers/${encodeURIComponent(slug)}/alert-settings`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "Алерт не настроен" : "Ошибка загрузки");
        return res.json();
      })
      .then((data: AlertSettings) => {
        setSettings(data);
        setSettingsError(null);
      })
      .catch((e) => {
        setSettingsError(e.message || "Ошибка");
        setSettings(null);
      });
  }, [slug]);

  // Опрос донатов и добавление новых в очередь
  useEffect(() => {
    if (!slug || !settings) return;
    const url = `/api/v1/streamers/${encodeURIComponent(slug)}/donations?limit=20`;
    const poll = () => {
      fetch(url)
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Ошибка"))))
        .then((data: { donations?: DonationItem[] }) => {
          const list = Array.isArray(data.donations) ? data.donations : [];
          const seen = seenIdsRef.current;
          const isFirst = initialLoadRef.current;
          initialLoadRef.current = false;
          const minAmount = settings.minAmountRub ?? 0;
          const newOnes = list.filter((d) => {
            if (seen.has(d.id)) return false;
            if (d.amount < minAmount) {
              seen.add(d.id);
              return false;
            }
            seen.add(d.id);
            return !isFirst;
          });
          if (newOnes.length > 0) {
            setQueue((prev) => [...prev, ...newOnes]);
          }
        })
        .catch(() => {});
    };
    poll();
    const t = setInterval(poll, POLL_MS);
    return () => clearInterval(t);
  }, [slug, settings]);

  const current = queue[0] ?? null;
  const onClose = useCallback(() => {
    const delayMs = (settings?.cooldownSeconds ?? 0) * 1000;
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    if (delayMs > 0) {
      cooldownTimerRef.current = setTimeout(() => {
        cooldownTimerRef.current = null;
        setQueue((prev) => prev.slice(1));
      }, delayMs);
    } else {
      setQueue((prev) => prev.slice(1));
    }
  }, [settings?.cooldownSeconds]);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  if (!slug) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ background: transparent ? "transparent" : "rgba(0,0,0,0.8)", color: "#f87171" }}
      >
        <p>Используйте URL: /streamer/<strong>ваш-slug</strong>/alerts</p>
      </div>
    );
  }

  if (settingsError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ background: transparent ? "transparent" : "rgba(0,0,0,0.8)", color: "#fbbf24" }}
      >
        <p>{settingsError}. Настройте алерт донатов в личном кабинете → Алерты.</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ background: transparent ? "transparent" : "rgba(0,0,0,0.8)", color: "#9ca3af" }}
      >
        <p>Загрузка…</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pointer-events-none"
      style={{ background: transparent ? "transparent" : "rgba(0,0,0,0.5)" }}
    >
      <div className="pointer-events-auto">
        <AnimatePresence mode="wait">
          {current && (
            <AlertPreview
              key={current.id}
              settings={{
                ...settings,
                duration: settings.duration,
                soundEnabled: settings.soundEnabled,
                soundFile: settings.soundFile,
                soundVolume: settings.soundVolume,
                useDefaultSound: settings.useDefaultSound,
                messageTemplate: settings.messageTemplate,
                textOutline: settings.textOutline ?? "none",
                animationSpeed: settings.animationSpeed ?? 1,
              }}
              donationName={current.donorName}
              donationAmount={current.amount}
              donationMessage={current.message}
              onClose={onClose}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
