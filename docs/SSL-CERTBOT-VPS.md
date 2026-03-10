# SSL через Certbot на VPS (без остановки Nginx)

Сертификат Let's Encrypt выпускается по HTTP (webroot). **Nginx не останавливаем.**

**Условие:** A-запись scrooge-donat.ru указывает на IP твоего VPS (31.128.36.83). В Beget в DNS оставь A-запись на свой VPS — «другие DNS», о которых пишет Beget для работы сайта у них, не используем: сайт крутится у тебя.

---

## 1. Установить certbot (один раз)

```bash
sudo apt update && sudo apt install -y certbot
```

## 2. Папка для проверки Let's Encrypt

```bash
sudo mkdir -p /var/www/certbot
```

## 3. Временно поставить конфиг только с портом 80

Чтобы Nginx не ругался на отсутствующие файлы сертификата, сначала ставим конфиг без HTTPS:

```bash
sudo cp deploy/nginx/scrooge-donat-80-acme.conf /etc/nginx/sites-available/scrooge-donat
sudo nginx -t && sudo systemctl reload nginx
```

## 4. Получить сертификат (Nginx работает)

```bash
sudo certbot certonly --webroot -w /var/www/certbot -d scrooge-donat.ru -d www.scrooge-donat.ru --agree-tos --email tippingserviceft@mail.ru --non-interactive
```

## 5. Включить HTTPS — полный конфиг

```bash
sudo cp deploy/nginx/scrooge-donat.conf /etc/nginx/sites-available/scrooge-donat
sudo nginx -t && sudo systemctl reload nginx
```

## 6. Продление (раз в ~90 дней)

```bash
sudo certbot renew
```

Таймер certbot можно включить: `sudo systemctl enable certbot.timer`. Тогда продление автоматическое, Nginx не трогаем.

---

**Про Beget и DNS:** если в панели Beget написано «чтобы домен работал у нас, укажите такие-то DNS» — это про случай, когда сайт физически на их серверах и SSL у них. У тебя сайт на своём VPS, поэтому A-запись должна вести на 31.128.36.83, а SSL делаем certbot’ом на сервере. Другие DNS от Beget для этого не нужны.
