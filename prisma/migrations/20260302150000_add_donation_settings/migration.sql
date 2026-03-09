-- AlterTable
-- Настройки донатов стримера: minAmount, maxAmount, allowAnonymous, defaultMessage, enabled и др.
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "donation_settings" JSONB;
