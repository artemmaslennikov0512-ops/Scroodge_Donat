# Два сайта на одном VPS — куда что закидывать

На одном сервере уже есть сайт. Ниже — как разделить его и Scroodge Donat, чтобы ничего не перепутать.

---

## Разделение по папкам и портам

| Что | Твой первый сайт (уже есть) | Scroodge Donat (новый) |
|-----|----------------------------|-------------------------|
| **Папка с кодом** | Оставь как есть (например `/var/www/html` или своя) | **`/var/www/scrooge-donat`** |
| **Порт приложения** | Как сейчас (например **3000**) | **3001** |
| **Домен** | твой-первый-домен.ru | scrooge-donat.ru |
| **Имя в PM2** | как сейчас (не трогай) | **donation-site** |

Идея: первый сайт остаётся на своём порту и в своей папке, донат — в отдельной папке и на порту 3001.

---

## Что делать по шагам

### 1. Не трогать первый сайт

- Папку с его кодом не перезаписывать.
- Конфиг Nginx для первого домена не менять.
- PM2 для первого сайта не трогать.

### 2. Создать отдельную папку для Scroodge Donat

На VPS:

```bash
mkdir -p /var/www/scrooge-donat
cd /var/www/scrooge-donat
git clone https://github.com/artemmaslennikov0512-ops/Scroodge_Donat.git .
```

Весь код доната будет только в **`/var/www/scrooge-donat`**. В `/var/www/html` ничего не кладём, если там уже первый сайт.

### 3. Запускать донат на порту 3001

Next.js по умолчанию слушает 3000. Чтобы не пересечься с первым сайтом, запускаем на **3001**:

В `.env` в папке доната (`/var/www/scrooge-donat/.env`) добавь или проверь:

```env
PORT=3001
```

Запуск через PM2 — из папки standalone, с портом 3001 (переменная окружения):

```bash
cd /var/www/scrooge-donat/.next/standalone
PORT=3001 pm2 start server.js --name donation-site
pm2 save
```

Или один раз задать порт в ecosystem-файле PM2, чтобы при перезапуске порт не терялся (см. ниже).

### 4. Nginx: два блока — два сайта

В Nginx должны быть **два отдельных** блока `server`:

- Один с `server_name` первого домена и `proxy_pass http://127.0.0.1:3000;` (или какой порт у первого сайта).
- Второй только для scrooge-donat.ru с `proxy_pass http://127.0.0.1:3001;`.

Пример: конфиг для доната лежит отдельно:

```bash
nano /etc/nginx/sites-available/scrooge-donat
```

Содержимое (только для scrooge-donat.ru). Для HTTPS нужен сертификат с Beget — см. **docs/SSL-BEGET-NA-VPS.md**.

```nginx
server {
    listen 80;
    server_name scrooge-donat.ru www.scrooge-donat.ru;
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name scrooge-donat.ru www.scrooge-donat.ru;

    ssl_certificate     /etc/nginx/ssl/scrooge-donat.ru.crt;
    ssl_certificate_key /etc/nginx/ssl/scrooge-donat.ru.key;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Файлы сертификата и ключа нужно создать на VPS из панели Beget (см. docs/SSL-BEGET-NA-VPS.md).

Включить только этот сайт:

```bash
ln -sf /etc/nginx/sites-available/scrooge-donat /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

Конфиг **первого** сайта (в `sites-available` / `sites-enabled`) не меняем — там должен остаться его домен и его порт (3000).

### 5. Итоговая схема

```
Первый домен (твой-первый-домен.ru)
  → Nginx server_name первый домен
  → proxy_pass http://127.0.0.1:3000
  → приложение в своей папке, PM2 под своим именем

scrooge-donat.ru
  → Nginx server_name scrooge-donat.ru
  → proxy_pass http://127.0.0.1:3001
  → папка /var/www/scrooge-donat
  → PM2: donation-site, порт 3001
```

---

## Чтобы PORT=3001 не сбрасывался (PM2)

Создай в папке доната файл для PM2:

```bash
nano /var/www/scrooge-donat/ecosystem.config.cjs
```

Содержимое:

```js
module.exports = {
  apps: [{
    name: 'donation-site',
    script: 'server.js',
    cwd: '/var/www/scrooge-donat/.next/standalone',
    env: { PORT: 3001 },
    instances: 1,
  }],
};
```

Запуск/перезапуск:

```bash
cd /var/www/scrooge-donat
pm2 start ecosystem.config.cjs
# или после изменений:
pm2 restart donation-site
pm2 save
```

Тогда донат всегда будет на 3001, первый сайт на 3000 — ничего не перепутается.

---

## Скрипт обновления доната

Скрипт `scripts/deploy-on-server.sh` вызывай **из папки доната** и только для него:

```bash
cd /var/www/scrooge-donat
./scripts/deploy-on-server.sh
```

После деплоя перезапуск с портом 3001 (если используешь ecosystem):

```bash
pm2 restart donation-site
pm2 save
```

Первый сайт при этом не трогаешь — у него своя папка и свой процесс в PM2.
