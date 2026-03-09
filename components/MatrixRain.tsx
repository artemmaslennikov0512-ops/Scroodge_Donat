"use client";

import { useEffect, useRef } from "react";

interface MatrixRainProps {
  className?: string;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  speed?: number;
  density?: number;
  /** Длина хвоста (сколько символов в столбце) — видно падение */
  trailLength?: number;
  /** Разброс скорости по колонкам (0–0.3), чтобы не падало «волнами» */
  speedVariance?: number;
}

export default function MatrixRain({
  className = "",
  color = "#FBBF24",
  backgroundColor = "transparent",
  fontSize = 14,
  speed = 30,
  density = 0.8,
  trailLength = 12,
  speedVariance = 0,
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let columns: number;
    let drops: number[] = [];
    /** Множитель скорости для каждой колонки — разная скорость убирает «волны» */
    let speedMultipliers: number[] = [];
    let activeColumns: number[] = [];

    const chars =
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;

      const rowCount = Math.ceil(height / fontSize);
      columns = Math.floor(width / fontSize);
      // Начальные позиции равномерно по высоте — не все столбцы «в одной фазе», меньше волн
      drops = new Array(columns)
        .fill(0)
        .map(() => -Math.random() * rowCount);
      speedMultipliers = new Array(columns)
        .fill(0)
        .map(() => 1 + (Math.random() * 2 - 1) * speedVariance);
      activeColumns = [];
      for (let i = 0; i < columns; i++) {
        if (Math.random() < density) activeColumns.push(i);
      }
    };

    window.addEventListener("resize", resize);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px "Courier New", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Сброс сразу при выходе за низ — постоянный поток без «волн» из порций строк
      const threshold = (canvas.height / fontSize) + trailLength;
      for (let i = 0; i < drops.length; i++) {
        if (drops[i] > threshold) drops[i] = 0;
        const mult = speedMultipliers[i] ?? 1;
        drops[i] += (speed / 100) * mult;
      }

      // Рисуем только активные колонки (набор зафиксирован при resize — без мерцания)
      for (const i of activeColumns) {
        const x = i * fontSize + fontSize / 2;
        const headY = drops[i] * fontSize;

        for (let t = 0; t < trailLength; t++) {
          const y = headY - t * fontSize;
          if (y < -fontSize) break;
          const char = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillStyle = color;
          ctx.globalAlpha = 1 - (t / trailLength) * 0.85; // голова яркая, хвост чуть тусклее
          ctx.fillText(char, x, y);
        }
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color, fontSize, speed, backgroundColor, density, trailLength, speedVariance]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
