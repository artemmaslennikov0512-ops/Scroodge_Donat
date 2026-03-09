"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type DonationItem = {
  id: string;
  donorName: string;
  amount: number;
  message: string | null;
  createdAt: string;
};

const REFRESH_MS = 6000;
const DEFAULT_LIMIT = 10;

export default function OverlayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));
  const transparent = searchParams.get("transparent") === "1" || searchParams.get("transparent") === "true";
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("Укажите slug стримера в URL");
      return;
    }
    const url = `/api/v1/streamers/${encodeURIComponent(slug)}/donations?limit=${limit}`;
    const fetchData = () => {
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(res.status === 404 ? "Стример не найден" : "Ошибка загрузки");
          return res.json();
        })
        .then((data: { donations?: DonationItem[] }) => {
          setDonations(Array.isArray(data.donations) ? data.donations : []);
          setError(null);
        })
        .catch((e) => {
          setError(e.message || "Ошибка");
          setDonations([]);
        });
    };
    fetchData();
    const t = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(t);
  }, [slug, limit]);

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/80 text-red-400 p-4 text-center">
        <p>Используйте URL: /streamer/<strong>ваш-slug</strong>/overlay</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 font-sans"
      style={{
        background: transparent ? "transparent" : "rgba(0,0,0,0.75)",
        color: "#fff",
      }}
    >
      {error ? (
        <div className="text-red-400 text-center py-4">{error}</div>
      ) : (
        <ul className="space-y-2 list-none m-0 p-0">
          {donations.length === 0 && (
            <li className="text-gray-500 text-sm">Пока нет донатов</li>
          )}
          {donations.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-baseline gap-2 py-1 border-b border-white/10 last:border-0"
            >
              <span className="font-semibold text-amber-400">{d.donorName}</span>
              <span className="text-amber-300 font-bold">+{d.amount.toLocaleString("ru-RU")} ₽</span>
              {d.message && (
                <span className="text-gray-300 text-sm w-full truncate" title={d.message}>
                  {d.message}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
