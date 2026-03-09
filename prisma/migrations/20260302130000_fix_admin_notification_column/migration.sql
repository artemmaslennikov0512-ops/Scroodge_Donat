-- AdminNotification: схема ожидает колонку admin_id (snake_case), в init создана adminId
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'AdminNotification' AND column_name = 'adminId'
  ) THEN
    ALTER TABLE "AdminNotification" RENAME COLUMN "adminId" TO "admin_id";
    ALTER TABLE "AdminNotification" ALTER COLUMN "admin_id" DROP NOT NULL;
  END IF;
END $$;
