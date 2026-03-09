# Сайт донатов

Платёжный провайдер — **только Stripe**. Paygine в проекте не используется.

## Архитектура

- **Delivery:** `app/` — API routes и страницы (Next.js App Router).
- **Application:** `application/` — use cases (CreateDonation, HandleStripeWebhook).
- **Domain:** `domain/` — правила донатов (лимиты сумм, сообщения).
- **Infrastructure:** `infrastructure/` — порт PaymentGateway, реализация Stripe, Prisma-репозитории (донаты, стримеры).

Подробнее: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Запуск

1. Скопировать `.env.example` в `.env`, заполнить `DATABASE_URL` и ключи Stripe.
2. `npm install`
3. `npm run db:push` — применить схему БД (создать стримеров вручную или через seed).
4. `npm run dev` — запуск в режиме разработки.

## Сборка и запуск в Docker

**Только сборка образа:**
```bash
docker build -t donation-site .
```

**Запуск приложения и PostgreSQL одной командой:**
```bash
docker-compose up --build
```

**Просмотр логов в реальном времени:**
```bash
docker compose logs -f app
```

- Сайт: http://localhost:3000  
- БД: `postgresql://donate:donate@localhost:5432/donations` (для подключения с хоста).

В `docker-compose` при первом старте автоматически выполняется `prisma db push`. Переменные из `.env` подхватываются (в т.ч. `JWT_SECRET`, Stripe). Для создания аккаунта администратора после первого запуска выполните на хосте (с установленным Node и настроенным `DATABASE_URL` на контейнерную БД):
```bash
npm run admin:create
```

## Страницы

- `/` — главная.
- `/streamer/[slug]` — страница стримера с виджетом донатов (нужен существующий Streamer в БД).
- `/donation/success` — страница после успешной оплаты (`?donationId=...`).

## API

- `GET /api/csrf` — выдача CSRF-токена (устанавливает cookie, возвращает `{ csrfToken }`). Вызывать перед отправкой формы доната.
- `POST /api/donations/create` — создание доната (тело: streamerId, amount, message?, isAnonymous?, streamId?, idempotencyKey?). Требуется CSRF (cookie + заголовок `x-csrf-token`). Rate limit: по IP (60/15 мин) и по streamerId (30/15 мин). Ответ: `{ clientSecret, donationId }`.
- `GET /api/streamers/[slug]` — данные стримера по slug. Ответ: `{ id, slug, displayName }` или 404.
- `POST /api/payment/webhook` — webhook Stripe (подпись проверяется по `STRIPE_WEBHOOK_SECRET`).
