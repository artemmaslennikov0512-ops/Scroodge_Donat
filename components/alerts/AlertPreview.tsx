"use client";

import { motion, AnimatePresence, type TargetAndTransition } from "framer-motion";
import { FiX } from "react-icons/fi";
import { useEffect, useRef } from "react";

export interface AlertPreviewSettings {
  animation?: string;
  position?: string;
  duration?: number;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  showName?: boolean;
  showAmount?: boolean;
  showMessage?: boolean;
  messageTemplate?: string | null;
  imageUrl?: string | null;
  soundEnabled?: boolean;
  soundFile?: string | null;
  soundVolume?: number;
  useDefaultSound?: boolean;
  textOutline?: string;
  animationSpeed?: number;
}

const TEXT_OUTLINE_STYLE: Record<string, { textShadow?: string }> = {
  thin: {
    textShadow: "0 0 1px #000, 1px 0 0 #000, -1px 0 0 #000, 0 1px 0 #000, 0 -1px 0 #000, 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
  },
  bold: {
    textShadow: "0 0 3px #000, 0 0 3px #000, 2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000",
  },
  none: {},
};

function playDefaultBeep(volume: number) {
  try {
    const Ctx = typeof window !== "undefined" && (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    if (!Ctx) return;
    const ctx = new Ctx();
    const gain = ctx.createGain();
    gain.gain.value = Math.min(1, Math.max(0, volume / 100));
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 800;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // ignore
  }
}

interface AlertPreviewProps {
  type?: string;
  settings: AlertPreviewSettings;
  onClose: () => void;
  /** Данные доната для оверлея (если не заданы — тестовые значения) */
  donationName?: string;
  donationAmount?: number;
  donationMessage?: string | null;
}

function formatMessage(
  template: string | null | undefined,
  name: string,
  amount: number,
  message: string | null
): string {
  if (template) {
    return template
      .replace(/\{name\}/g, name)
      .replace(/\{amount\}/g, `${amount.toLocaleString("ru-RU")} ₽`)
      .replace(/\{message\}/g, message || "");
  }
  return message || `${name} задонатил ${amount.toLocaleString("ru-RU")} ₽!`;
}

export default function AlertPreview({
  type,
  settings,
  onClose,
  donationName = "Аноним",
  donationAmount = 500,
  donationMessage = "Тестовое сообщение",
}: AlertPreviewProps) {
  const durationSec = typeof settings.duration === "number" ? settings.duration : 4;
  const durationMs = Math.max(1000, durationSec * 1000);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [onClose, durationMs]);

  useEffect(() => {
    if (!settings.soundEnabled) return;
    if (settings.soundFile) {
      const vol = Math.min(1, Math.max(0, (settings.soundVolume ?? 70) / 100));
      const audio = new Audio(settings.soundFile);
      audio.volume = vol;
      audioRef.current = audio;
      audio.play().catch(() => {});
      return () => {
        audio.pause();
        audioRef.current = null;
      };
    }
    if (settings.useDefaultSound) {
      playDefaultBeep(settings.soundVolume ?? 70);
    }
  }, [settings.soundEnabled, settings.soundFile, settings.soundVolume, settings.useDefaultSound]);

  const speed = settings.animationSpeed ?? 1;
  const duration = speed > 0 ? 0.35 / speed : 0.35;
  const getAnimation = (): {
    initial: TargetAndTransition;
    animate: TargetAndTransition;
    exit: TargetAndTransition;
    transition?: { type: "spring"; bounce?: number } | { duration: number };
  } => {
    const t = { duration };
    switch (settings.animation) {
      case "slide":
        return {
          initial: { x: -100, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: 100, opacity: 0 },
          transition: t,
        };
      case "fade":
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: t,
        };
      case "bounce":
        return {
          initial: { y: -50, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: 50, opacity: 0 },
          transition: { type: "spring" as const, bounce: 0.5, duration },
        };
      default:
        return {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 },
          transition: t,
        };
    }
  };

  const getPosition = () => {
    switch (settings.position) {
      case "top-left":
        return "top-4 left-4";
      case "top-right":
        return "top-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      case "center":
        return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
      default:
        return "bottom-4 right-4";
    }
  };

  const anim = getAnimation();
  const textOutlineStyle = TEXT_OUTLINE_STYLE[settings.textOutline ?? "none"] ?? TEXT_OUTLINE_STYLE.none;

  return (
    <motion.div
      initial={anim.initial}
      animate={anim.animate}
      exit={anim.exit}
      transition={anim.transition}
      className={`fixed ${getPosition()} z-50 max-w-sm`}
      style={{
        backgroundColor: settings.backgroundColor || "#8b5cf6",
        color: settings.textColor || "#ffffff",
        fontFamily: settings.fontFamily || "Inter, sans-serif",
        fontSize: settings.fontSize ? `${settings.fontSize}px` : "16px",
        padding: "1rem",
        borderRadius: "0.75rem",
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)",
        ...textOutlineStyle,
      }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-1 right-1 text-white/50 hover:text-white p-1 rounded"
        aria-label="Закрыть"
      >
        <FiX className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-3">
        {settings.imageUrl && (
          <img
            src={settings.imageUrl}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
        <div className="min-w-0 flex-1 pr-6" style={textOutlineStyle}>
          {settings.showName !== false && (
            <div className="font-bold truncate">{donationName}</div>
          )}
          {settings.showAmount !== false && (
            <div className="text-lg font-semibold">
              {donationAmount.toLocaleString("ru-RU")} ₽
            </div>
          )}
          {settings.showMessage !== false && (
            <div className="text-sm opacity-90 truncate">
              {formatMessage(
                settings.messageTemplate,
                donationName,
                donationAmount,
                donationMessage
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
