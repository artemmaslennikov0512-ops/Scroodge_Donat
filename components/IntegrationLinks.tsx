"use client";

import { useState } from "react";
import { FaTwitch, FaYoutube, FaDiscord } from "react-icons/fa";
import toast from "react-hot-toast";

interface Props {
  twitchId?: string | null;
  youtubeId?: string | null;
  discordId?: string | null;
}

export function IntegrationLinks({ twitchId, youtubeId, discordId }: Props) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleTwitchConnect = async () => {
    setIsConnecting(true);
    try {
      window.location.href = "/api/auth/twitch";
    } catch {
      toast.error("Ошибка подключения Twitch");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
      <h3 className="text-xl font-bold text-white mb-4">Интеграции</h3>

      <div className="space-y-3">
        <button
          onClick={handleTwitchConnect}
          disabled={isConnecting || !!twitchId}
          className="w-full flex items-center justify-between p-3 rounded-lg bg-pink-500 hover:bg-pink-600 disabled:opacity-50 transition"
        >
          <div className="flex items-center">
            <FaTwitch className="text-2xl mr-3" />
            <span className="text-white">Twitch</span>
          </div>
          {twitchId ? (
            <span className="text-green-300 text-sm">Подключено</span>
          ) : (
            <span className="text-white text-sm">Подключить</span>
          )}
        </button>

        <button
          onClick={() => (window.location.href = "/api/auth/youtube")}
          disabled={isConnecting || !!youtubeId}
          className="w-full flex items-center justify-between p-3 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 transition"
        >
          <div className="flex items-center">
            <FaYoutube className="text-2xl mr-3" />
            <span className="text-white">YouTube</span>
          </div>
          {youtubeId ? (
            <span className="text-green-300 text-sm">Подключено</span>
          ) : (
            <span className="text-white text-sm">Подключить</span>
          )}
        </button>

        <button
          onClick={() => (window.location.href = "/api/auth/discord")}
          disabled={isConnecting || !!discordId}
          className="w-full flex items-center justify-between p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          <div className="flex items-center">
            <FaDiscord className="text-2xl mr-3" />
            <span className="text-white">Discord</span>
          </div>
          {discordId ? (
            <span className="text-green-300 text-sm">Подключено</span>
          ) : (
            <span className="text-white text-sm">Подключить</span>
          )}
        </button>
      </div>
    </div>
  );
}
