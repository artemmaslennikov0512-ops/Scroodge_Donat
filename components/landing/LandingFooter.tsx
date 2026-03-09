"use client";

import Link from "next/link";
import { FiZap } from "react-icons/fi";

export default function LandingFooter() {
  return (
    <footer className="border-t border-cyan-500/20 py-12 px-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <FiZap className="text-2xl text-cyan-400" />
            <span className="text-lg font-bold text-cyan-400">
              SCROOGE<span className="text-white">DONAT</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-6 md:gap-8 text-sm text-gray-500 justify-center">
            <Link href="/oferta" className="hover:text-cyan-400">
              Договор-оферта
            </Link>
            <Link href="/terms" className="hover:text-cyan-400">
              Пользовательское соглашение
            </Link>
            <Link href="/privacy" className="hover:text-cyan-400">
              Политика конфиденциальности
            </Link>
            <Link href="/personal-data" className="hover:text-cyan-400">
              Политика обработки персональных данных
            </Link>
            <Link href="/contacts" className="hover:text-cyan-400">
              Контакты
            </Link>
          </div>
          <div className="text-sm text-gray-600 mt-4 md:mt-0">
            © 2026 ScroogeDonat
          </div>
        </div>
      </div>
    </footer>
  );
}
