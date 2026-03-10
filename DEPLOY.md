# Запуск и обновление приложения

## Чтобы увидеть последние изменения кода

### Локально (npm)
```bash
npm run dev
```

### Docker (после любого изменения кода)
**Обязательно пересоберите образ**, иначе работает старая версия:

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

Или одной командой:
```bash
docker compose up --build -d
```

### На сервере
```bash
cd ~/scrooge-donat
git pull
docker compose up -d --build
```

## Вход в ЛК и регистрация не работают — часто из‑за БД и миграций

Если не заходит в личный кабинет стримера и не регистрируются аккаунты, в большинстве случаев причина в том, что в базе нет нужных таблиц/колонок (миграции не применены или схема не синхронизирована).

### Что сделано в проекте

- При старте контейнера сначала выполняется **`prisma migrate deploy`** (применяет все неприменённые миграции), при ошибке — **`prisma db push`** (подтягивает схему без миграций). Ошибки больше не скрываются — их видно в `docker compose logs app`.
- В миграциях добавлены таблицы **EmailVerificationToken**, **StreamerVerification** и недостающие колонки у **User** и **AdminNotification**.

### Что сделать вам

1. **Пересоберите и запустите контейнеры** (чтобы в образ попал новый CMD с миграциями):
   ```bash
   docker compose down
   docker compose up --build -d
   ```
2. **Посмотрите логи приложения** — при старте должны быть либо сообщения об успешном применении миграций, либо ошибка Prisma (по ней можно понять проблему с БД):
   ```bash
   docker compose logs app
   ```
3. **Если БД уже была создана раньше без миграций** (только через db push), при первом запуске `migrate deploy` может упасть с «relation already exists». Тогда сработает fallback `db push` — схема подтянется, таблицы/колонки появятся. После этого перезапустите контейнер или попробуйте вход/регистрацию снова.
4. **Ошибка P3005 («The database schema is not empty»)** — значит в БД уже есть таблицы (созданы через `db push` или вручную), но история миграций Prisma пуста. Нужно сделать **baseline** (пометить уже применённые миграции) и затем применить только новые:
   ```powershell
   $env:DATABASE_URL="postgresql://donate:donate@localhost:5432/donations"
   .\prisma\baseline.ps1
   ```
   Или вручную:
   ```bash
   set DATABASE_URL=postgresql://donate:donate@localhost:5432/donations
   npx prisma migrate resolve --applied 20260301222641_init
   npx prisma migrate resolve --applied 20260301223704_admin_must_change_password
   npx prisma migrate resolve --applied 20260301231715_add_user_auth
   npx prisma migrate deploy
   ```
   После этого в БД появятся таблицы `EmailVerificationToken`, `StreamerVerification` и нужные колонки. Вход и регистрация должны заработать.

5. **Применить миграции вручную с хоста** (если БД пустая или baseline уже сделан):
   ```bash
   set DATABASE_URL=postgresql://donate:donate@localhost:5432/donations
   npx prisma migrate deploy
   ```
   Порт замените на свой, если БД слушает не 5432.

### Помимо БД проверьте

- **Пересборка образа** после изменений кода: `docker compose up --build -d`.
- **`.env`**: `NEXTAUTH_URL` (URL, по которому заходите), `NEXTAUTH_SECRET` (не короче 32 символов).

## Создание первого админа (после запуска)

На хосте (с доступом к той же БД):

```bash
set DATABASE_URL=postgresql://donate:donate@localhost:5432/donations
npm run admin:create
```

Логин и пароль — из `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).
