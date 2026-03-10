# syntax=docker/dockerfile:1.4
# Сборка
FROM node:20-alpine AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
# Кэш npm — повторные сборки качают пакеты из кэша, а не из сети
RUN --mount=type=cache,target=/root/.npm \
    npm config set cache /root/.npm --global

COPY package.json package-lock.json* ./
COPY .npmrc* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

COPY . .
RUN mkdir -p public

# Prisma generate нужен для сборки; DATABASE_URL — заглушка
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npx prisma generate

# Сборка только в production — иначе в браузер попадут webpack-hmr и react-dom-client.development.js
ENV NODE_ENV=production
RUN --mount=type=cache,target=/app/.next/cache \
    NODE_ENV=production npm run build

# Продакшен-образ
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
# Зависимости Prisma CLI для migrate deploy при старте контейнера
COPY --from=builder /app/node_modules/@prisma/config ./node_modules/@prisma/config
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Сначала применяем миграции (или db push, если БД без истории миграций), затем запускаем сервер.
# Ошибки не скрываем — иначе при проблемах с БД вход/регистрация не работают, а причину не видно.
# Логи приложения видны в: docker compose logs -f app
CMD ["sh", "-c", "npx prisma migrate deploy || npx prisma db push --skip-generate --accept-data-loss; echo '[app] Starting Node server...'; exec node server.js"]
