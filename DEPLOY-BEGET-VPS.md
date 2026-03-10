# Деплой на VPS Beget (scrooge-donat.ru)

Пошаговая инструкция: выложить проект на VPS Beget и запустить сайт.

---

## Вариант A: VPS с образом «Node.js» из маркетплейса Beget

Если при создании VPS вы выбрали образ **Node.js** (в каталоге Beget): на сервере уже есть Node.js 22, Nginx (прокси на порт 3000), PM2 и пользователь `nodejs`. SSL для домена обычно выставляется автоматически.

### 1. Подключение по SSH

Из панели Beget скопируйте IP и логин/пароль (или ключ) для SSH. Подключитесь:

```bash
ssh root@IP_ВАШЕГО_VPS
# или с ключом: ssh -i ключ root@IP_ВАШЕГО_VPS
```

### 2. Клонирование проекта

Приложение должно лежать в `/var/www/html` (так настроен Nginx в образе):

```bash
cd /var/www
# если там уже есть содержимое — удалите или переименуйте html
mv html html.bak 2>/dev/null || true
git clone https://github.com/artemmaslennikov0512-ops/Scroodge_Donat.git html
cd html
```

### 3. PostgreSQL на этом же VPS

```bash
apt update && apt install -y postgresql postgresql-contrib
systemctl start postgresql && systemctl enable postgresql

# Если нужен отдельный пользователь (иначе используйте postgres):
# sudo -u postgres psql -c "CREATE USER donation_user WITH PASSWORD 'ВАШ_ПАРОЛЬ';"
# sudo -u postgres psql -c "CREATE DATABASE donations OWNER donation_user;"
```

Пароль запомните — он понадобится в `.env`.

### 4. Файл .env на сервере

```bash
cd /var/www/html
nano .env
```

Вставьте (подставьте свои значения):

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://scrooge-donat.ru
NEXTAUTH_URL=https://scrooge-donat.ru
DATABASE_URL=postgresql://postgres:ВАШ_ПАРОЛЬ@localhost:5433/donations
NEXTAUTH_SECRET=случайная-строка-не-менее-32-символов
JWT_SECRET=другая-случайная-строка-32-символа
AUTH_TRUST_HOST=true
TRUST_PROXY=true
```

Плюс ключи Stripe (`NEXT_PUBLIC_STRIPE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) и при необходимости SMTP. Сохраните (Ctrl+O, Enter, Ctrl+X).

### 5. Сборка и запуск от пользователя nodejs

```bash
cd /var/www/html
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
```

Скопировать static в standalone и запустить через PM2:

```bash
cp -r .next/static .next/standalone/.next/
cd .next/standalone
sudo -u nodejs pm2 start server.js --name donation-site
sudo -u nodejs pm2 save
sudo -u nodejs pm2 startup
cd /var/www/html
```

Проверьте: `sudo -u nodejs pm2 list` — процесс `donation-site` должен быть в статусе online. Nginx уже проксирует запросы на `localhost:3000`, сайт должен открываться по https://scrooge-donat.ru.

### 6. Первый админ (по желанию)

```bash
cd /var/www/html
# в .env задайте ADMIN_EMAIL и ADMIN_PASSWORD, затем:
sudo -u nodejs npm run admin:create
```

---

## Вариант B: Чистый VPS (Ubuntu) без образа Node.js

Если VPS создан с обычным Ubuntu (без образа Node.js), можно один раз выполнить скрипт настройки, затем вручную клонировать проект и собрать.

### 1. Подключение по SSH

```bash
ssh root@IP_ВАШЕГО_VPS
```

### 2. Запуск скрипта настройки сервера

Скопируйте на VPS и выполните скрипт (или вставьте его содержимое по шагам):

```bash
curl -sSL https://raw.githubusercontent.com/artemmaslennikov0512-ops/Scroodge_Donat/main/scripts/setup-beget-vps.sh -o setup.sh
chmod +x setup.sh
./setup.sh
```

Либо скопируйте `scripts/setup-beget-vps.sh` на сервер вручную (scp/файловый менеджер) и запустите: `bash setup-beget-vps.sh`.

Скрипт ставит: Node.js 20, PostgreSQL, PM2, Nginx (прокси на 3000), создаёт базу и пользователя БД. В конце выведет напоминание создать `.env` и клонировать репозиторий.

### 3. Дальнейшие шаги как в варианте A

- Клонировать репозиторий в выбранную папку (например `/var/www/html` или `~/Scroodge_Donat`).
- Создать `.env` с `DATABASE_URL`, `NEXTAUTH_*`, `JWT_SECRET`, Stripe и т.д.
- Выполнить: `npm ci`, `npx prisma generate`, `npx prisma migrate deploy`, `npm run build`.
- Скопировать ` .next/static` в `.next/standalone/.next/`, запустить из `.next/standalone`: `pm2 start server.js --name donation-site`, `pm2 save`.

Путь для приложения в скрипте — по умолчанию `/var/www/html`; при необходимости отредактируйте переменную `APP_DIR` в начале скрипта.

---

## Обновление сайта после изменений в коде

Локально (у себя):

```bash
git add .
git commit -m "описание"
git push
```

На VPS:

```bash
cd /var/www/html
./scripts/deploy-on-server.sh
```

Скрипт сделает `git pull`, пересборку и перезапуск PM2. Файлы вручную заливать не нужно.

---

## Полезные команды на VPS

| Действие              | Команда |
|-----------------------|--------|
| Логи приложения       | `pm2 logs donation-site` |
| Перезапуск            | `pm2 restart donation-site` |
| Статус                | `pm2 list` |
| Перезагрузка Nginx    | `nginx -s reload` |
| Конфиг Nginx (порт)   | `/etc/nginx/sites-available/default` или `nodejs.conf` |

---

## Если сайт не открывается

1. Проверьте, что приложение слушает порт 3000: `pm2 list` и `ss -tlnp | grep 3000`.
2. Убедитесь, что в Nginx есть `proxy_pass http://127.0.0.1:3000;` для вашего домена.
3. В `.env` на сервере: `NEXTAUTH_URL` и `NEXT_PUBLIC_APP_URL` должны быть `https://scrooge-donat.ru`.
4. Логи: `pm2 logs donation-site` и `journalctl -u nginx -n 50`.
