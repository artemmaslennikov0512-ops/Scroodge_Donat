-- Add phone and bio columns to User (schema already has them; DB was missing)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(30);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT;
