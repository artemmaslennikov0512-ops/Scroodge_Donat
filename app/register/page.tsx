"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import MatrixRain from "@/components/MatrixRain";
import {
  FiMail,
  FiLock,
  FiUser,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiX,
  FiArrowRight,
  FiPhone,
} from "react-icons/fi";
import { getPhoneErrorMessage } from "@/lib/phone";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const OAUTH_LABELS: Record<string, string> = {
  google: "Google",
  twitch: "Twitch",
  vk: "ВКонтакте",
  apple: "Apple",
};

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthProviders, setOauthProviders] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [phoneError, setPhoneError] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((data) => setOauthProviders(data.providers ?? []))
      .catch(() => setOauthProviders([]));
  }, []);

  const passwordStrength = {
    length: formData.password.length >= 8,
    number: /\d/.test(formData.password),
    uppercase: /[A-Z]/.test(formData.password),
    match:
      formData.password === formData.confirmPassword &&
      formData.password.length > 0,
  };
  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;

  const validatePhone = (value: string) => {
    if (!value.trim()) {
      setPhoneError("Введите номер телефона");
      return false;
    }
    const err = getPhoneErrorMessage(value);
    if (err) {
      setPhoneError(err);
      return false;
    }
    setPhoneError("");
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      toast.error("Необходимо принять условия оферты и пользовательского соглашения");
      return;
    }
    if (!validatePhone(formData.phone)) {
      toast.error(phoneError || "Проверьте номер телефона");
      return;
    }
    if (!passwordStrength.match || formData.password.length < 6) {
      toast.error("Пароль не соответствует требованиям или не совпадает");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          username: formData.username.trim(),
          name: formData.name.trim() || undefined,
          phone: formData.phone.trim(),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Ошибка регистрации");
      toast.success(result.message || "Регистрация успешна! Проверьте email для подтверждения.");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка регистрации");
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

      <div className="relative w-full max-w-6xl flex rounded-3xl overflow-hidden panel-hud">
        {/* Левая часть - преимущества */}
        <div className="hidden lg:flex w-1/2 bg-cyan-500/5 p-12 flex-col justify-between border-r border-cyan-500/30">
          <div>
            <div className="text-3xl font-bold mb-8">
              <span className="text-cyan-400">SCROOGE</span>
              <span className="text-white">DONAT</span>
            </div>

            <h2 className="text-4xl font-bold text-white mb-4">
              Начни зарабатывать на стримах
            </h2>

            <ul className="space-y-4 mb-8">
              {[
                "Мгновенные выплаты на карту",
                "Самая низкая комиссия 5%",
                "Интеграция с Twitch, YouTube, Discord",
                "Умные алерты и аналитика",
                "Поддержка 24/7",
              ].map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 text-gray-300"
                >
                  <span className="w-6 h-6 bg-cyan-500/30 border border-cyan-500/50 rounded-full flex items-center justify-center text-cyan-400 text-sm font-bold">
                    ✓
                  </span>
                  {item}
                </motion.li>
              ))}
            </ul>

            <div className="bg-black/30 rounded-xl p-6 backdrop-blur border border-cyan-500/30">
              <div className="text-sm text-gray-400 mb-2">УЖЕ С НАМИ</div>
              <div className="text-3xl font-bold text-cyan-400 mb-1">50,000+</div>
              <div className="text-sm text-gray-500">стримеров зарабатывают</div>
              <div className="flex mt-4 -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-cyan-500/30 border-2 border-[#0a0a0f] flex items-center justify-center text-xs text-cyan-400 font-bold"
                  >
                    👤
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full bg-black/50 border-2 border-[#0a0a0f] flex items-center justify-center text-xs text-white">
                  +50k
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300">
              Войти
            </Link>
          </div>
        </div>

        {/* Правая часть - форма */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12">
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2">
              Создать аккаунт
            </h2>
            <p className="text-gray-400 mb-8">
              Присоединяйся к сообществу стримеров
            </p>

            <form className="space-y-6" onSubmit={onSubmit}>
              <div>
                <label htmlFor="register-username" className="block text-gray-300 mb-2 text-sm">
                  Имя пользователя
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    id="register-username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-3 bg-black/30 border border-cyan-500/40 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition"
                    placeholder="@username"
                    required
                    minLength={3}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="register-email" className="block text-gray-300 mb-2 text-sm">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-3 bg-black/30 border border-cyan-500/40 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="register-phone" className="block text-gray-300 mb-2 text-sm">
                  Номер телефона
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    id="register-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (phoneError) setPhoneError("");
                    }}
                    onBlur={() => formData.phone && validatePhone(formData.phone)}
                    className={`w-full pl-10 pr-4 py-3 bg-black/30 border rounded-xl text-white focus:outline-none transition ${
                      phoneError ? "border-red-500/60 focus:border-red-400" : "border-cyan-500/40 focus:border-cyan-400"
                    }`}
                    placeholder="+7 999 123-45-67"
                    required
                  />
                </div>
                {phoneError && (
                  <p className="text-red-400 text-sm mt-1">{phoneError}</p>
                )}
              </div>

              <div>
                <label htmlFor="register-password" className="block text-gray-300 mb-2 text-sm">
                  Пароль
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    id="register-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full pl-10 pr-12 py-3 bg-black/30 border border-cyan-500/40 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                {formData.password && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-1 h-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 h-full rounded-full transition ${
                            i <= strengthScore
                              ? i === 1
                                ? "bg-red-500"
                                : i === 2
                                  ? "bg-yellow-500"
                                  : i === 3
                                    ? "bg-blue-500"
                                    : "bg-green-500"
                              : "bg-gray-700"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        {passwordStrength.length ? (
                          <FiCheck className="text-green-400" />
                        ) : (
                          <FiX className="text-red-400" />
                        )}
                        <span className="text-gray-400">8+ символов</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {passwordStrength.number ? (
                          <FiCheck className="text-green-400" />
                        ) : (
                          <FiX className="text-red-400" />
                        )}
                        <span className="text-gray-400">Цифры</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {passwordStrength.uppercase ? (
                          <FiCheck className="text-green-400" />
                        ) : (
                          <FiX className="text-red-400" />
                        )}
                        <span className="text-gray-400">Заглавные</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="register-confirm-password" className="block text-gray-300 mb-2 text-sm">
                  Подтвердите пароль
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    id="register-confirm-password"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-3 bg-black/30 border border-cyan-500/40 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition"
                    placeholder="••••••••"
                    required
                  />
                  {formData.confirmPassword && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {passwordStrength.match ? (
                        <FiCheck className="text-green-400" />
                      ) : (
                        <FiX className="text-red-400" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-cyan-500/40 bg-black/30 text-cyan-400 focus:ring-cyan-400"
                />
                <label htmlFor="terms" className="text-sm text-gray-400">
                  Я принимаю{" "}
                  <Link href="/oferta" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">
                    Договор-оферту
                  </Link>
                  ,{" "}
                  <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">
                    Пользовательское соглашение
                  </Link>
                  {" "}и{" "}
                  <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">
                    Политику конфиденциальности
                  </Link>
                  {" "}и{" "}
                  <Link href="/personal-data" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">
                    Политику обработки персональных данных
                  </Link>
                  . Нажимая «Создать аккаунт», вы соглашаетесь с указанными условиями.
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading || !agreeTerms}
                className="w-full py-4 bg-cyan-500 rounded-xl text-black font-bold flex items-center justify-center gap-2 disabled:opacity-70 hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition"
              >
                {isLoading ? "Регистрация..." : "Создать аккаунт"}
                <FiArrowRight className="group-hover:translate-x-1 transition" />
              </button>

              {oauthProviders.length > 0 && (
                <>
                  <div className="relative flex items-center gap-4">
                    <div className="flex-1 h-px bg-cyan-500/30" />
                    <span className="text-gray-500 text-sm">или через</span>
                    <div className="flex-1 h-px bg-cyan-500/30" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {oauthProviders.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          signIn(id, { callbackUrl: "/dashboard" })
                        }
                        className="py-2.5 px-3 rounded-xl bg-black/30 border border-cyan-500/40 text-gray-300 hover:border-cyan-400 hover:text-white transition text-sm font-medium"
                      >
                        {OAUTH_LABELS[id] ?? id}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="lg:hidden text-center mt-6">
                <span className="text-gray-500 text-sm">Уже есть аккаунт? </span>
                <Link
                  href="/login"
                  className="text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  Войти
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 left-4 bg-black/50 backdrop-blur-lg rounded-full px-4 py-2 border border-green-500/30 flex items-center gap-2 hidden sm:flex">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-sm text-gray-300">256-bit SSL защита</span>
      </div>

      <div className="fixed bottom-4 right-4 bg-cyan-500/10 backdrop-blur-lg rounded-full px-4 py-2 border border-cyan-500/40 hidden sm:flex items-center gap-2">
        <span className="text-sm text-gray-300">Сейчас регистрируются: </span>
        <span className="text-white font-bold">234</span>
        <span className="text-sm text-gray-500 ml-1">человека</span>
      </div>
    </div>
  );
}
