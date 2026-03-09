"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiRefreshCw,
  FiArrowRight,
  FiMail,
} from "react-icons/fi";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    setResendMessage("");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setResendMessage("Письмо отправлено! Проверьте почту.");
        setCountdown(data.canResendAfter ? data.canResendAfter * 60 : 60);
      } else {
        if (res.status === 429 && data.canResendAfter) {
          setCountdown(data.canResendAfter * 60);
          setResendMessage(
            `Подождите ${data.canResendAfter} мин. перед повторной отправкой`
          );
        } else {
          setResendMessage(data.error || "Ошибка отправки");
        }
      }
    } catch {
      setResendMessage("Ошибка отправки");
    } finally {
      setResending(false);
    }
  };

  if (success === "true") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-grid-premium opacity-30" />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-green-500/30 max-w-md w-full text-center"
        >
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-green-500/20 rounded-full mx-auto flex items-center justify-center">
              <FiCheckCircle className="text-5xl text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Email подтвержден! 🎉</h1>
          <p className="text-gray-400 mb-8">
            Ваш аккаунт успешно верифицирован. Теперь вам доступны все функции платформы.
          </p>
          <div className="bg-gradient-to-r from-pink-600/20 to-pink-500/20 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300">✅ Полный доступ</span>
              <span className="text-green-400">Активен</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300">✅ Прием донатов</span>
              <span className="text-green-400">Разблокирован</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">✅ Вывод средств</span>
              <span className="text-green-400">Доступен</span>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl text-white font-bold hover:shadow-lg transition group"
          >
            Перейти в личный кабинет
            <FiArrowRight className="group-hover:translate-x-1 transition" />
          </Link>
        </motion.div>
      </div>
    );
  }

  const getErrorText = () => {
    switch (error) {
      case "expired":
        return "Срок действия ссылки истек";
      case "invalid-token":
        return "Недействительная ссылка";
      case "already-used":
        return "Эта ссылка уже была использована";
      case "no-token":
        return "Отсутствует токен подтверждения";
      case "invalid-type":
        return "Неверный тип ссылки";
      default:
        return "Произошла ошибка при подтверждении";
    }
  };

  const getErrorDescription = () => {
    switch (error) {
      case "expired":
        return "Ссылка для подтверждения действительна только 24 часа. Запросите новое письмо.";
      case "already-used":
        return "Ваш email уже подтвержден. Попробуйте войти в аккаунт.";
      default:
        return "Попробуйте запросить новое письмо для подтверждения.";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-premium opacity-30" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-red-500/30 max-w-md w-full"
      >
        <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          {error === "expired" ? (
            <FiClock className="text-4xl text-red-400" />
          ) : (
            <FiXCircle className="text-4xl text-red-400" />
          )}
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          {getErrorText()}
        </h1>
        <p className="text-gray-400 text-center mb-8">{getErrorDescription()}</p>

        {error !== "already-used" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || countdown > 0}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FiRefreshCw className={resending ? "animate-spin" : ""} />
              {countdown > 0
                ? `Отправить через ${countdown}с`
                : resending
                  ? "Отправка..."
                  : "Отправить новое письмо"}
            </button>
            {resendMessage && (
              <p className="text-sm text-center text-gray-400">{resendMessage}</p>
            )}
            <div className="bg-pink-600/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-pink-400 mb-2">
                <FiMail />
                Письмо придет на email
              </div>
              <p className="text-xs text-gray-500">
                Проверьте папку «Спам», если письмо не приходит
              </p>
            </div>
          </div>
        )}

        {error === "already-used" && (
          <Link
            href="/login"
            className="block w-full py-3 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg text-center font-bold"
          >
            Войти в аккаунт
          </Link>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-400">
            Вернуться на главную
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-gray-400">Загрузка...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
