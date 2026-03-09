# Деплой на Beget и обновление без ручной загрузки файлов

Цель: править код у себя на компьютере и выкатывать изменения на сайт **без загрузки файлов через FTP** — через Git и одну команду на сервере (или автоматически по `git push`).

---

## Что понадобится

1. **Аккаунт Beget** с поддержкой Node.js (виртуальный хостинг с SSH или VPS).
2. **Репозиторий Git** с кодом проекта (GitHub, GitLab или Beget Git — если есть).
3. **PostgreSQL**: на виртуальном хостинге — [облачная PostgreSQL от Beget](https://beget.com/ru/cloud/dbaas-postgresql) или внешний сервис (Supabase, Neon); на VPS — можно поставить Postgres на сервере.
4. **Домен**, привязанный к сайту в панели Beget.

---

## 1. Подготовка проекта (один раз)

### Репозиторий

Если репозитория ещё нет:

```bash
cd "c:\Users\masle\Desktop\Сайт донатов"
git init
git add .
git commit -m "Initial commit"
# Создайте репозиторий на GitHub/GitLab и выполните:
git remote add origin https://github.com/ВАШ_ЛОГИН/donation-site.git
git branch -M main
git push -u origin main
```

Файл `.env` в `.gitignore` уже есть — в репозиторий не попадёт. Секреты на сервере задаются отдельно (см. ниже).

---

## 2. Первый деплой на Beget

### 2.1 Подключение по SSH

- **Адрес**: `username@username.beget.tech` (логин и сервер — в панели Beget, блок слева).
- Windows: [PuTTY](https://beget.com/ru/kb/how-to/ssh/kak-podklyuchitsya-po-ssh-iz-windows) или встроенный в Windows 10/11 OpenSSH.
- Linux/macOS: `ssh username@username.beget.tech`.

На виртуальном хостинге Beget Node.js запускается в Docker. После входа выполните:

```bash
ssh localhost -p 222
# введите пароль; в приглашении появится (docker) ...
```

Дальнейшие команды — уже внутри Docker.

### 2.2 Node.js 18+

Если `node -v` показывает старую версию или команда не найдена, установите Node 18+ в каталог `.local` (официальная инструкция: [Установка Node.js на Beget](https://beget.com/ru/kb/how-to/web-apps/node-js)).

Кратко:

```bash
mkdir -p ~/.local && cd ~/.local
wget https://nodejs.org/dist/v20.18.0/node-v20.18.0-linux-x64.tar.xz
tar -xf node-v20.18.0-linux-x64.tar.xz
echo 'export PATH="$HOME/.local/node-v20.18.0-linux-x64/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
node -v   # должно быть v20.x
```

### 2.3 Клонирование и сборка

Выберите каталог для приложения (например, сайт `ваш-домен.ru` в панели → путь типа `~/ваш-домен.ru` или `~/donation-site`).

```bash
cd ~
git clone https://github.com/ВАШ_ЛОГИН/donation-site.git
cd donation-site
```

Установка зависимостей и сборка:

```bash
export PATH="$HOME/.local/node-v20.18.0-linux-x64/bin:$PATH"   # если Node в .local
npm ci
npx prisma generate
npm run build
```

Сборка создаёт standalone: `.next/standalone/` и нужные файлы в `.next/static/`.

### 2.4 Переменные окружения на сервере

На сервере **не загружайте** свой локальный `.env`. Создайте `.env` в корне проекта на Beget (например, `nano .env`) и заполните значениями для продакшена:

- `NODE_ENV=production`
- `NEXT_PUBLIC_APP_URL=https://ваш-домен.ru`
- `DATABASE_URL` — строка подключения к PostgreSQL (Beget Cloud PostgreSQL или другой хост)
- `NEXTAUTH_URL=https://ваш-домен.ru`
- `NEXTAUTH_SECRET` — случайная строка (минимум 32 символа)
- `JWT_SECRET` — случайная строка (минимум 32 символа)
- Ключи Stripe: `NEXT_PUBLIC_STRIPE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- При необходимости: SMTP, `UPLOAD_DIR`, `CRON_SECRET`, `TRUST_PROXY=true` и т.д.

Пример (подставьте свои значения):

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://ваш-домен.ru
DATABASE_URL=postgresql://user:password@host:5432/donations
NEXTAUTH_URL=https://ваш-домен.ru
NEXTAUTH_SECRET=длинный-секрет-32-символа-минимум
JWT_SECRET=другой-секрет-32-символа
# Stripe, SMTP и т.д.
```

Миграции БД (один раз):

```bash
npx prisma migrate deploy
# при необходимости: npm run admin:create  # первый админ
```

### 2.5 Запуск приложения

**Вариант A: PM2 (удобно для перезапуска)**

```bash
npm install -g pm2
cd .next/standalone
cp -r ../static .next/
node server.js
# Проверьте в браузере; затем остановите (Ctrl+C) и запустите через PM2:
pm2 start server.js --name donation-site
pm2 save
pm2 startup   # автозапуск после перезагрузки (если доступно)
```

Рабочий каталог для PM2 должен быть тот, где лежит `server.js` (т.е. `.next/standalone`), и рядом должна быть папка `.next/static`. В `DEPLOY_DIR` в скрипте ниже это учтено.

**Вариант B: без PM2**

```bash
cd .next/standalone
cp -r ../static .next/
nohup node server.js > ../../logs.txt 2>&1 &
```

Порт по умолчанию — 3000. В панели Beget для сайта нужно настроить прокси с домена на `localhost:3000` (если есть такая опция) или следовать инструкции Beget по запуску Node-приложений.

---

## 3. Обновление сайта без ручной загрузки файлов

Идея: вы **редактируете код у себя** → делаете `git push` → на сервере один раз выполняете скрипт обновления (или он запускается автоматически по push).

### На своём компьютере (после правок)

```bash
cd "c:\Users\masle\Desktop\Сайт донатов"
git add .
git commit -m "Описание изменений"
git push
```

### На сервере Beget

Подключитесь по SSH (и при необходимости зайдите в Docker: `ssh localhost -p 222`), перейдите в каталог проекта и выполните скрипт обновления:

```bash
cd ~/donation-site
chmod +x scripts/deploy-on-server.sh
./scripts/deploy-on-server.sh
```

Скрипт делает: `git pull` → `npm ci` → `prisma generate` → `npm run build` → копирование standalone и перезапуск через PM2 (если установлен). После этого сайт уже работает с новым кодом — **ничего вручную по FTP заливать не нужно**.

### Удобный вариант: одна команда по SSH

С Windows (PowerShell) можно вызывать обновление одной командой:

```powershell
ssh username@username.beget.tech "cd donation-site && bash scripts/deploy-on-server.sh"
```

(После входа в Docker на виртуальном хостинге может понадобиться два входа: сначала на Beget, затем `ssh localhost -p 222`, тогда скрипт удобнее запускать уже из сессии внутри Docker.)

---

## 4. Автодеплой по push (по желанию)

Если репозиторий на **GitHub**, можно настроить GitHub Actions: при `git push` в ветку `main` автоматически подключаться к Beget по SSH и запускать скрипт обновления.

1. В репозитории: **Settings → Secrets and variables → Actions** — добавьте секреты:
   - `BEGET_SSH_HOST` (например, `username.beget.tech`)
   - `BEGET_SSH_USER` (логин SSH)
   - `BEGET_SSH_KEY` — приватный ключ SSH (содержимое файла без пароля)

2. В проект добавлен пример workflow: `.github/workflows/deploy-beget.yml`.  
   В файле при необходимости измените путь к проекту на сервере (по умолчанию `~/donation-site`).

После настройки достаточно делать `git push` — деплой выполнится сам.

**Виртуальный хостинг Beget:** приложение и Node.js работают внутри Docker (`ssh localhost -p 222`). GitHub Actions подключается к вашему аккаунту по SSH; если `git` и `node` доступны только внутри Docker, автодеплой по push может не сработать без доработки. В этом случае обновляйте сайт вручную: зайдите по SSH → войдите в Docker → выполните `./scripts/deploy-on-server.sh` в каталоге проекта.

---

## 5. Краткая шпаргалка

| Действие | Где | Команда |
|----------|-----|--------|
| Редактировать код | У себя в Cursor/VS Code | как обычно |
| Отправить изменения | У себя, в папке проекта | `git add . && git commit -m "..." && git push` |
| Обновить сайт | Сервер Beget (SSH) | `cd ~/donation-site && ./scripts/deploy-on-server.sh` |
| Или одной командой с ПК | PowerShell | `ssh user@user.beget.tech "cd donation-site && ./scripts/deploy-on-server.sh"` |

База данных и секреты хранятся только на сервере в `.env`; в репозиторий они не попадают.

---

## 6. Если что-то пошло не так

- **Сайт не открывается**: проверьте, что приложение слушает порт (3000 или тот, что указан в настройках сайта Beget), и что прокси/настройки домена ведут на этот порт.
- **Ошибки БД**: проверьте `DATABASE_URL` в `.env` на сервере и что миграции применены (`npx prisma migrate deploy`).
- **NextAuth/куки**: для production обязательно `NEXTAUTH_URL=https://ваш-домен.ru` и работа по HTTPS.
- **Логи**: при использовании PM2 — `pm2 logs donation-site`; при nohup — смотреть файл, указанный в перенаправлении (например, `logs.txt`).

При необходимости можно править скрипт `scripts/deploy-on-server.sh` под свой путь и способ запуска (PM2 или `node server.js`).
