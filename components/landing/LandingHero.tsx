"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";

export default function LandingHero() {
  return (
    <section className="relative pt-32 pb-20 px-6">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block px-4 py-2 bg-cyan-500/10 border border-cyan-500/40 rounded-full text-sm text-cyan-400 mb-6">
              🔥 Более 50 000 стримеров доверяют нам
            </div>
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6 tracking-tight"
              style={{
                fontWeight: 800,
                color: "rgba(235, 242, 250, 0.9)",
                textShadow:
                  "0 0 40px rgba(34, 211, 238, 0.18), 0 0 80px rgba(34, 211, 238, 0.08)",
              }}
            >
              Зарабатывай на стримах до{" "}
              <span className="text-neon-pink">40%</span> больше
            </h1>
            <p className="text-base sm:text-lg text-[#9ca3af] mb-8 max-w-lg">
              Платформа для донатов с умной аналитикой, геймификацией и самой
              низкой комиссией.
            </p>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
              <div className="landing-glass-card p-4 sm:p-5 text-center">
                <div className="text-4xl sm:text-[48px] font-bold text-white leading-none">
                  3%
                </div>
                <div className="text-xs text-white/60 mt-1">комиссия</div>
              </div>
              <div className="landing-glass-card p-4 sm:p-5 text-center">
                <div className="text-4xl sm:text-[48px] font-bold text-white leading-none">
                  0₽
                </div>
                <div className="text-xs text-white/60 mt-1">вывод на карту</div>
              </div>
              <div className="landing-glass-card p-4 sm:p-5 text-center">
                <div className="text-4xl sm:text-[48px] font-bold text-white leading-none">
                  ⚡
                </div>
                <div className="text-xs text-white/60 mt-1">мгновенно</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold btn-landing-cta w-full sm:w-auto justify-center"
              >
                Начать зарабатывать
                <FiArrowRight />
              </Link>
              <button
                type="button"
                onClick={() =>
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
                }
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold btn-landing-outline w-full sm:w-auto"
              >
                Смотреть демо
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="panel-hud p-6 rounded-2xl"
          >
            <h2 className="text-xl font-semibold text-cyan-400 mb-4">
              Взаимодействие
            </h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-cyan-500/30 border-2 border-cyan-500/50 transition-all duration-300 hover:border-pink-500/70 hover:shadow-[0_0_20px_rgba(236,72,153,0.35)] flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-white font-bold">stream_king</div>
                <div className="text-xs text-gray-400">
                  Стример • 12.3k зрителей
                </div>
              </div>
            </div>

            <div className="bg-black/40 rounded-xl p-4 mb-4 border border-cyan-500/40">
              <div className="text-sm text-gray-400 mb-1">Текущая цель</div>
              <div className="font-medium text-white mb-1">Новый компьютер</div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">24 500 ₽</span>
                <span className="text-cyan-400">150 000 ₽</span>
              </div>
              <div className="w-full h-2.5 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-pink-500 to-cyan-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "25%" }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>

            <div className="mb-4">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Введите сумму, ₽"
                className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-[#6b7280] focus:border-pink-500/50 focus:outline-none focus:ring-1 focus:ring-pink-500/30 transition"
              />
            </div>
            <Link
              href="/register"
              className="w-full py-3 rounded-xl font-bold transition btn-landing-purple hover:-translate-y-0.5 hover:shadow-lg block text-center"
            >
              Поддержать
            </Link>

            <div className="text-center text-xs text-gray-500 mt-3">
              🔒 Безопасный платеж
            </div>

            <div className="mt-4 pt-3 border-t border-cyan-500/30 overflow-hidden">
              <div
                className="animate-marquee whitespace-nowrap text-pink-400/90"
                style={{ paddingRight: "100%" }}
              >
                🔥 Аноним 500 ₽ &nbsp;•&nbsp; 🔥 Игорь 1500 ₽ &nbsp;•&nbsp; 🔥
                Мария 300 ₽ &nbsp;•&nbsp; 🔥 Аноним 500 ₽ &nbsp;•&nbsp; 🔥 Игорь
                1500 ₽ &nbsp;•&nbsp; 🔥 Мария 300 ₽
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
