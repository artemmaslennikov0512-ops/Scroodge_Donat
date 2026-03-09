"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FiHeart, FiLock, FiUser, FiMessageSquare } from "react-icons/fi";
import { CSRF_HEADER_NAME, STUB_CLIENT_SECRET } from "@/lib/constants";

function buildSchema(minAmount: number, maxAmount: number) {
  return yup.object({
    amount: yup
      .number()
      .min(minAmount, `Минимальная сумма ${minAmount} ₽`)
      .max(maxAmount, `Максимальная сумма ${maxAmount} ₽`)
      .required("Сумма обязательна"),
    name: yup.string().max(100).optional(),
    message: yup.string().max(500, "Максимум 500 символов").optional(),
    isAnonymous: yup.boolean().optional(),
  });
}

type FormData = {
  amount: number;
  name?: string;
  message?: string;
  isAnonymous?: boolean;
};

export interface DonationWidgetProps {
  streamerId: string;
  streamId?: string;
  minAmount?: number;
  maxAmount?: number;
  allowAnonymous?: boolean;
  defaultMessage?: string;
  goalId?: string | null;
}

const PRESET_AMOUNTS = [100, 300, 500, 1000];
const EMOJIS = ["🔥", "🎉", "💎", "❤️", "👍", "😊"];

export function DonationWidget({
  streamerId,
  streamId,
  minAmount = 10,
  maxAmount = 100000,
  allowAnonymous = true,
  defaultMessage,
  goalId,
}: DonationWidgetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState("");

  useEffect(() => {
    fetch("/api/csrf", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrfToken))
      .catch(() => toast.error("Ошибка загрузки"));
  }, []);

  const schema = buildSchema(minAmount, maxAmount);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      amount: Math.min(minAmount, 500),
      isAnonymous: false,
    },
  });

  const amount = watch("amount");

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      // Свежий CSRF перед каждой отправкой — после редиректа/назад cookie и state могут расходиться
      const csrfRes = await fetch("/api/csrf", { credentials: "include" });
      const { csrfToken: token } = await csrfRes.json();
      if (!token) {
        toast.error("Не удалось получить токен безопасности. Обновите страницу.");
        setIsLoading(false);
        return;
      }

      let message = data.message ?? null;
      if (!data.isAnonymous && data.name?.trim()) {
        const from = `От: ${data.name.trim()}`;
        message = message ? `${from}\n${message}` : from;
      }

      const amount = Number(data.amount);
      if (Number.isNaN(amount) || amount < minAmount || amount > maxAmount) {
        toast.error(`Введите сумму от ${minAmount} до ${maxAmount} ₽`);
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/donations/create", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          [CSRF_HEADER_NAME]: token,
        },
        body: JSON.stringify({
          streamerId,
          streamId: streamId ?? null,
          amount,
          message,
          isAnonymous: data.isAnonymous ?? false,
          goalId: goalId ?? undefined,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error ?? "Ошибка создания доната");
      }

      const { clientSecret, donationId } = json;
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const successUrl = `${origin}/donation/success?donationId=${donationId}`;

      if (clientSecret === STUB_CLIENT_SECRET) {
        window.location.href = successUrl;
        return;
      }

      // Позже: редирект на страницу ввода карты платежки
      window.location.href = successUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка платежа");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="panel-hud rounded-xl p-6">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <h2 className="text-2xl font-bold text-white mb-2">Поддержать стримера</h2>
        <p className="text-gray-400 mb-6">Ваш донат поможет развитию канала</p>

        <div>
          <label className="block text-gray-300 text-sm mb-2">Выберите сумму</label>
          <div className="flex gap-2 mb-3 flex-wrap">
            {PRESET_AMOUNTS.filter((p) => p >= minAmount && p <= maxAmount).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setValue("amount", preset)}
                className={`flex-1 min-w-[4rem] py-2 border rounded-lg transition ${
                  amount === preset
                    ? "bg-cyan-500 border-cyan-400 text-black font-medium"
                    : "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20"
                }`}
              >
                {preset}₽
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-1">Или введите сумму (₽)</label>
          <input
            type="number"
            {...register("amount", { valueAsNumber: true })}
            min={minAmount}
            max={maxAmount}
            className="w-full px-4 py-3 bg-black/30 border border-cyan-500/40 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none transition"
            placeholder="Например, 500"
          />
          {errors.amount && <p className="text-red-400 text-sm mt-1">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-1">Ваше имя (необязательно)</label>
          <div className="relative">
            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              {...register("name")}
              className="w-full pl-10 pr-4 py-3 bg-black/30 border border-cyan-500/40 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none transition"
              placeholder="Аноним"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-2">Добавьте эмоцию (необязательно)</label>
          <div className="flex gap-2 flex-wrap">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setSelectedEmoji(emoji);
                  const msg = watch("message") ?? "";
                  setValue("message", msg ? `${msg} ${emoji}` : emoji);
                }}
                className={`w-10 h-10 rounded-lg border text-xl flex items-center justify-center transition ${
                  selectedEmoji === emoji
                    ? "bg-pink-500 border-pink-400 text-white"
                    : "bg-pink-500/10 border-pink-500/40 hover:bg-pink-500/20 text-pink-400"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-1">Сообщение (необязательно)</label>
          <div className="relative">
            <FiMessageSquare className="absolute left-3 top-3 text-gray-500" />
            <textarea
              {...register("message")}
              rows={3}
              className="w-full pl-10 pr-4 py-3 bg-black/30 border border-cyan-500/40 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none transition resize-none"
              placeholder={defaultMessage ?? "Напишите что-нибудь..."}
            />
          </div>
          {errors.message && <p className="text-red-400 text-sm mt-1">{errors.message.message}</p>}
        </div>

        {allowAnonymous && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register("isAnonymous")}
              className="rounded border-cyan-500/40 bg-black/30 text-cyan-400 focus:ring-cyan-400"
            />
            <span className="text-sm text-gray-300">Отправить анонимно</span>
          </label>
        )}

        <p className="text-cyan-400/80 text-sm">После нажатия кнопки вас перенаправит на страницу оплаты (платёжка будет подключена позже).</p>

        <p className="text-gray-400 text-xs">
          Нажимая «Поддержать», вы соглашаетесь с{" "}
          <Link href="/oferta" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">
            Договором-офертой
          </Link>
          {" "}и{" "}
          <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">
            Пользовательским соглашением
          </Link>
          .
        </p>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-cyan-500 rounded-lg text-black font-bold hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Обработка...
            </>
          ) : (
            <>
              <FiHeart />
              Поддержать
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4">
          <FiLock />
          <span>Безопасная оплата</span>
        </div>
      </motion.form>
    </div>
  );
}
