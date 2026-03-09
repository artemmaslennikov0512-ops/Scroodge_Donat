"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiStar, FiAward, FiCpu, FiCheck } from "react-icons/fi";

const PLANS = [
  {
    name: "Стартовый",
    price: "0",
    features: ["Комиссия 5%", "Базовые алерты", "До 10 000 ₽/мес"],
    icon: FiStar,
    popular: false,
  },
  {
    name: "Профессиональный",
    price: "990",
    features: [
      "Комиссия 3%",
      "Кастомные алерты",
      "Приоритетная поддержка",
      "До 500 000 ₽/мес",
    ],
    icon: FiAward,
    popular: true,
  },
  {
    name: "Партнерский",
    price: "2 990",
    features: [
      "Комиссия 1%",
      "Эксклюзивные алерты",
      "Персональный менеджер",
      "Безлимит",
    ],
    icon: FiCpu,
    popular: false,
  },
];

export default function LandingPricing() {
  return (
    <section id="pricing" className="py-16 sm:py-20 md:py-24 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <div className="inline-block px-4 py-2 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-cyan-400 text-sm mb-4">
            ⚡ Самая низкая комиссия на рынке
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Прозрачные <span className="text-cyan-400">тарифы</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Выбирай план и начинай зарабатывать больше
          </p>
        </div>
        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PLANS.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
              className={`relative rounded-2xl p-6 md:p-8 panel-hud ${
                plan.popular
                  ? "scale-105 border-cyan-500 shadow-xl shadow-cyan-500/20"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-500 px-4 py-1 rounded-full text-sm font-bold text-black">
                  РЕКОМЕНДУЕМ
                </div>
              )}
              <plan.icon className="text-4xl text-cyan-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                {plan.price !== "0" && (
                  <span className="text-gray-300"> ₽/мес</span>
                )}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center text-gray-300">
                    <FiCheck className="text-cyan-400 mr-2 flex-shrink-0" />
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`block w-full py-3 text-center rounded-xl font-bold transition hover:-translate-y-0.5 ${
                  plan.popular
                    ? "bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                    : "btn-landing-purple hover:shadow-lg"
                }`}
              >
                {plan.price === "0" ? "Начать бесплатно" : "Выбрать"}
              </Link>
            </motion.div>
          ))}
        </div>
        <p className="mt-12 text-center text-gray-400">
          При донатах комиссия всего{" "}
          <span className="text-cyan-400 font-bold">3%</span>, а вывод на карту —{" "}
          <span className="text-cyan-400 font-bold">0₽</span>
        </p>
      </div>
    </section>
  );
}
