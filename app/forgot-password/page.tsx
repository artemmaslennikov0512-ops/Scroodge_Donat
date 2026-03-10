"use client";

import { useState } from "react";
import Link from "next/link";
import { FiUser, FiPhone, FiArrowLeft } from "react-icons/fi";
import MatrixRain from "@/components/MatrixRain";
import { getPhoneErrorMessage } from "@/lib/phone";

export default function ForgotPasswordPage() {
  const [login, setLogin] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const validatePhone = () => {
    const err = phone.trim() ? getPhoneErrorMessage(phone) : "Введите номер телефона";
    setPhoneError(err);
    return err === "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!login.trim()) {
      setError("Укажите логин");
      return;
    }
    const phoneErr = getPhoneErrorMessage(phone);
    if (phoneErr) {
      setPhoneError(phoneErr);
      setError(phoneErr);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: login.trim(), phone: phone.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage(data.message ?? "Если аккаунт с таким логином и номером телефона существует, на привязанную почту отправлена ссылка.");
        setLogin("");
        setPhone("");
        setPhoneError("");
      } else {
        setError(data.error ?? "Произошла ошибка. Попробуйте позже.");
      }
    } catch {
      setError("Ошибка соединения. Проверьте интернет.");
    } finally {
      setIsLoading(false);
    }
  };

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
            <h1 className="text-3xl font-bold text-white">Сброс пароля</h1>
            <p className="text-gray-400 mt-2">Введите логин и номер телефона, указанные при регистрации — ссылку для смены пароля отправим на вашу почту</p>
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
              </div>
            )}

            <div>
              <label htmlFor="forgot-login" className="block text-gray-300 text-sm mb-1">Логин</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="forgot-login"
                  name="login"
                  type="text"
                  placeholder="username"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-cyan-500/40 rounded-lg text-white focus:border-cyan-400 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="forgot-phone" className="block text-gray-300 text-sm mb-1">Номер телефона</label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="forgot-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+7 999 123-45-67"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneError) setPhoneError("");
                  }}
                  onBlur={validatePhone}
                  className={`w-full pl-10 pr-4 py-3 bg-black/30 border rounded-lg text-white focus:outline-none transition ${
                    phoneError ? "border-red-500/60" : "border-cyan-500/40 focus:border-cyan-400"
                  }`}
                  required
                />
              </div>
              {phoneError && <p className="text-red-400 text-sm mt-1">{phoneError}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-cyan-500 rounded-lg text-black font-bold hover:bg-cyan-400 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Отправить ссылку"
              )}
            </button>

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
