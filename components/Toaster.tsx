"use client";

import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: { background: "rgb(var(--color-bg-card))", color: "rgb(var(--color-text))" },
      }}
    />
  );
}
