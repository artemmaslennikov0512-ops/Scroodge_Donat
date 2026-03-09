# Базовое применение миграций (P3005): БД уже с таблицами, но без истории миграций.
# Помечаем уже применённые миграции как applied, затем применяем оставшиеся.
# Запуск: из корня проекта, с заданным DATABASE_URL
#   $env:DATABASE_URL="postgresql://donate:donate@localhost:5432/donations"
#   .\prisma\baseline.ps1

$ErrorActionPreference = "Stop"
npx prisma migrate resolve --applied "20260301222641_init"
npx prisma migrate resolve --applied "20260301223704_admin_must_change_password"
npx prisma migrate resolve --applied "20260301231715_add_user_auth"
npx prisma migrate deploy
Write-Host "Baseline и применение миграций завершены."
