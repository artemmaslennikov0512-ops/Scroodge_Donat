import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";
import { getJwtSecret } from "@/lib/adminJwt";

export async function verifyAdminToken(): Promise<{
  id: string;
  email: string;
  name: string | null;
  role: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, getJwtSecret()) as { id: string };
    const admin = await db.adminUser.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true },
    });
    return admin;
  } catch {
    return null;
  }
}
