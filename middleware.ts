import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecret } from "@/lib/adminJwt";

function isAdminPath(path: string): boolean {
  return (path.startsWith("/admin") && path !== "/admin/login") ||
    (path.startsWith("/api/admin") && path !== "/api/admin/auth");
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!isAdminPath(path)) return NextResponse.next();

  const token = request.cookies.get("admin_token")?.value;
  const isApi = path.startsWith("/api/admin");
  const unauthorized = () =>
    isApi ? NextResponse.json({ error: "Unauthorized" }, { status: 401 }) : NextResponse.redirect(new URL("/admin/login", request.url));

  if (!token) return unauthorized();
  try {
    const secret = new TextEncoder().encode(getJwtSecret());
    await jwtVerify(token, secret, { algorithms: ["HS256"] });
  } catch {
    return unauthorized();
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
