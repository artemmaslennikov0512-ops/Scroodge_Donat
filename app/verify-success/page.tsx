"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VerifySuccess() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/verify-email?success=true");
  }, [router]);
  return null;
}
