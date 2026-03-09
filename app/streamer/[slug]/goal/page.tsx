"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import GoalWidgetStyled from "@/components/goals/GoalWidgetStyled";
import type { GoalDisplaySettings } from "@/components/goals/GoalWidgetStyled";

type GoalData = {
  id: string;
  title: string;
  description: string | null;
  currentAmount: number;
  targetAmount: number;
  endDate: string | null;
  currency: string;
};

const POLL_MS = 10000;

function getPositionClasses(position: string): string {
  switch (position) {
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
}

const DEFAULT_DISPLAY: GoalDisplaySettings = {
  position: "bottom-right",
  backgroundColor: "#1f2937",
  textColor: "#ffffff",
  barColor: "#ec4899",
  fontFamily: "Inter",
  fontSize: 16,
  showTitle: true,
  showDescription: true,
  showEndDate: true,
  borderRadius: 12,
};

export default function StreamerGoalOverlayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const transparent = searchParams.get("transparent") === "1" || searchParams.get("transparent") === "true";

  const [goal, setGoal] = useState<GoalData | null>(null);
  const [displaySettings, setDisplaySettings] = useState<GoalDisplaySettings>(DEFAULT_DISPLAY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("Укажите slug стримера в URL");
      return;
    }
    const url = `/api/v1/streamers/${encodeURIComponent(slug)}/goal`;
    const fetchGoal = () => {
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(res.status === 404 ? "Нет активной цели" : "Ошибка загрузки");
          return res.json();
        })
        .then((data: { goal: GoalData; displaySettings?: GoalDisplaySettings }) => {
          setGoal(data.goal);
          setDisplaySettings(data.displaySettings ?? DEFAULT_DISPLAY);
          setError(null);
        })
        .catch((e) => {
          setError(e.message || "Ошибка");
          setGoal(null);
        });
    };
    fetchGoal();
    const t = setInterval(fetchGoal, POLL_MS);
    return () => clearInterval(t);
  }, [slug]);

  if (!slug) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ background: transparent ? "transparent" : "rgba(0,0,0,0.8)", color: "#f87171" }}
      >
        <p>Используйте URL: /streamer/<strong>ваш-slug</strong>/goal</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ background: transparent ? "transparent" : "rgba(0,0,0,0.8)", color: "#fbbf24" }}
      >
        <p>{error}. Создайте и включите цель в разделе Цели.</p>
      </div>
    );
  }

  if (!goal) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ background: transparent ? "transparent" : "rgba(0,0,0,0.8)", color: "#9ca3af" }}
      >
        <p>Загрузка…</p>
      </div>
    );
  }

  const currency = goal.currency === "RUB" ? "₽" : goal.currency;
  const position = displaySettings.position ?? "bottom-right";

  return (
    <div
      className="min-h-screen font-sans relative"
      style={{
        background: transparent ? "transparent" : "rgba(0,0,0,0.6)",
        color: "#fff",
      }}
    >
      <div className={`absolute max-w-md w-[90%] ${getPositionClasses(position)}`}>
        <GoalWidgetStyled
          title={goal.title}
          description={goal.description}
          currentAmount={goal.currentAmount}
          targetAmount={goal.targetAmount}
          endDate={goal.endDate ? new Date(goal.endDate) : null}
          currency={currency}
          display={displaySettings}
        />
      </div>
    </div>
  );
}
