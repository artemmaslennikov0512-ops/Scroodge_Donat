"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

export default function LandingFaq() {
  return (
    <section id="faq" className="py-16 sm:py-20 md:py-24 px-6">
      <div className="container mx-auto">
        <div className="relative rounded-3xl overflow-hidden panel-hud">
          <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none" />
          <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none" />
          <div className="relative p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Начни зарабатывать{" "}
              <span className="text-cyan-400">больше</span>
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Присоединяйся к 50 000+ стримеров, которые уже доверяют нам
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold btn-landing-cta hover:-translate-y-0.5"
            >
              Создать аккаунт
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
