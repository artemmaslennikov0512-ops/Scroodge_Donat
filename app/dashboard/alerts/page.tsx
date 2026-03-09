"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiSave, FiEye, FiUpload, FiCopy, FiExternalLink } from "react-icons/fi";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { AnimatePresence } from "framer-motion";
import AlertPreview from "@/components/alerts/AlertPreview";
import AlertInlinePreview from "@/components/alerts/AlertInlinePreview";
import BackButton from "@/components/BackButton";

type AlertType = "DONATION" | "SUBSCRIPTION" | "FOLLOW" | "RAID" | "HOST" | "BITS";

const alertTypeNames: Record<AlertType, string> = {
  DONATION: "Донат",
  SUBSCRIPTION: "Новая подписка",
  FOLLOW: "Новый подписчик",
  RAID: "Рейд",
  HOST: "Хост",
  BITS: "Bits (Twitch)",
};

const DEFAULT_ALERT: Omit<AlertSettings, "type"> = {
  enabled: true,
  animation: "default",
  duration: 5,
  position: "bottom-right",
  soundEnabled: true,
  soundVolume: 70,
  showMessage: true,
  showAmount: true,
  showName: true,
  minAmountRub: undefined,
  cooldownSeconds: 0,
  textOutline: "none",
  animationSpeed: 1,
  useDefaultSound: false,
};

interface AlertSettings {
  id?: string;
  type: AlertType;
  enabled: boolean;
  animation: string;
  duration: number;
  position: string;
  soundEnabled: boolean;
  soundFile?: string;
  soundVolume: number;
  messageTemplate?: string;
  showMessage: boolean;
  showAmount: boolean;
  showName: boolean;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  imageUrl?: string;
  imagePosition?: string;
  minAmountRub?: number;
  cooldownSeconds?: number;
  textOutline?: string;
  animationSpeed?: number;
  useDefaultSound?: boolean;
}

function defaultForType(type: AlertType): AlertSettings {
  return { ...DEFAULT_ALERT, type };
}

const ALL_TYPES: AlertType[] = ["DONATION", "SUBSCRIPTION", "FOLLOW", "RAID", "HOST", "BITS"];

