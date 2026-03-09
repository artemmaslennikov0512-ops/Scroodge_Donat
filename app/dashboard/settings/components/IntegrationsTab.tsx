"use client";

import { useState, useEffect } from "react";
import { FiCopy, FiMonitor, FiRefreshCw } from "react-icons/fi";
import { FaTwitch, FaDiscord } from "react-icons/fa";
import toast from "react-hot-toast";

function CopyButton({ text, label }: { text: string; label?: string }) {
  const copy = () => {
    if (typeof navigator?.clipboard?.writeText === "function") {
      navigator.clipboard.writeText(text);
      toast.success(label ? `${label} скопировано` : "Скопировано");
    } else {
      toast.error("Копирование недоступно");
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 text-sm"
    >
      <FiCopy className="w-4 h-4" />
      Копировать
    </button>
  );
}

export default function IntegrationsTab() {
  const [origin, setOrigin] = useState("");
  const [streamerSlug, setStreamerSlug] = useState<string | null>(null);
  const [donateLinkId, setDonateLinkId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [changingLink, setChangingLink] = useState(false);

  const fetchStats = () => {
    fetch("/api/dashboard/stats", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { streamerSlug?: string | null; donateLinkId?: string | null; username?: string | null }) => {
        setStreamerSlug(data?.streamerSlug ?? null);
        setDonateLinkId(data?.donateLinkId ?? null);
        setUsername(data?.username ?? null);
      })
      .catch(() => {
        setStreamerSlug(null);
        setDonateLinkId(null);
      });
  };

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
    let cancelled = false;
    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const onRegenerateLink = async () => {
    setChangingLink(true);
    try {
      const res = await fetch("/api/dashboard/donate-link", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Ошибка смены ссылки");
        return;
      }
      setDonateLinkId(data.donateLinkId ?? null);
      const url = data.donateUrl ?? (origin ? `${origin}/d/${data.donateLinkId}` : "");
      if (url && typeof navigator?.clipboard?.writeText === "function") {
        navigator.clipboard.writeText(url);
        toast.success("Новая ссылка создана и скопирована в буфер. Старая больше не работает.");
      } else {
        toast.success("Новая ссылка создана. Старая больше не работает.");
      }
    } catch {
      toast.error("Ошибка смены ссылки");
    } finally {
      setChangingLink(false);
    }
  };

  const slug = streamerSlug ?? "your-slug";
  const donateUrl = origin && donateLinkId ? `${origin}/d/${donateLinkId}` : "";
  const overlayUrl = origin ? `${origin}/streamer/${slug}/overlay?transparent=1&limit=10` : "";
  const overlayUrlOpaque = origin ? `${origin}/streamer/${slug}/overlay?limit=10` : "";
  const alertsOverlayUrl = origin ? `${origin}/streamer/${slug}/alerts?transparent=1` : "";
  const goalOverlayUrl = origin ? `${origin}/streamer/${slug}/goal?transparent=1` : "";
  const hasStreamer = !!streamerSlug;

  return (
    <div className="space-y-8">
      {!hasStreamer && (
        <div className="p-4 bg-cyan-500/10 border border-cyan-500/40 rounded-lg text-cyan-200 text-sm">
          У вас ещё нет slug стримера или username. Заполните имя пользователя в профиле и привяжите аккаунт стримера — тогда здесь появятся персональные ссылки. Пока используйте заглушки в URL.
        </div>
      )}

      {/* Ссылка на донаты (уникальная, можно менять) */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Ссылка на донаты</h3>
        <p className="text-gray-400 text-sm">
          Уникальная ссылка по номеру, а не по логину — два разных человека не могут случайно пополнить один аккаунт. При смене ссылки старая перестаёт работать.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 min-w-0 px-3 py-2 bg-black/40 rounded-lg text-cyan-200 text-xs break-all">
            {donateUrl || (origin ? `${origin}/d/ваш-номер` : "")}
          </code>
          {donateUrl && (
            <>
              <CopyButton text={donateUrl} label="Ссылка на донаты" />
              <button
                type="button"
                onClick={onRegenerateLink}
                disabled={changingLink}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/30 text-sm disabled:opacity-50"
              >
                <FiRefreshCw className={`w-4 h-4 ${changingLink ? "animate-spin" : ""}`} />
                Сменить ссылку
              </button>
            </>
          )}
        </div>
      </section>

      {/* OBS */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FiMonitor className="text-pink-400" />
          OBS Studio: оверлей донатов и алерты
        </h3>
        <p className="text-gray-400 text-sm">
          Ссылку на донаты вы даёте зрителям. Для OBS ниже три ссылки: <strong>список донатов</strong>, <strong>алерты</strong> и <strong>цель сбора</strong> (полоска прогресса). Добавляйте в OBS только те, что нужны — каждая своим источником «Браузер».
        </p>
        <h4 className="text-sm font-medium text-white pt-1">Список последних донатов (оверлей)</h4>
        <ol className="list-decimal list-inside text-gray-300 text-sm space-y-2">
          <li>В OBS: Источники → «+» → <strong>Браузер</strong> (Browser Source).</li>
          <li>Назовите источник, например «Донаты».</li>
          <li>В поле <strong>URL</strong> вставьте ссылку ниже (с прозрачным фоном для наложения на стрим).</li>
          <li>Ширина: <strong>400</strong>, высота: <strong>400</strong> (или под свой дизайн).</li>
          <li>При необходимости включите «Обновить кэш браузера при активации сцены».</li>
        </ol>
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 min-w-0 px-3 py-2 bg-black/40 rounded-lg text-cyan-200 text-xs break-all">
            {overlayUrl || "https://ваш-сайт.ru/streamer/your-slug/overlay?transparent=1&limit=10"}
          </code>
          <CopyButton text={overlayUrl || overlayUrlOpaque} label="URL оверлея" />
        </div>
        <p className="text-gray-500 text-xs">
          Параметр <code className="bg-black/30 px-1">transparent=1</code> — прозрачный фон; <code className="bg-black/30 px-1">limit=10</code> — число донатов (1–20).
        </p>

        <h4 className="text-sm font-medium text-white pt-2">Алерты донатов (всплывающие уведомления)</h4>
        <p className="text-gray-400 text-sm">
          По этой ссылке в OBS показываются всплывающие алерты при каждом новом донате (анимация, звук — из раздела <strong>Алерты</strong>). Добавьте отдельный источник «Браузер» с этой ссылкой.
        </p>
        <ol className="list-decimal list-inside text-gray-300 text-sm space-y-2">
          <li>В OBS: ещё один источник «Браузер», название например «Алерты донатов».</li>
          <li>Вставьте ссылку ниже (с <code className="bg-black/30 px-1">transparent=1</code>).</li>
          <li>Размер под область алерта (например 500×300).</li>
        </ol>
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 min-w-0 px-3 py-2 bg-black/40 rounded-lg text-cyan-200 text-xs break-all">
            {alertsOverlayUrl || `${origin || "https://ваш-сайт.ru"}/streamer/${slug}/alerts?transparent=1`}
          </code>
          <CopyButton text={alertsOverlayUrl || `${origin || ""}/streamer/${slug}/alerts?transparent=1`} label="URL алертов" />
        </div>
        <p className="text-gray-500 text-xs">
          Сначала настройте алерт типа «Донат» в разделе <strong>Алерты</strong> и включите его — иначе оверлей покажет подсказку.
        </p>

        <h4 className="text-sm font-medium text-white pt-2">Цель сбора (полоска прогресса)</h4>
        <p className="text-gray-400 text-sm">
          Полоска прогресса по активной цели: название, собрано / цель, процент. Добавьте источник «Браузер» с этой ссылкой.
        </p>
        <ol className="list-decimal list-inside text-gray-300 text-sm space-y-2">
          <li>В OBS: источник «Браузер», название например «Цель сбора».</li>
          <li>Вставьте ссылку ниже (с <code className="bg-black/30 px-1">transparent=1</code>).</li>
          <li>Размер под виджет (например 400×120).</li>
        </ol>
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 min-w-0 px-3 py-2 bg-black/40 rounded-lg text-cyan-200 text-xs break-all">
            {goalOverlayUrl || `${origin || "https://ваш-сайт.ru"}/streamer/${slug}/goal?transparent=1`}
          </code>
          <CopyButton text={goalOverlayUrl || `${origin || ""}/streamer/${slug}/goal?transparent=1`} label="URL цели" />
        </div>
        <p className="text-gray-500 text-xs">
          Нужна активная цель в разделе <strong>Цели</strong> — иначе оверлей покажет подсказку.
        </p>
      </section>

      {/* Twitch */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FaTwitch className="text-pink-400" />
          Twitch
        </h3>
        <p className="text-gray-400 text-sm">
          Добавьте ссылку на страницу донатов в описание канала и в панели под видео, чтобы зрители могли поддержать вас.
        </p>
        <ol className="list-decimal list-inside text-gray-300 text-sm space-y-2">
          <li>Твич-панель: Творческая панель → Добавить панель → Ссылка. Вставьте ссылку на донаты и подпись, например «Поддержать стрим».</li>
          <li>Описание канала: в блоке «О канале» или в описании стрима добавьте текст с ссылкой.</li>
        </ol>
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 min-w-0 px-3 py-2 bg-black/40 rounded-lg text-cyan-200 text-xs break-all">
            {donateUrl || (origin ? `${origin}/d/ваш-номер` : "https://ваш-сайт.ru/d/ваш-номер")}
          </code>
          <CopyButton text={donateUrl} label="Ссылка на донаты" />
        </div>
      </section>

      {/* Discord */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FaDiscord className="text-indigo-400" />
          Discord
        </h3>
        <p className="text-gray-400 text-sm">
          Укажите ссылку на донаты в профиле сервера или в закреплённом сообщении, чтобы подписчики могли поддержать вас.
        </p>
        <ol className="list-decimal list-inside text-gray-300 text-sm space-y-2">
          <li>Профиль пользователя: Настройки → Профиль → «Обо мне» — вставьте ссылку или текст «Поддержать: ссылка».</li>
          <li>Канал: закрепите сообщение с текстом и ссылкой на донаты в нужном канале.</li>
        </ol>
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 min-w-0 px-3 py-2 bg-black/40 rounded-lg text-cyan-200 text-xs break-all">
            {donateUrl || (origin ? `${origin}/d/ваш-номер` : "https://ваш-сайт.ru/d/ваш-номер")}
          </code>
          <CopyButton text={donateUrl} label="Ссылка" />
        </div>
      </section>

      {/* Ссылка на полную инструкцию */}
      <div className="pt-4 border-t border-cyan-500/30">
        <p className="text-gray-500 text-sm">
          Подробная пошаговая настройка для стримера — в файле <code className="bg-black/30 px-1 rounded text-xs">docs/STREAMER_SETUP.md</code> в репозитории проекта.
        </p>
      </div>
    </div>
  );
}
