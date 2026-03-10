-- Add donate_link_id to Streamer (nullable, unique)
ALTER TABLE "Streamer" ADD COLUMN IF NOT EXISTS "donate_link_id" VARCHAR(24);
CREATE UNIQUE INDEX IF NOT EXISTS "Streamer_donate_link_id_key" ON "Streamer"("donate_link_id");
