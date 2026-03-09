# Чеклист перед продакшеном

## Уже сделано в коде
- ✅ Начисление баланса стримеру при успешной оплате (Stripe webhook)
- ✅ API статистики и донатов для ЛК (`/api/dashboard/stats`, `/api/dashboard/donations`)
- ✅ Публичный API для оверлеев (`/api/v1/streamers/[slug]/donations`, `.../stats`)
- ✅ Health-check: `GET /api/health`
- ✅ Создание записи Streamer при регистрации (и подстановка для старых пользователей при первом заходе в ЛК)

## Что нужно сделать вручную

### 1. Переменные окружения (продакшен)
- `NODE_ENV=production`
- `NEXT_PUBLIC_APP_URL` — полный URL сайта (например `https://your-domain.com`)
- `DATABASE_URL` — строка подключения к PostgreSQL
- `NEXTAUTH_URL` — тот же URL сайта (NextAuth)
- `NEXTAUTH_SECRET` — случайная строка (например `openssl rand -base64 32`)
- `JWT_SECRET` — отдельный секрет для админки (не менее 32 символов)
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_KEY` — ключи Stripe (live для прода)
- `STRIPE_WEBHOOK_SECRET` — секрет вебхука из кабинета Stripe (для продакшен URL)

### 2. Stripe
- В [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks) добавить endpoint:  
  `https://your-domain.com/api/payment/webhook`
- События: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`
- Скопировать «Signing secret» в `STRIPE_WEBHOOK_SECRET`

### 3. База данных
- Выполнить миграции: `npx prisma migrate deploy`
- При необходимости создать первого админа (seed или скрипт `admin:create`)

### 4. Опционально
- **SMTP** — для писем (подтверждение email, уведомления по верификации). Без SMTP в dev ссылка подтверждения выводится в консоль.
- **CORS** — публичные API `/api/v1/streamers/*` читаются без авторизации; при запросах с других доменов при необходимости настроить CORS в Next.js.

### 5. Проверки после деплоя
- Открыть `https://your-domain.com/api/health` → `{ "status": "ok", "db": "ok" }`
- Регистрация → вход → ЛК: баланс и донаты подтягиваются
- Страница доната: `https://your-domain.com/streamer/{username}` или `/{username}/donate`
- Тестовый платёж Stripe → webhook → обновление баланса и списка донатов в ЛК
