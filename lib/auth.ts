import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import TwitchProvider from "next-auth/providers/twitch";
import VKProvider from "next-auth/providers/vk";
import AppleProvider from "next-auth/providers/apple";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcrypt";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: { scope: "openid email profile" },
            },
          }),
        ]
      : []),
    ...(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET
      ? [
          TwitchProvider({
            clientId: process.env.TWITCH_CLIENT_ID,
            clientSecret: process.env.TWITCH_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.VK_CLIENT_ID && process.env.VK_CLIENT_SECRET
      ? [
          VKProvider({
            clientId: process.env.VK_CLIENT_ID,
            clientSecret: process.env.VK_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.APPLE_ID && process.env.APPLE_SECRET
      ? [
          AppleProvider({
            clientId: process.env.APPLE_ID!,
            clientSecret: process.env.APPLE_SECRET!,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Invalid credentials");
          }

          const email = credentials.email.trim().toLowerCase();
          const user = await db.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
            select: {
              id: true,
              email: true,
              name: true,
              username: true,
              password: true,
              isVerified: true,
              isStreamer: true,
              streamerVerified: true,
              balance: true,
            },
          });

          if (!user) {
            if (process.env.NODE_ENV === "development") {
              console.error("[Auth] Пользователь не найден по email:", email.replace(/(.{2}).*(@.*)/, "$1***$2"));
            }
            throw new Error("Invalid credentials");
          }

          if (!user.password) {
            if (process.env.NODE_ENV === "development") {
              console.error("[Auth] У пользователя не задан пароль (id:", user.id, ")");
            }
            throw new Error("Invalid credentials");
          }

          // Сравниваем с trim — часто пароль вводят с лишним пробелом в начале/конце
          const passwordToCheck = credentials.password.trim();
          const isValid = await bcrypt.compare(passwordToCheck, user.password);

          if (!isValid) {
            if (process.env.NODE_ENV === "development") {
              console.error("[Auth] Неверный пароль для пользователя:", user.email ?? user.id);
            }
            throw new Error("Invalid credentials");
          }

          return {
            id: user.id,
            email: user.email ?? undefined,
            name: user.name ?? undefined,
            username: user.username ?? undefined,
            isVerified: user.isVerified,
            isStreamer: user.isStreamer,
            streamerVerified: user.streamerVerified ?? user.isStreamer,
            balance: user.balance,
          };
        } catch (err) {
          console.error("[Auth] authorize error:", err);
          throw err;
        }
      },
    }),
  ],
  callbacks: {
    redirect({ url, baseUrl }) {
      try {
        const u = new URL(url, baseUrl);
        // Обрезанная кука callback (например /d вместо /dashboard) — ведём в ЛК
        if (u.pathname === "/d" || (u.pathname.startsWith("/d") && u.pathname.length <= 4)) {
          return `${baseUrl}/dashboard`;
        }
        if (u.pathname === "/login" && u.searchParams.has("callbackUrl")) {
          const cb = u.searchParams.get("callbackUrl") ?? "";
          const cbPath = cb.startsWith("http") ? new URL(cb).pathname : cb.startsWith("/") ? cb : `/${cb}`;
          if (cbPath === "/login" || cbPath.startsWith("/login") || cbPath === "/d") {
            u.searchParams.set("callbackUrl", `${baseUrl}/dashboard`);
            return u.toString();
          }
        }
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        if (url.startsWith(baseUrl)) return url;
        // Запрет open redirect: не возвращаем внешний URL
        return `${baseUrl}/dashboard`;
      } catch {
        return `${baseUrl}/dashboard`;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isVerified = (user as { isVerified?: boolean }).isVerified ?? false;
        token.isStreamer = (user as { isStreamer?: boolean }).isStreamer ?? false;
        token.streamerVerified =
          (user as { streamerVerified?: boolean }).streamerVerified ??
          (user as { isStreamer?: boolean }).isStreamer ??
          false;
        token.balance = (user as { balance?: number }).balance ?? 0;
        token.username = (user as { username?: string | null }).username ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      try {
        if (!session?.user || !token?.id) return session;
        session.user.id = token.id as string;
        session.user.isVerified = token.isVerified as boolean;
        session.user.isStreamer = token.isStreamer as boolean;
        session.user.streamerVerified = (token.streamerVerified as boolean) ?? (token.isStreamer as boolean);
        session.user.balance = token.balance as number;
        session.user.username = token.username as string | null;
        try {
          const user = await db.user.findUnique({
            where: { id: token.id as string },
            select: { image: true },
          });
          if (user?.image) session.user.image = user.image;
        } catch (err) {
          console.error("[Auth] session callback DB error:", err);
        }
        return session;
      } catch (err) {
        console.error("[Auth] session callback error:", err);
        return session;
      }
    },
  },
  pages: {
    signIn: "/login",
  },
};
