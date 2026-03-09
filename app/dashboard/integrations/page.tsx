"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function IntegrationsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/settings?section=integrations");
  }, [router]);
  return (
    <div className="space-y-6">
      <p className="text-gray-400">Перенаправление в настройки...</p>
    </div>
  );
}
