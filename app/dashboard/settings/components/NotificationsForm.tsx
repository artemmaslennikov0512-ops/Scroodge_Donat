"use client";

import { useState } from "react";
import { FiMail, FiBell } from "react-icons/fi";
import toast from "react-hot-toast";

export default function NotificationsForm() {
  const [settings, setSettings] = useState({
    emailDonations: true,
    emailGoals: true,
    emailStreams: false,
    pushDonations: true,
    pushGoals: false,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    // TODO: POST /api/user/notifications когда будет API
    toast.success("Настройки уведомлений сохранены (демо)");
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FiMail />
          Email-уведомления
        </h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-black/30 rounded-lg cursor-pointer hover:bg-black/40 transition">
            <span className="text-gray-300">Новый донат</span>
            <input
              type="checkbox"
              checked={settings.emailDonations}
              onChange={() => handleToggle("emailDonations")}
              className="rounded border-pink-500/40 bg-black/30 text-pink-400 focus:ring-pink-500"
            />
          </label>
          <label className="flex items-center justify-between p-3 bg-black/30 rounded-lg cursor-pointer hover:bg-black/40 transition">
            <span className="text-gray-300">Достижение цели</span>
            <input
              type="checkbox"
              checked={settings.emailGoals}
              onChange={() => handleToggle("emailGoals")}
              className="rounded border-pink-500/40 bg-black/30 text-pink-400 focus:ring-pink-500"
            />
          </label>
          <label className="flex items-center justify-between p-3 bg-black/30 rounded-lg cursor-pointer hover:bg-black/40 transition">
            <span className="text-gray-300">Начало стрима</span>
            <input
              type="checkbox"
              checked={settings.emailStreams}
              onChange={() => handleToggle("emailStreams")}
              className="rounded border-pink-500/40 bg-black/30 text-pink-400 focus:ring-pink-500"
            />
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FiBell />
          Push-уведомления (в браузере)
        </h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-black/30 rounded-lg cursor-pointer hover:bg-black/40 transition">
            <span className="text-gray-300">Новый донат</span>
            <input
              type="checkbox"
              checked={settings.pushDonations}
              onChange={() => handleToggle("pushDonations")}
              className="rounded border-pink-500/40 bg-black/30 text-pink-400 focus:ring-pink-500"
            />
          </label>
          <label className="flex items-center justify-between p-3 bg-black/30 rounded-lg cursor-pointer hover:bg-black/40 transition">
            <span className="text-gray-300">Достижение цели</span>
            <input
              type="checkbox"
              checked={settings.pushGoals}
              onChange={() => handleToggle("pushGoals")}
              className="rounded border-pink-500/40 bg-black/30 text-pink-400 focus:ring-pink-500"
            />
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="px-6 py-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg text-white font-medium hover:shadow-lg transition"
      >
        Сохранить настройки уведомлений
      </button>
    </div>
  );
}
