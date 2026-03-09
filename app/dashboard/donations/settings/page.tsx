"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import {
  FiSave,
  FiToggleLeft,
  FiToggleRight,
  FiMessageSquare,
  FiArrowLeft,
  FiHelpCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import BackButton from "@/components/BackButton";

const settingsSchema = z.object({
  enabled: z.boolean(),
  minAmount: z.number().min(1, "Минимальная сумма не может быть меньше 1"),
  maxAmount: z.number().optional(),
  defaultMessage: z.string().max(500, "Максимум 500 символов").optional(),
  showDonorName: z.boolean(),
  allowAnonymous: z.boolean(),
  notificationEmail: z.string().email("Неверный email").optional().or(z.literal("")),
  notificationDiscord: z.string().url("Неверный URL Discord webhook").optional().or(z.literal("")),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const defaultSettings: SettingsForm = {
  enabled: true,
  minAmount: 50,
  maxAmount: 100000,
  defaultMessage: "Спасибо за поддержку!",
  showDonorName: true,
  allowAnonymous: true,
  notificationEmail: "",
  notificationDiscord: "",
};

export default function DonationSettingsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaultSettings,
  });

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/dashboard/donations/settings")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json: { donationSettings?: Partial<SettingsForm> }) => {
        const s = json.donationSettings;
        if (s && typeof s === "object") {
          reset({
            enabled: s.enabled ?? defaultSettings.enabled,
            minAmount: s.minAmount ?? defaultSettings.minAmount,
            maxAmount: s.maxAmount ?? defaultSettings.maxAmount,
            defaultMessage: s.defaultMessage ?? defaultSettings.defaultMessage,
            showDonorName: s.showDonorName ?? defaultSettings.showDonorName,
            allowAnonymous: s.allowAnonymous ?? defaultSettings.allowAnonymous,
            notificationEmail: (s.notificationEmail as string) ?? defaultSettings.notificationEmail,
            notificationDiscord: (s.notificationDiscord as string) ?? defaultSettings.notificationDiscord,
          });
        }
      })
      .catch(() => toast.error("Не удалось загрузить настройки"))
      .finally(() => setIsLoading(false));
  }, [status, reset]);

  const enabled = watch("enabled");

  const onSubmit = async (data: SettingsForm) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/dashboard/donations/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: data.enabled,
          minAmount: data.minAmount,
          maxAmount: data.maxAmount || undefined,
          defaultMessage: data.defaultMessage || undefined,
          showDonorName: data.showDonorName,
          allowAnonymous: data.allowAnonymous,
          notificationEmail: data.notificationEmail || null,
          notificationDiscord: data.notificationDiscord || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Ошибка сохранения");
      }
      toast.success("Настройки сохранены");
      reset(data, { keepDirty: false });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка при сохранении");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <BackButton />
          <Link
            href="/dashboard/donations"
            className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition"
          >
            <FiArrowLeft />
            К донатам
          </Link>
          <h1 className="text-3xl font-bold text-white">Настройки донатов</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {isLoading && (
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-pink-500/40 text-center text-gray-400">
              Загрузка настроек...
            </div>
          )}
          {!isLoading && (
          <>
          <section className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-pink-500/40">
            <h2 className="text-xl font-bold text-white mb-4">Основные параметры</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {enabled ? (
                    <FiToggleRight className="text-3xl text-green-400" aria-hidden />
                  ) : (
                    <FiToggleLeft className="text-3xl text-red-400" aria-hidden />
                  )}
                  <div>
                    <p className="text-white font-medium">Приём донатов</p>
                    <p className="text-sm text-gray-400">
                      {enabled ? "Донаты принимаются" : "Приём донатов остановлен"}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" {...register("enabled")} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600" />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Минимальная сумма (₽)</label>
                  <input
                    type="number"
                    {...register("minAmount", { valueAsNumber: true })}
                    className="w-full px-4 py-2 bg-black/30 border border-pink-500/40 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  />
                  {errors.minAmount && (
                    <p className="text-red-400 text-sm mt-1">{errors.minAmount.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Максимальная сумма (₽) (опц.)</label>
                  <input
                    type="number"
                    {...register("maxAmount", { valueAsNumber: true })}
                    className="w-full px-4 py-2 bg-black/30 border border-pink-500/40 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Сообщение по умолчанию</label>
                <textarea
                  {...register("defaultMessage")}
                  rows={3}
                  className="w-full px-4 py-2 bg-black/30 border border-pink-500/40 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  placeholder="Спасибо за донат!"
                />
                {errors.defaultMessage && (
                  <p className="text-red-400 text-sm mt-1">{errors.defaultMessage.message}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("showDonorName")}
                    className="rounded border-gray-600 bg-black/30 text-pink-400 focus:ring-pink-500"
                  />
                  <span className="text-gray-300">Показывать имя донатера</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("allowAnonymous")}
                    className="rounded border-gray-600 bg-black/30 text-pink-400 focus:ring-pink-500"
                  />
                  <span className="text-gray-300">Разрешить анонимные донаты</span>
                </label>
              </div>
            </div>
          </section>

          <section className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-pink-500/40">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FiMessageSquare className="text-pink-400" />
              Уведомления о донатах
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Укажите email или Discord-вебхук — вы будете получать уведомление при новом донате. Алерты на стриме (звук, анимация) настраиваются в разделе{" "}
              <Link href="/dashboard/alerts" className="text-pink-400 hover:underline">
                Алерты
              </Link>
              .
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email для уведомлений</label>
                <input
                  type="email"
                  {...register("notificationEmail")}
                  className="w-full px-4 py-2 bg-black/30 border border-pink-500/40 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  placeholder="streamer@example.com"
                />
                {errors.notificationEmail && (
                  <p className="text-red-400 text-sm mt-1">{errors.notificationEmail.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Discord Webhook URL</label>
                <input
                  type="url"
                  {...register("notificationDiscord")}
                  className="w-full px-4 py-2 bg-black/30 border border-pink-500/40 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  placeholder="https://discord.com/api/webhooks/..."
                />
                {errors.notificationDiscord && (
                  <p className="text-red-400 text-sm mt-1">{errors.notificationDiscord.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Настройте вебхук в Discord для автоматических уведомлений
                </p>
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving || !isDirty}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg text-white font-medium hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <FiSave />
                  Сохранить настройки
                </>
              )}
            </button>
          </div>
          </>
          )}
        </form>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
          <FiHelpCircle className="text-blue-400 text-xl flex-shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="text-blue-400 font-medium mb-1">Как это работает</p>
            <p className="text-sm text-gray-400">
              Настройки вступают в силу сразу после сохранения. Алерты на стриме настраиваются в разделе «Алерты», ссылку для OBS — в «Интеграции».
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
