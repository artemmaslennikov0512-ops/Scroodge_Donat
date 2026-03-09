"use client";

import { motion } from "framer-motion";
import {
  FiHeart,
  FiBarChart2,
  FiBell,
  FiZap,
  FiShield,
  FiGlobe,
  FiCreditCard,
  FiUsers,
  FiMessageCircle,
} from "react-icons/fi";

const INTRO_ITEMS = [
  {
    emoji: "💰",
    icon: FiHeart,
    title: "Страница доната",
    desc: "Красивая форма, цели, последние донаты — всё в одном месте. Работает на телефонах и ПК.",
  },
  {
    emoji: "📊",
    icon: FiBarChart2,
    title: "Личный кабинет",
    desc: "Статистика в реальном времени, управление целями, настройка алертов — интуитивно и удобно.",
  },
  {
    emoji: "🛡️",
    icon: FiBell,
    title: "Виджеты на стриме",
    desc: "Алерты, полоска цели, топ донатеров — всё настраивается под ваш стиль и работает в OBS.",
  },
];

const STATS = [
  { value: "50K+", label: "стримеров", icon: FiUsers },
  { value: "10M+", label: "донатов", icon: FiHeart },
  { value: "99.9%", label: "аптайм", icon: FiZap },
  { value: "24/7", label: "поддержка", icon: FiMessageCircle },
];

const FEATURES = [
  { icon: FiZap, title: "Мгновенные выплаты", desc: "Деньги на карте за секунды" },
  { icon: FiShield, title: "Банковская безопасность", desc: "256-битное шифрование и 2FA" },
  { icon: FiGlobe, title: "Все платформы сразу", desc: "Twitch, YouTube, Trovo, Kick" },
  { icon: FiBarChart2, title: "Умная аналитика", desc: "Прогнозы и тепловые карты" },
  { icon: FiBell, title: "Кастомные алерты", desc: "Свои звуки и анимации" },
  { icon: FiCreditCard, title: "20+ способов оплаты", desc: "Карты, крипта, кошельки" },
];

export default function LandingFeatures() {
  return (
    <>
      <section className="py-16 sm:py-20 md:py-24 px-6">
        <div className="container mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-4">
            Всё, что нужно для{" "}
            <span className="text-cyan-400">успешных стримов</span>
          </h2>
          <p className="text-center text-gray-400 mb-12 md:mb-16 max-w-2xl mx-auto">
            Посмотри, как это работает — интерфейсы, которые полюбят и стримеры,
            и зрители.
          </p>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 items-stretch">
            {INTRO_ITEMS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="panel-hud p-6 flex flex-col text-left border border-cyan-500/30 hover:border-pink-500/40 hover:shadow-[0_0_24px_rgba(236,72,153,0.12)] transition-all duration-300"
              >
                <span className="text-3xl mb-3 block">{item.emoji}</span>
                <div className="relative h-32 mb-4 overflow-hidden rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                  <item.icon className="text-5xl text-cyan-400/50" />
                  <div className="absolute inset-0 bg-cyber-grid opacity-20" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm flex-1">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16 border-y border-cyan-500/20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="text-4xl text-cyan-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-16 sm:py-20 md:py-24 px-6">
        <div className="container mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-4"
          >
            Поднимись на лифте и открой{" "}
            <span className="text-cyan-400">уникальные возможности</span>
          </motion.h2>
          <p className="text-center text-gray-400 mb-12 md:mb-16 max-w-2xl mx-auto">
            Каждый этаж — это новая фича, которой нет у конкурентов.
          </p>
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
                className="panel-hud p-6 md:p-8 hover:border-pink-500/30 hover:shadow-[0_0_24px_rgba(236,72,153,0.1)] transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-cyan-500/20 border border-cyan-500/40 mb-6 flex items-center justify-center">
                  <feat.icon className="text-3xl text-cyan-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                  {feat.title}
                </h3>
                <p className="text-gray-400 text-sm md:text-base">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
