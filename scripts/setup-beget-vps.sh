#!/usr/bin/env bash
# Первичная настройка чистого VPS (Ubuntu 22.04) для Scroodge Donat: Node.js, PostgreSQL, PM2, Nginx.
# Запуск: sudo bash setup-beget-vps.sh
# После скрипта: клонировать репозиторий, создать .env, npm ci && prisma migrate deploy && npm run build && pm2 start.

set -e

APP_DIR="${APP_DIR:-/var/www/html}"
DB_NAME="${DB_NAME:-donations}"
DB_USER="${DB_USER:-donation_user}"
DOMAIN="${DOMAIN:-scrooge-donat.ru}"

echo "==> Обновление пакетов..."
apt-get update -qq && apt-get install -y -qq curl git

echo "==> Установка Node.js 20.x..."
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v 2>/dev/null)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
node -v
npm -v

echo "==> Установка PostgreSQL..."
apt-get install -y -qq postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

echo "==> Создание базы и пользователя (пароль нужно задать вручную после скрипта)..."
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD 'CHANGE_ME_AFTER_FIRST_RUN';"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

echo "==> Установка PM2..."
npm install -g pm2

echo "==> Установка Nginx..."
apt-get install -y -qq nginx
cat > /etc/nginx/sites-available/donation-app << NGINX_EOF
server {
    listen 80;
    server_name $DOMAIN;
NGINX_EOF
cat >> /etc/nginx/sites-available/donation-app << 'NGINX_EOF'
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_EOF
ln -sf /etc/nginx/sites-available/donation-app /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
systemctl enable nginx

echo "==> Создание каталога приложения..."
mkdir -p "$APP_DIR"
chown -R "$SUDO_USER:$SUDO_USER" "$APP_DIR" 2>/dev/null || true

echo ""
echo "=== Готово. Дальше выполните на сервере ==="
echo "1. Сменить пароль пользователя БД (если создавали с CHANGE_ME_AFTER_FIRST_RUN):"
echo "   sudo -u postgres psql -c \"ALTER USER $DB_USER WITH PASSWORD 'ваш_пароль';\""
echo "2. Клонировать проект:"
echo "   cd $(dirname "$APP_DIR") && git clone https://github.com/artemmaslennikov0512-ops/Scroodge_Donat.git $(basename "$APP_DIR") && cd $APP_DIR"
echo "3. Создать .env (скопировать из .env.example и заполнить DATABASE_URL, NEXTAUTH_*, JWT_SECRET, Stripe и т.д.)."
echo "4. Собрать и запустить:"
echo "   npm ci && npx prisma generate && npx prisma migrate deploy && npm run build"
echo "   cp -r .next/static .next/standalone/.next/"
echo "   cd .next/standalone && pm2 start server.js --name donation-site && pm2 save && pm2 startup"
echo ""
