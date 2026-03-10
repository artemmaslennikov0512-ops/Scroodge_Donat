# Свой PostgreSQL на порту 5433 (рядом с чужим на 5432)

На VPS уже занят 5432 (Docker/чужая БД). Поднимаем второй экземпляр PostgreSQL на порту **5433** — только для Scroodge Donat.

---

## 1. Установить PostgreSQL (если ещё не ставили системный)

```bash
apt-get update
apt-get install -y postgresql postgresql-contrib
```

Если порт 5432 занят Docker’ом, системный Postgres может не запуститься на 5432 — это нормально.

---

## 2. Создать второй кластер на порту 5433

Узнай версию Postgres:

```bash
pg_lsclusters
```

В выводе будет что-то вроде `16 main` или `14 main`. Дальше подставь **16** (или свою версию) и создай второй кластер:

```bash
pg_createcluster 16 main2 -p 5433
```

Запустить его:

```bash
pg_ctlcluster 16 main2 start
```

Проверка — должен слушать 5433:

```bash
ss -tlnp | grep 5433
```

---

## 3. Пользователь и база в этом Postgres (порт 5433)

Подключение к кластеру на 5433 — через сокет (по умолчанию каталог другого кластера). Удобнее указать порт:

```bash
sudo -u postgres psql -p 5433 -c "ALTER USER postgres WITH PASSWORD '89069813784Zaqq123';"
sudo -u postgres psql -p 5433 -c "CREATE DATABASE donations OWNER postgres;"
```

Если `psql -p 5433` не подключается (ошибка сокета), подключайся к сокету второго кластера. Каталог сокетов для `main2`:

```bash
ls /var/run/postgresql/
```

Обычно сокет будет в `/var/run/postgresql/.s.PGSQL.5433`. Тогда:

```bash
sudo -u postgres psql -p 5433 -h /var/run/postgresql -c "ALTER USER postgres WITH PASSWORD '89069813784Zaqq123';"
sudo -u postgres psql -p 5433 -h /var/run/postgresql -c "CREATE DATABASE donations OWNER postgres;"
```

На старых системах сокет может быть в `/var/lib/postgresql/16/main2/` (проверь `pg_lsclusters`).

---

## 4. Разрешить подключения по TCP на 5433

В конфиге второго кластера включи прослушивание и разреши localhost:

```bash
echo "listen_addresses = 'localhost'" >> /etc/postgresql/16/main2/postgresql.conf
echo "port = 5433" >> /etc/postgresql/16/main2/postgresql.conf
```

Файл доступа (подставь путь к `main2`, если версия не 16):

```bash
echo "host all all 127.0.0.1/32 scram-sha-256" >> /etc/postgresql/16/main2/pg_hba.conf
```

Перезапуск второго кластера:

```bash
pg_ctlcluster 16 main2 restart
```

Проверка входа по паролю (с хоста):

```bash
PGPASSWORD='89069813784Zaqq123' psql -h 127.0.0.1 -p 5433 -U postgres -d donations -c "SELECT 1;"
```

---

## 5. .env для приложения

В `~/scrooge-donat/.env`:

```env
DATABASE_URL=postgresql://postgres:89069813784Zaqq123@localhost:5433/donations
```

Дальше:

```bash
cd ~/scrooge-donat
npx prisma migrate deploy
```

---

## Автозапуск второго кластера

Обычно при установке пакета создаётся юнит для каждого кластера, например:

```bash
systemctl enable postgresql@16-main2
systemctl start postgresql@16-main2
```

Проверь имя сервиса:

```bash
systemctl list-units | grep postgresql
```

Итог: 5432 — чужая БД в Docker, 5433 — твой Postgres для donations, к нему подключается только Scroodge Donat.
