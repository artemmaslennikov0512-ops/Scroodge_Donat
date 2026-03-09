"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "server-error";
  useEffect(() => {
    router.replace(`/verify-email?error=${reason}`);
  }, [router, reason]);
  return null;
}

export default function VerifyError() {
  return (
    <Suspense fallback={null}>
      <VerifyErrorContent />
    </Suspense>
  );
}
