#!/usr/bin/env bash
# Запускать на сервере Beget из корня проекта: ./scripts/deploy-on-server.sh
# Делает: git pull → npm ci → prisma generate → build → копирование static → перезапуск PM2

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> Git pull..."
git pull

echo "==> npm ci..."
npm ci

echo "==> Prisma generate..."
npx prisma generate

echo "==> Build..."
npm run build

STANDALONE="$REPO_ROOT/.next/standalone"
STATIC_SRC="$REPO_ROOT/.next/static"
STATIC_DST="$STANDALONE/.next/static"

echo "==> Копирование .next/static в standalone..."
mkdir -p "$STATIC_DST"
rm -rf "$STATIC_DST"/*
cp -r "$STATIC_SRC"/* "$STATIC_DST"/

echo "==> Перезапуск приложения..."
if command -v pm2 >/dev/null 2>&1; then
  cd "$STANDALONE"
  if pm2 describe donation-site >/dev/null 2>&1; then
    pm2 restart donation-site
  else
    pm2 start server.js --name donation-site
  fi
  pm2 save
  cd "$REPO_ROOT"
  echo "==> Готово. PM2: donation-site перезапущен."
else
  echo "==> PM2 не найден. Запустите вручную из $STANDALONE:"
  echo "    cd $STANDALONE && node server.js"
  echo "    (или установите PM2: npm i -g pm2 и снова запустите этот скрипт)"
fi
