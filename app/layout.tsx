import type { Metadata } from "next";
import { Toaster } from "@/components/Toaster";
import { SessionProvider } from "@/components/SessionProvider";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";

export const metadata: Metadata = {
  metadataBase: baseUrl ? new URL(baseUrl) : undefined,
  title: "Сайт донатов",
  description: "Поддержать стримера",
  openGraph: {
    title: "Сайт донатов",
    description: "Поддержать стримера",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
