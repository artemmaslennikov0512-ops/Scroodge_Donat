import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function redirectNoStore(url: URL) {
  const res = NextResponse.redirect(url);
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return res;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const origin = new URL(req.url).origin;

    if (!token) {
      return redirectNoStore(new URL("/verify-email?error=no-token", origin));
    }

    const emailToken = await db.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (emailToken) {
      if (emailToken.usedAt) {
        return redirectNoStore(new URL("/verify-email?error=already-used", origin));
      }
      if (emailToken.expiresAt < new Date()) {
        return redirectNoStore(new URL("/verify-email?error=expired", origin));
      }
      if (emailToken.type !== "email") {
        return redirectNoStore(new URL("/verify-email?error=invalid-type", origin));
      }

      await db.$transaction([
        db.user.update({
          where: { id: emailToken.userId },
          data: { isVerified: true, verifiedAt: new Date(), emailVerified: new Date() },
        }),
        db.emailVerificationToken.update({
          where: { id: emailToken.id },
          data: { usedAt: new Date() },
        }),
      ]);

      return redirectNoStore(new URL("/verify-email?success=true", origin));
    }

    const legacyToken = await db.verificationToken.findFirst({
      where: { token },
    });

    if (legacyToken && legacyToken.expires >= new Date()) {
      const email = legacyToken.identifier;
      await db.user.updateMany({
        where: { email },
        data: { isVerified: true, emailVerified: new Date() },
      });
      await db.verificationToken.deleteMany({
        where: { token, identifier: email },
      });
      return redirectNoStore(new URL("/verify-email?success=true", origin));
    }

    if (legacyToken && legacyToken.expires < new Date()) {
      return redirectNoStore(new URL("/verify-email?error=expired", origin));
    }

    return redirectNoStore(new URL("/verify-email?error=invalid-token", origin));
  } catch (error) {
    console.error("Verification error:", error);
    return redirectNoStore(
      new URL("/verify-email?error=server-error", new URL(req.url).origin)
    );
  }
}
