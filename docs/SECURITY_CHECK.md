# Проверка безопасности

Платёжный провайдер в проекте — **только Stripe**. Paygine не используется.

## Чеклист

| Вектор | Мера |
|--------|------|
| **SQL-инъекции** | Только Prisma (параметризованные запросы). |
| **XSS** | Нет `dangerouslySetInnerHTML` / `eval`; вывод через React. |
| **Редиректы** | NextAuth: только same-origin (open redirect устранён). |
| **Секреты** | Только в `process.env`; `.env` в .gitignore. |
| **CSRF** | Проверка cookie + заголовок для форм доната; webhook Stripe — по подписи. |
| **Webhook** | Проверка подписи Stripe (`STRIPE_WEBHOOK_SECRET`); без секрета — отказ. |
| **Логи** | Не логировать карты, токены, authorization; регистрация не логирует токен верификации. |
| **Path traversal** | `/api/uploads/[...path]`: сегменты с `..` и слешами отклоняются. |
| **Rate limit** | Регистрация, админ-логин, forgot-password, request-password-change, донаты. |
| **Пароль** | Минимум 8 символов (регистрация, сброс, смена); в production seed требует ADMIN_PASSWORD. |
| **IP за прокси** | X-Forwarded-For доверяется только при `TRUST_PROXY=true`. |
| **Заголовки** | X-Frame-Options, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy. |

## Заголовки

В `next.config.mjs`: X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy. HSTS при необходимости настраивается на уровне прокси.
