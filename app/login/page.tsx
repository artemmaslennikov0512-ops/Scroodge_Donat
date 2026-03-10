"use client";

import { Suspense, useState, useEffect } from "react";
import { signIn, getCsrfToken } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import MatrixRain from "@/components/MatrixRain";

const OAUTH_LABELS: Record<string, string> = {
  google: "Google",
  twitch: "Twitch",
  vk: "ВКонтакте",
  apple: "Apple",
};

/** Не даём callbackUrl указывать на страницу входа (избегаем цикла /login?callbackUrl=/login...) */
function getSafeCallbackUrl(searchParams: ReturnType<typeof useSearchParams>): string {
  const raw = searchParams.get("callbackUrl");
  if (!raw || typeof raw !== "string") return "/dashboard";
  try {
    const path = raw.startsWith("http") ? new URL(raw).pathname : raw;
    if (path === "/login" || path.startsWith("/login?")) return "/dashboard";
    return path.startsWith("/") ? path : `/${path}`;
  } catch {
    return "/dashboard";
  }
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [oauthProviders, setOauthProviders] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const callbackUrl = getSafeCallbackUrl(searchParams);

  // Показать ошибку, если вернулись с ?error= (NextAuth при неверном пароле)
  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "CredentialsSignin" || err === "CredentialsCreate") setError("Неверный email или пароль");
    else if (err) setError("Ошибка входа. Попробуйте снова.");
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((data) => setOauthProviders(data.providers ?? []))
      .catch(() => setOauthProviders([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      // CSRF с таймаутом — иначе getCsrfToken() может зависнуть (Docker/сеть) и кнопка «ничего не делает»
      const csrfPromise = getCsrfToken();
      const timeoutPromise = new Promise<string | null>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 8000)
      );
      let csrfToken: string | null = null;
      try {
        const token = await Promise.race([csrfPromise, timeoutPromise]);
        csrfToken = token ?? null;
      } catch {
        csrfToken = null;
      }
      if (!csrfToken) {
        // Запасной путь: стандартный signIn (как у админа — один запрос, без CSRF-зависимости от клиента)
        const result = await signIn("credentials", {
          email: formData.email.trim(),
          password: formData.password,
          redirect: false,
          callbackUrl: "/dashboard",
        });
        if (result?.error) {
          setError("Неверный email или пароль");
          return;
        }
        if (result?.ok || result?.url?.includes("dashboard")) {
          window.location.href = "/dashboard";
          return;
        }
        setError("Сервер не ответил вовремя. Обновите страницу или попробуйте позже.");
        return;
      }
      const body = new URLSearchParams({
        csrfToken,
        callbackUrl: "/dashboard",
        email: formData.email.trim(),
        password: formData.password,
        json: "true",
      });
      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.url?.includes("dashboard") || !data.error)) {
        window.location.href = "/dashboard";
        return;
      }
      setError("Неверный email или пароль");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg === "timeout"
          ? "Сервер не ответил вовремя. Обновите страницу."
          : "Ошибка соединения. Проверьте интернет и перезапустите приложение (Docker: docker compose up --build -d)."
      );
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
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-2xl font-light mb-6"
            >
              <span className="font-bold text-cyan-400">SCROOGE</span>
              <span className="text-white">DONAT</span>
            </Link>
            <h1 className="text-3xl font-bold text-white">Вход</h1>
            <p className="text-gray-400 mt-2">Рады снова вас видеть!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            <div>
              <label htmlFor="login-email" className="block text-gray-300 text-sm mb-1">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-cyan-500/40 rounded-lg text-white focus:border-cyan-400 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-gray-300 text-sm mb-1">Пароль</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
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

            <div className="flex items-center justify-between text-sm">
              <label htmlFor="login-remember" className="flex items-center gap-2 cursor-pointer">
                <input
                  id="login-remember"
                  name="remember"
                  type="checkbox"
                  className="rounded border-cyan-500/40 bg-black/30 text-cyan-400 focus:ring-cyan-400"
                />
                <span className="text-gray-400">Запомнить меня</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-cyan-400 hover:text-cyan-300"
              >
                Забыли пароль?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-cyan-500 rounded-lg text-black font-bold hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Вход...
                </>
              ) : (
                <>
                  Войти
                  <FiArrowRight />
                </>
              )}
            </button>

            {oauthProviders.length > 0 && (
              <>
                <div className="relative flex items-center gap-4">
                  <div className="flex-1 h-px bg-cyan-500/30" />
                  <span className="text-gray-500 text-sm">или войти через</span>
                  <div className="flex-1 h-px bg-cyan-500/30" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {oauthProviders.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        signIn(id, { callbackUrl })
                      }
                      className="py-2.5 px-3 rounded-lg bg-black/30 border border-cyan-500/40 text-gray-300 hover:border-cyan-400 hover:text-white transition text-sm font-medium"
                    >
                      {OAUTH_LABELS[id] ?? id}
                    </button>
                  ))}
                </div>
              </>
            )}

            <p className="text-center text-gray-500 text-sm">
              Ещё нет аккаунта?{" "}
              <Link
                href="/register"
                className="text-cyan-400 hover:text-cyan-300"
              >
                Зарегистрироваться
              </Link>
            </p>

            <p className="text-center text-gray-500 text-sm">
              Вы администратор?{" "}
              <Link
                href="/admin/login"
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                Вход в панель управления
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
          <div className="text-white">Загрузка...</div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
