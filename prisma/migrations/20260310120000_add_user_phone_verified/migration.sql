-- Add phone_verified column to User (nullable timestamp)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone_verified" TIMESTAMP(3);
