# Архитектура сайта донатов

Платёжный провайдер в проекте — **только Stripe**. Paygine и другие провайдеры в этом проекте не используются.

## Слои

- **Delivery** — `app/`: API routes (парсинг HTTP, вызов use case, ответ). Страницы App Router.
- **Application** — `application/`: use cases (CreateDonation, HandleStripeWebhook). Оркестрация через порты.
- **Domain** — `domain/`: правила донатов (лимиты сумм, инварианты). Без зависимостей от БД и Stripe.
- **Infrastructure** — `infrastructure/`: реализация портов (Stripe Gateway, Prisma-репозитории).

Зависимости: delivery → application → domain; infrastructure реализует порты.

## Платёжный порт

Интерфейс `PaymentGateway` в `infrastructure/payment-gateway-port.ts`:

- `createPayment(params)` → `{ success: true, clientSecret, donationId } | { success: false, error }`
- `getStatus(donationId)` → статус
- `handleWebhook(rawBody, signature)` → проверка подписи Stripe, обновление записи, `{ ok: boolean }`

Единственная реализация: **Stripe** (`infrastructure/stripe-gateway.ts`).

## Конфиг и безопасность

- **Переменные окружения** — из `.env` (не коммитится, см. `.gitignore`). Шаблон: `.env.example` (NODE_ENV, NEXT_PUBLIC_APP_URL, DATABASE_URL, Stripe-ключи, STRIPE_WEBHOOK_SECRET). При запуске скопировать в `.env` и заполнить.
- Конфиг приложения: Zod-схема env в `lib/config.ts`. Чтение только из `process.env`. Переменные Stripe и приложения. Без Paygine.
- Валидация API: Zod в `lib/validations.ts`.
- CSRF для форм доната; webhook Stripe — только по подписи.
- Rate limit на создание доната (по IP и по streamerId).

## Структура каталогов

```
.env                 — локальные переменные окружения (не в git)
.env.example        — шаблон переменных для копирования в .env
app/
  api/donations/create/route.ts
  api/payment/webhook/route.ts
  donation/success/page.tsx
application/
  create-donation.ts
  handle-stripe-webhook.ts
domain/
  donation.ts
infrastructure/
  payment-gateway-port.ts
  stripe-gateway.ts
  donation-repository.ts
  prisma-donation-repository.ts
lib/
  config.ts
  validations.ts
  security/csrf.ts
  db.ts
prisma/
  schema.prisma
components/
  DonationWidget.tsx
  Toaster.tsx
lib/
  constants.ts          — клиент-безопасные константы (CSRF_HEADER_NAME)
  rate-limit.ts         — rate limit по IP и streamerId
app/api/
  csrf/route.ts         — GET: выдача CSRF cookie + token
  streamers/[slug]/route.ts — GET: стример по slug
app/streamer/[slug]/
  page.tsx              — страница стримера с DonationWidget
.cursor/rules/
  aqb-mandatory-review.mdc
docs/
  ARCHITECTURE.md
  SECURITY_CHECK.md
  DESIGN_ANALYSIS.md
  adr/0001-payment-gateway-stripe.md
```
