"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiLock, FiEye, FiEyeOff, FiArrowLeft } from "react-icons/fi";
import MatrixRain from "@/components/MatrixRain";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (newPassword !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    if (newPassword.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }
    if (!tokenFromUrl) {
      setError("Отсутствует ссылка для сброса. Запросите новую на странице «Забыли пароль?».");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenFromUrl, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage("Пароль успешно изменён. Теперь войдите с новым паролем.");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.error ?? "Не удалось сменить пароль. Ссылка могла истечь — запросите новую.");
      }
    } catch {
      setError("Ошибка соединения. Проверьте интернет.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!tokenFromUrl) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative">
        <MatrixRain color="#00ff41" fontSize={16} speed={16} density={0.35} className="opacity-20 z-0" />
        <div className="relative w-full max-w-md panel-hud p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Неверная ссылка</h1>
          <p className="text-gray-400 mb-6">
            Ссылка для сброса пароля отсутствует или неверна. Запросите новую на странице входа.
          </p>
          <Link href="/forgot-password" className="text-cyan-400 hover:text-cyan-300 underline">
            Забыли пароль?
          </Link>
          <span className="text-gray-500 mx-2">|</span>
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300 underline">
            Войти
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative">
      <MatrixRain color="#00ff41" fontSize={16} speed={16} density={0.35} className="opacity-20 z-0" />
      <div className="cyber-sphere-1" />
      <div className="cyber-sphere-2" />
      <div className="fixed inset-0 bg-cyber-grid opacity-20 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="panel-hud p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-light mb-6">
              <span className="font-bold text-cyan-400">SCROOGE</span>
              <span className="text-white">DONAT</span>
            </Link>
            <h1 className="text-3xl font-bold text-white">Новый пароль</h1>
            <p className="text-gray-400 mt-2">Введите новый пароль и подтвердите его</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 text-sm">
                {message}
                <p className="mt-2">
                  <Link href="/login" className="underline font-medium">Перейти к входу</Link>
                </p>
              </div>
            )}

            {!message && (
              <>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Новый пароль</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                      className="w-full pl-10 pr-12 py-3 bg-black/30 border border-cyan-500/40 rounded-lg text-white focus:border-cyan-400 focus:outline-none transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-1">Подтвердите пароль</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 bg-black/30 border border-cyan-500/40 rounded-lg text-white focus:border-cyan-400 focus:outline-none transition"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-cyan-500 rounded-lg text-black font-bold hover:bg-cyan-400 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Сохранить пароль"
                  )}
                </button>
              </>
            )}

            <p className="text-center">
              <Link href="/login" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm">
                <FiArrowLeft /> Вернуться к входу
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">Загрузка...</div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
