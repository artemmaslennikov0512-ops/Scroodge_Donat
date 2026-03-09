"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import { FaShieldAlt, FaEye, FaEyeSlash } from "react-icons/fa";
import { parseJsonFromResponse } from "@/lib/fetchJson";
import MatrixRain from "@/components/MatrixRain";

const schema = yup.object({
  email: yup.string().email("Неверный email").required("Email обязателен"),
  password: yup.string().required("Пароль обязателен"),
});

type FormData = yup.InferType<typeof schema>;

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const result = await parseJsonFromResponse<{
        message?: string;
        mustChangePassword?: boolean;
      }>(res);

      if (!res.ok) {
        throw new Error(result.message ?? "Ошибка входа");
      }

      if (result.mustChangePassword) {
        toast.success("Требуется смена пароля при первом входе.");
        router.push("/admin/change-password");
        return;
      }
      toast.success("Добро пожаловать в панель управления!");
      router.push("/admin/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка входа");
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-cyan-500/20 border border-cyan-500/40 mb-4">
              <FaShieldAlt className="text-3xl text-cyan-400" />
            </div>
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-light mb-2">
              <span className="font-bold text-cyan-400">SCROOGE</span>
              <span className="text-white">DONAT</span>
            </Link>
            <h1 className="text-2xl font-bold text-white mt-4">Панель управления</h1>
            <p className="text-gray-400 mt-1 text-sm">Вход для администраторов</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-gray-300 text-sm mb-1">Email</label>
              <input
                {...register("email")}
                type="email"
                placeholder="admin@example.com"
                className="w-full px-4 py-3 bg-black/30 border border-cyan-500/40 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none transition"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1">Пароль</label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 bg-black/30 border border-cyan-500/40 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition"
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-cyan-500 rounded-lg text-black font-bold hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Вход...
                </>
              ) : (
                "Войти в панель"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-cyan-500/30">
            <p className="text-center text-sm text-gray-500">
              <span className="inline-block mr-2">🔒</span> SSL
              <span className="inline-block mx-2">•</span>
              <span className="inline-block">Логирование</span>
            </p>
            <p className="text-center text-sm text-gray-500 mt-4">
              <Link href="/login" className="text-cyan-400 hover:text-cyan-300">
                Вход для стримеров →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
