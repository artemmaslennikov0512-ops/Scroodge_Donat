"use client";

import Link from "next/link";

type LandingNavProps = {
  isScrolled: boolean;
};

export default function LandingNav({ isScrolled }: LandingNavProps) {
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? "bg-black/50 backdrop-blur-lg border-b border-cyan-500/40 py-3 shadow-lg shadow-black/20"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-yellow-500/20 border border-yellow-500/40">
            <span className="font-bold text-xl text-yellow-400">₿</span>
          </div>
          <span className="text-2xl font-light">
            <span className="font-bold text-cyan-400">SCROOGE</span>
            <span className="text-white">DONAT</span>
          </span>
        </Link>
        <div className="hidden lg:flex items-center space-x-8">
          <Link href="#features" className="text-gray-300 hover:text-cyan-400 transition">
            Возможности
          </Link>
          <Link href="#pricing" className="text-gray-300 hover:text-cyan-400 transition">
            Тарифы
          </Link>
          <Link href="#testimonials" className="text-gray-300 hover:text-cyan-400 transition">
            Отзывы
          </Link>
          <Link href="#faq" className="text-gray-300 hover:text-cyan-400 transition">
            FAQ
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-gray-300 hover:text-cyan-400 transition">
            Войти
          </Link>
          <Link href="/register" className="relative group">
            <div className="absolute inset-0 bg-cyan-500 rounded-lg blur opacity-0 group-hover:opacity-50 transition" />
            <div className="relative px-6 py-2 bg-black/50 border border-cyan-500/50 rounded-lg text-white font-medium hover:border-cyan-400 hover:bg-cyan-500/10 transition">
              Регистрация
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
