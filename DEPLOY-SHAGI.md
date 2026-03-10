# Деплой по шагам: что делать после создания сайта и домена на Beget

Ты уже сделал: репозиторий в Git, сайт на Beget, привязал домен (scrooge-donat.ru).  
Ниже — порядок действий дальше.

---

## Шаг 1. Убедиться, что есть VPS и доступ по SSH

- Если у тебя **VPS Beget**: в панели Beget открой раздел **VPS** / **Серверы**, найди свой сервер и посмотри **IP-адрес** и способ входа (**SSH**: логин и пароль или ключ).
- Если сайт создан на **виртуальном хостинге** (не VPS): для Node.js нужен либо переход на VPS, либо раздел «Сайты» → твой сайт → настройки **Node.js** (если в тарифе есть). Для нашей инструкции дальше предполагается **VPS**.

Запомни: **IP сервера**, **логин SSH**, **пароль (или ключ)**.

---

## Шаг 2. Настроить домен на сервер (DNS)

Чтобы scrooge-donat.ru открывал твой проект на VPS:

- В Beget: **Домены** → выбери **scrooge-donat.ru** → **Управление DNS** / **Зона**.
- Должна быть **A-запись** на IP твоего VPS:
  - Имя: `@` (или пусто) для scrooge-donat.ru
  - Тип: **A**
  - Значение: **IP твоего VPS**
- При желании то же для `www`: имя `www`, тип **A**, значение — IP VPS.

Если домен привязан к «сайту» на хостинге, а сайт физически будет на VPS — нужно либо сменить A-запись на IP VPS, либо в панели указать, что домен ведёт на этот VPS (зависит от тарифа). Итог: при открытии https://scrooge-donat.ru запрос должен уходить на твой VPS.

---

## Шаг 3. Подключиться к серверу по SSH

На Windows (PowerShell или CMD):

```bash
ssh root@IP_ТВОЕГО_VPS
```

Подставь IP из шага 1. Введи пароль (или используй ключ). После входа ты в консоли сервера (Linux).

---

## Шаг 4. Установить всё нужное на сервере (один раз)

Выполни на VPS **одну** из двух схем.

### Вариант А: VPS с образом «Node.js» в Beget

Тогда Node и Nginx уже есть. Проверь:

```bash
node -v
pm2 -v
```

Если есть — переходи к **шагу 5**. Если нет — используй **вариант Б**.

### Вариант Б: чистый VPS (Ubuntu)

Скачай и запусти скрипт настройки (нужен интернет на сервере):

```bash
cd ~
curl -sSL https://raw.githubusercontent.com/artemmaslennikov0512-ops/Scroodge_Donat/main/scripts/setup-beget-vps.sh -o setup.sh
chmod +x setup.sh
sudo bash setup.sh
```

Скрипт поставит Node.js, PostgreSQL, PM2 и Nginx. В конце выведет, что делать дальше. Смени пароль пользователя БД (как написано в выводе скрипта), затем переходи к **шагу 5**.

---

## Шаг 5. Клонировать проект на сервер

На VPS выполни (если после скрипта папка уже есть — зайди в неё и сделай `git pull` вместо клонирования):

```bash
cd /var/www
sudo rm -rf html
sudo git clone https://github.com/artemmaslennikov0512-ops/Scroodge_Donat.git html
cd html
```

Если клонируешь под root, проверь права (для образа Node.js часто нужен пользователь `nodejs`):

```bash
sudo chown -R nodejs:nodejs /var/www/html
```

(Если пользователя `nodejs` нет — можно оставить владельца root или своего пользователя.)

---

## Шаг 6. Создать .env на сервере

На сервере в папке проекта:

```bash
cd /var/www/html
nano .env
```

Вставь настройки для продакшена (подставь свои значения):

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://scrooge-donat.ru
NEXTAUTH_URL=https://scrooge-donat.ru
DATABASE_URL=postgresql://postgres:ТВОЙ_ПАРОЛЬ_БД@localhost:5433/donations
NEXTAUTH_SECRET=любая-длинная-случайная-строка-32-символа
JWT_SECRET=другая-длинная-случайная-строка-32-символа
AUTH_TRUST_HOST=true
TRUST_PROXY=true
```

Добавь свои ключи Stripe (NEXT_PUBLIC_STRIPE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET). При необходимости — SMTP и остальное из твоего локального .env (пароли и секреты не копируй один в один — сгенерируй новые для прода).

Сохрани: Ctrl+O, Enter, Ctrl+X.

---

## Шаг 7. Собрать проект и применить миграции

На сервере:

```bash
cd /var/www/html
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
```

Если образ «Node.js» и приложение должно работать от пользователя `nodejs`:

```bash
sudo -u nodejs npm ci
sudo -u nodejs npx prisma generate
sudo -u nodejs npx prisma migrate deploy
sudo -u nodejs npm run build
```

---

## Шаг 8. Запустить приложение через PM2

```bash
cd /var/www/html
cp -r .next/static .next/standalone/.next/
cd .next/standalone
sudo -u nodejs pm2 start server.js --name donation-site
sudo -u nodejs pm2 save
sudo -u nodejs pm2 startup
```

(Если пользователя `nodejs` нет — просто `pm2 start server.js --name donation-site` и т.д.)

Проверь: `pm2 list` — процесс `donation-site` должен быть в статусе online.

---

## Шаг 9. Проверить Nginx

Nginx должен проксировать запросы на порт 3000. Если использовал скрипт из шага 4 — уже настроено. Иначе проверь конфиг:

```bash
cat /etc/nginx/sites-enabled/donation-app
# или
cat /etc/nginx/sites-available/nodejs.conf
```

Должно быть что-то вроде: `proxy_pass http://127.0.0.1:3000;`. Если правил конфиг:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Шаг 10. SSL (HTTPS)

В панели Beget для домена scrooge-donat.ru обычно можно включить **Let's Encrypt**. Если сервер свой и панель не выдает сертификат на VPS — на самом сервере можно поставить certbot и получить сертификат на этот домен.

После включения HTTPS открой в браузере: **https://scrooge-donat.ru** — должна открыться твоя лендинг/приложение.

---

## Дальше: как обновлять сайт

- Локально: правки в коде → `git add .` → `git commit -m "..."` → `git push`.
- На сервере один раз после каждого пуша:

```bash
cd /var/www/html
./scripts/deploy-on-server.sh
```

Файлы вручную на хостинг заливать не нужно.

---

## Краткий чеклист

| # | Действие |
|---|----------|
| 1 | Узнать IP VPS и данные для SSH |
| 2 | A-запись домена scrooge-donat.ru → IP VPS |
| 3 | Подключиться по SSH к VPS |
| 4 | Запустить скрипт настройки (или убедиться, что Node/PM2/Nginx уже есть) |
| 5 | Клонировать репозиторий в /var/www/html |
| 6 | Создать .env на сервере |
| 7 | npm ci, prisma generate, prisma migrate deploy, npm run build |
| 8 | Запустить через PM2 из .next/standalone |
| 9 | Проверить Nginx (прокси на 3000) |
| 10 | Включить SSL и открыть https://scrooge-donat.ru |

Если на каком-то шаге будет ошибка — напиши, на каком именно и что выводит консоль.
