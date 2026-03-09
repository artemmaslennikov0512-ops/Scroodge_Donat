"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiUser, FiLock, FiBell, FiGlobe, FiZap, FiArrowRight } from "react-icons/fi";
import ProfileForm from "./components/ProfileForm";
import SecurityForm from "./components/SecurityForm";
import NotificationsForm from "./components/NotificationsForm";
import IntegrationsTab from "./components/IntegrationsTab";
import type { ProfileFormData } from "./components/ProfileForm";

type Tab = "profile" | "security" | "notifications" | "integrations" | "alerts";

type ProfileState = ProfileFormData & { phoneVerified?: boolean };

const defaultProfile: ProfileState = {
  name: "",
  username: "",
  email: "",
  phone: "",
  bio: "",
  phoneVerified: false,
};

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const sectionParam = searchParams.get("section") as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [userData, setUserData] = useState<ProfileState>(defaultProfile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (sectionParam && ["profile", "security", "notifications", "integrations", "alerts"].includes(sectionParam)) {
      setActiveTab(sectionParam);
    }
  }, [sectionParam]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/user/profile", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setUserData({
              name: data.name ?? "",
              username: data.username ?? "",
              email: data.email ?? "",
              phone: data.phone ?? "",
              bio: data.bio ?? "",
              phoneVerified: !!data.phoneVerified,
            });
          }
        }
      } catch {
        if (!cancelled) setUserData(defaultProfile);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveProfile = async (data: ProfileFormData) => {
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Ошибка сохранения");
    }
    setUserData(data);
  };

  const tabs: { id: Tab; label: string; icon: typeof FiUser }[] = [
    { id: "profile", label: "Профиль", icon: FiUser },
    { id: "security", label: "Безопасность", icon: FiLock },
    { id: "notifications", label: "Уведомления", icon: FiBell },
    { id: "integrations", label: "Интеграции", icon: FiGlobe },
    { id: "alerts", label: "Алерты", icon: FiZap },
  ];

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Настройки</h1>

      <div className="flex flex-wrap gap-2 border-b border-cyan-500/40 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition ${
              activeTab === tab.id
                ? "bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400"
                : "text-gray-400 hover:text-cyan-200 hover:bg-cyan-500/10"
            }`}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="panel-hud p-6"
      >
        {loading && activeTab === "profile" ? (
          <div className="text-gray-400 py-8">Загрузка...</div>
        ) : activeTab === "profile" ? (
          <ProfileForm
            initialData={userData}
            onSave={handleSaveProfile}
            phoneVerified={userData.phoneVerified}
            onPhoneVerified={() => setUserData((prev) => ({ ...prev, phoneVerified: true }))}
          />
        ) : activeTab === "security" ? (
          <SecurityForm />
        ) : activeTab === "notifications" ? (
          <NotificationsForm />
        ) : activeTab === "integrations" ? (
          <IntegrationsTab />
        ) : activeTab === "alerts" ? (
          <div>
            <p className="text-gray-400 mb-4">Настройка уведомлений и анимаций для донатов в OBS.</p>
            <Link
              href="/dashboard/alerts"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white font-medium rounded-lg hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition"
            >
              Открыть настройки алертов <FiArrowRight />
            </Link>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