export default function AlertsPage() {
  const { data: session, status } = useSession();
  const [alerts, setAlerts] = useState<AlertSettings[]>([]);
  const [selectedType, setSelectedType] = useState<AlertType>("DONATION");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testAlert, setTestAlert] = useState(false);
  const [alertOverlayUrl, setAlertOverlayUrl] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") fetchAlerts();
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    fetch("/api/dashboard/stats", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { streamerSlug?: string | null }) => {
        const slug = data?.streamerSlug ?? null;
        if (origin && slug) {
          setAlertOverlayUrl(`${origin}/streamer/${slug}/alerts?transparent=1`);
        } else {
          setAlertOverlayUrl(null);
        }
      })
      .catch(() => setAlertOverlayUrl(null));
  }, [status]);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: AlertSettings[] = await res.json();
      const byType = new Map(data.map((a) => [a.type, a]));
      const merged = ALL_TYPES.map((t) => byType.get(t) ?? defaultForType(t));
      setAlerts(merged);
    } catch {
      toast.error("Ошибка загрузки настроек");
      setAlerts(ALL_TYPES.map(defaultForType));
    } finally {
      setLoading(false);
    }
  };

  const currentAlert =
    alerts.find((a) => a.type === selectedType) ?? defaultForType(selectedType);

  const handleChange = (field: keyof AlertSettings, value: unknown) => {
    setAlerts((prev) => {
      const idx = prev.findIndex((a) => a.type === selectedType);
      if (idx === -1) {
        return [...prev, { ...defaultForType(selectedType), [field]: value }];
      }
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const saveAlerts = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alerts }),
      });
      if (res.ok) {
        toast.success("Настройки сохранены");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Ошибка сохранения");
      }
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const testAlertHandler = () => {
    setTestAlert(true);
    setTimeout(() => setTestAlert(false), 4500);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-gray-400">Загрузка...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <h1 className="text-3xl font-bold text-white">Настройка алертов</h1>
      </div>

      {/* Ссылка для привязки алертов в OBS */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-cyan-500/40">
        <h2 className="text-base font-bold text-white mb-2">
          Одна ссылка для алертов в OBS
        </h2>
        <p className="text-sm text-gray-400 mb-3">
          У вас две ссылки: <strong>ссылка для донатов</strong> (её даёте зрителям — в Настройках → Интеграции) и <strong>эта ссылка для алертов</strong> (её вставляете в OBS как источник «Браузер», чтобы на стриме показывались всплывающие алерты). Обе можно использовать одновременно. Подробная инструкция — в разделе{" "}
          <Link
            href="/dashboard/settings?section=integrations"
            className="text-cyan-400 hover:text-cyan-300 underline"
          >
            Настройки → Интеграции
            <FiExternalLink className="inline w-3.5 h-3.5 ml-0.5" />
          </Link>
        </p>
        {alertOverlayUrl ? (
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 min-w-0 px-3 py-2 bg-black/40 rounded-lg text-cyan-200 text-xs break-all">
              {alertOverlayUrl}
            </code>
            <button
              type="button"
              onClick={() => {
                if (alertOverlayUrl && typeof navigator?.clipboard?.writeText === "function") {
                  navigator.clipboard.writeText(alertOverlayUrl);
                  toast.success("Ссылка скопирована");
                } else {
                  toast.error("Копирование недоступно");
                }
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-600/30 text-sm"
            >
              <FiCopy className="w-4 h-4" />
              Копировать ссылку
            </button>
          </div>
        ) : (
          <p className="text-sm text-amber-400/90">
            Сначала привяжите аккаунт стримера и укажите slug в профиле — тогда здесь появится ваша ссылка. Или откройте{" "}
            <Link href="/dashboard/settings?section=integrations" className="text-cyan-400 hover:underline">
              Интеграции
            </Link>
            .
          </p>
        )}
      </div>

      {/* Переработанный layout: типы | настройки | превью (превью всегда справа на десктопе) */}
      <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr_360px] gap-6 items-start">
        {/* 1. Типы алертов — узкая колонка */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-cyan-500/40 xl:sticky xl:top-4">
          <h2 className="text-sm font-bold text-white mb-3">Тип алерта</h2>
          <div className="space-y-1">
            {ALL_TYPES.map((type) => {
              const alert = alerts.find((a) => a.type === type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg transition text-left text-sm ${
                    selectedType === type
                      ? "bg-cyan-600/20 border border-cyan-500/40"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <span className="text-white truncate">{alertTypeNames[type]}</span>
                  {alert && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ml-1 ${
                        alert.enabled ? "bg-green-400" : "bg-gray-500"
                      }`}
                      title={alert.enabled ? "Вкл" : "Выкл"}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Настройки — прокручиваемая форма, сгруппирована по блокам */}
        <div className="min-w-0 space-y-4">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-5 border border-cyan-500/40">
            <h3 className="text-sm font-semibold text-cyan-300/90 mb-3 uppercase tracking-wider">Основное</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm">Включить</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentAlert.enabled}
                    onChange={(e) => handleChange("enabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-cyan-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Анимация</label>
                  <select
                    value={currentAlert.animation}
                    onChange={(e) => handleChange("animation", e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-black/30 border border-cyan-500/40 rounded-lg text-white"
                  >
                    <option value="default">Стандартная</option>
                    <option value="slide">Скольжение</option>
                    <option value="fade">Появление</option>
                    <option value="bounce">Подпрыгивание</option>
                    <option value="custom">Кастомная</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Позиция</label>
                  <select
                    value={currentAlert.position}
                    onChange={(e) => handleChange("position", e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-black/30 border border-cyan-500/40 rounded-lg text-white"
                  >
                    <option value="top-left">Сверху слева</option>
                    <option value="top-right">Сверху справа</option>
                    <option value="bottom-left">Снизу слева</option>
                    <option value="bottom-right">Снизу справа</option>
                    <option value="center">Центр</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Длительность: {currentAlert.duration} сек</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={currentAlert.duration}
                  onChange={(e) => handleChange("duration", Number(e.target.value))}
                  className="w-full accent-cyan-500 h-2"
                />
              </div>
              {selectedType === "DONATION" && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Мин. сумма (₽)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={currentAlert.minAmountRub ?? ""}
                    onChange={(e) => {
                      const v = e.target.value === "" ? undefined : Number(e.target.value);
                      handleChange("minAmountRub", v !== undefined && v >= 0 ? v : undefined);
                    }}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm bg-black/30 border border-cyan-500/40 rounded-lg text-white"
                  />
                  <p className="text-xs text-gray-500 mt-0.5">Не показывать алерт, если донат меньше</p>
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Пауза между алертами: {currentAlert.cooldownSeconds ?? 0} сек</label>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={currentAlert.cooldownSeconds ?? 0}
                  onChange={(e) => handleChange("cooldownSeconds", Number(e.target.value))}
                  className="w-full accent-cyan-500 h-2"
                />
                <p className="text-xs text-gray-500 mt-0.5">Минимальный интервал между показами</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-5 border border-cyan-500/40">
            <h3 className="text-sm font-semibold text-cyan-300/90 mb-3 uppercase tracking-wider">Внешний вид</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Обводка текста</label>
                <select
                  value={currentAlert.textOutline ?? "none"}
                  onChange={(e) => handleChange("textOutline", e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-black/30 border border-cyan-500/40 rounded-lg text-white"
                >
                  <option value="none">Без обводки</option>
                  <option value="thin">Тонкая</option>
                  <option value="bold">Жирная</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Скорость анимации</label>
                <select
                  value={String(currentAlert.animationSpeed ?? 1)}
                  onChange={(e) => handleChange("animationSpeed", Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-black/30 border border-cyan-500/40 rounded-lg text-white"
                >
                  <option value="0.5">0.5× медленнее</option>
                  <option value="1">1×</option>
                  <option value="1.5">1.5× быстрее</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Фон</label>
                <input
                  type="color"
                  value={currentAlert.backgroundColor ?? "#8b5cf6"}
                  onChange={(e) => handleChange("backgroundColor", e.target.value)}
                  className="w-full h-9 bg-transparent border border-cyan-500/40 rounded-lg cursor-pointer block"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Текст</label>
                <input
                  type="color"
                  value={currentAlert.textColor ?? "#ffffff"}
                  onChange={(e) => handleChange("textColor", e.target.value)}
                  className="w-full h-9 bg-transparent border border-cyan-500/40 rounded-lg cursor-pointer block"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Шрифт</label>
                <select
                  value={currentAlert.fontFamily ?? "Inter"}
                  onChange={(e) => handleChange("fontFamily", e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-black/30 border border-cyan-500/40 rounded-lg text-white"
                >
                  <option value="Inter">Inter</option>
                  <option value="Arial">Arial</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Montserrat">Montserrat</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Размер</label>
                <input
                  type="number"
                  min={12}
                  max={32}
                  value={currentAlert.fontSize ?? 16}
                  onChange={(e) => handleChange("fontSize", Number(e.target.value) || undefined)}
                  className="w-full px-3 py-2 text-sm bg-black/30 border border-cyan-500/40 rounded-lg text-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-5 border border-cyan-500/40">
            <h3 className="text-sm font-semibold text-cyan-300/90 mb-3 uppercase tracking-wider">Звук</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm">Включить звук</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentAlert.soundEnabled}
                    onChange={(e) => handleChange("soundEnabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-cyan-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
              {currentAlert.soundEnabled && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Стандартный звук, если свой не задан</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentAlert.useDefaultSound ?? false}
                        onChange={(e) => handleChange("useDefaultSound", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-cyan-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Громкость {currentAlert.soundVolume}%</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={currentAlert.soundVolume}
                      onChange={(e) => handleChange("soundVolume", Number(e.target.value))}
                      className="w-full accent-cyan-500 h-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">URL звука</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentAlert.soundFile ?? ""}
                        onChange={(e) => handleChange("soundFile", e.target.value || undefined)}
                        placeholder="Ссылка на файл"
                        className="flex-1 px-3 py-2 text-sm bg-black/30 border border-cyan-500/40 rounded-lg text-white"
                      />
                      <button
                        type="button"
                        className="p-2 bg-cyan-600/20 border border-cyan-500/40 rounded-lg text-cyan-400 hover:bg-cyan-600/30"
                        title="Загрузить звук"
                      >
                        <FiUpload className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-5 border border-cyan-500/40">
            <h3 className="text-sm font-semibold text-cyan-300/90 mb-3 uppercase tracking-wider">Текст</h3>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                  <input type="checkbox" checked={currentAlert.showName} onChange={(e) => handleChange("showName", e.target.checked)} />
                  Имя
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                  <input type="checkbox" checked={currentAlert.showAmount} onChange={(e) => handleChange("showAmount", e.target.checked)} />
                  Сумма
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                  <input type="checkbox" checked={currentAlert.showMessage} onChange={(e) => handleChange("showMessage", e.target.checked)} />
                  Сообщение
                </label>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Шаблон</label>
                <input
                  type="text"
                  value={currentAlert.messageTemplate ?? ""}
                  onChange={(e) => handleChange("messageTemplate", e.target.value || undefined)}
                  placeholder="{name} задонатил {amount}!"
                  className="w-full px-3 py-2 text-sm bg-black/30 border border-cyan-500/40 rounded-lg text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Переменные: {"{name}"}, {"{amount}"}, {"{message}"}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={testAlertHandler}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white text-sm hover:bg-white/20"
            >
              <FiEye className="w-4 h-4" />
              Тестовый алерт
            </button>
            <button
              type="button"
              onClick={saveAlerts}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg text-white text-sm font-medium hover:shadow-lg disabled:opacity-50"
            >
              {saving ? "Сохранение…" : (
                <>
                  <FiSave className="w-4 h-4" />
                  Сохранить
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3. Превью — фиксированная колонка справа, липкая на десктопе */}
        <div className="xl:sticky xl:top-4 min-w-0">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-5 border border-cyan-500/40">
            <p className="text-xs text-gray-400 mb-3">Как будет выглядеть</p>
            <AlertInlinePreview
              settings={{
                enabled: currentAlert.enabled,
                animation: currentAlert.animation,
                position: currentAlert.position,
                backgroundColor: currentAlert.backgroundColor,
                textColor: currentAlert.textColor,
                fontFamily: currentAlert.fontFamily,
                fontSize: currentAlert.fontSize,
                showName: currentAlert.showName,
                showAmount: currentAlert.showAmount,
                showMessage: currentAlert.showMessage,
                messageTemplate: currentAlert.messageTemplate ?? null,
                imageUrl: currentAlert.imageUrl ?? null,
                textOutline: currentAlert.textOutline ?? "none",
                animationSpeed: currentAlert.animationSpeed ?? 1,
              }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {testAlert && (
          <AlertPreview
            key="test"
            type={selectedType}
            settings={{
              ...currentAlert,
              duration: currentAlert.duration,
              soundEnabled: currentAlert.soundEnabled,
              soundFile: currentAlert.soundFile ?? null,
              soundVolume: currentAlert.soundVolume,
              useDefaultSound: currentAlert.useDefaultSound ?? false,
              messageTemplate: currentAlert.messageTemplate ?? null,
              textOutline: currentAlert.textOutline ?? "none",
              animationSpeed: currentAlert.animationSpeed ?? 1,
            }}
            onClose={() => setTestAlert(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
