"use client";

import MatrixRain from "@/components/MatrixRain";

/**
 * Фон в стиле сайта: матричный дождь, кибер-сетка, неоновые сферы.
 * Используется на странице доната и других страницах для единого визуала.
 */
export default function SiteBackground() {
  return (
    <>
      <MatrixRain
        color="#00ff41"
        fontSize={16}
        speed={11}
        density={0.45}
        speedVariance={0.18}
        className="opacity-20 z-0"
      />
      <div className="cyber-sphere-1" />
      <div className="cyber-sphere-2" />
      <div className="fixed inset-0 bg-cyber-grid opacity-20 pointer-events-none z-0" />
    </>
  );
}
