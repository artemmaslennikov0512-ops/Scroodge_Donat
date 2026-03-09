-- Add missing User columns for verification
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "streamer_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "streamer_verified_at" TIMESTAMP(3);

-- CreateTable EmailVerificationToken
CREATE TABLE IF NOT EXISTS "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");
CREATE INDEX IF NOT EXISTS "EmailVerificationToken_user_id_idx" ON "EmailVerificationToken"("user_id");
CREATE INDEX IF NOT EXISTS "EmailVerificationToken_token_idx" ON "EmailVerificationToken"("token");

ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable StreamerVerification
CREATE TABLE IF NOT EXISTS "StreamerVerification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "passport_number" VARCHAR(255) NOT NULL,
    "inn" VARCHAR(20),
    "telegram" VARCHAR(100),
    "phone" VARCHAR(20),
    "passport_file" TEXT NOT NULL,
    "selfie_file" TEXT NOT NULL,
    "additional_file" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "admin_comment" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,

    CONSTRAINT "StreamerVerification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StreamerVerification_user_id_key" ON "StreamerVerification"("user_id");
CREATE INDEX IF NOT EXISTS "StreamerVerification_status_idx" ON "StreamerVerification"("status");
CREATE INDEX IF NOT EXISTS "StreamerVerification_submitted_at_idx" ON "StreamerVerification"("submitted_at");

ALTER TABLE "StreamerVerification" ADD CONSTRAINT "StreamerVerification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
