"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import { FaKey, FaEye, FaEyeSlash } from "react-icons/fa";
import { parseJsonFromResponse } from "@/lib/fetchJson";
import MatrixRain from "@/components/MatrixRain";

const schema = yup.object({
  currentPassword: yup.string().required("Введите текущий пароль"),
  newPassword: yup
    .string()
    .min(8, "Не менее 8 символов")
    .required("Введите новый пароль"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Пароли не совпадают")
    .required("Подтвердите новый пароль"),
});

type FormData = yup.InferType<typeof schema>;

export default function AdminChangePassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
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
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await parseJsonFromResponse<{ message?: string }>(res);

      if (!res.ok) {
        throw new Error(result.message ?? "Ошибка смены пароля");
      }

      toast.success("Пароль изменён. Добро пожаловать!");
      router.push("/admin/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка смены пароля");
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
              <FaKey className="text-3xl text-cyan-400" />
            </div>
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-light mb-2">
              <span className="font-bold text-cyan-400">SCROOGE</span>
              <span className="text-white">DONAT</span>
            </Link>
            <h1 className="text-2xl font-bold text-white mt-4">Смена пароля</h1>
            <p className="text-gray-400 mt-1 text-sm">Для первого входа задайте новый пароль</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-gray-300 text-sm mb-1">Текущий пароль</label>
              <div className="relative">
                <input
                  {...register("currentPassword")}
                  type={showCurrent ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 bg-black/30 border border-cyan-500/40 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition"
                  aria-label={showCurrent ? "Скрыть" : "Показать"}
                >
                  {showCurrent ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1">Новый пароль (не менее 8 символов)</label>
              <div className="relative">
                <input
                  {...register("newPassword")}
                  type={showNew ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 bg-black/30 border border-cyan-500/40 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition"
                  aria-label={showNew ? "Скрыть" : "Показать"}
                >
                  {showNew ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1">Подтверждение нового пароля</label>
              <input
                {...register("confirmPassword")}
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-black/30 border border-cyan-500/40 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none transition"
              />
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
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
                  Сохранение...
                </>
              ) : (
                "Сохранить новый пароль"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link href="/admin/login" className="text-cyan-400 hover:text-cyan-300">← Назад к входу</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
