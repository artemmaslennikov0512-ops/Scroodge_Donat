# Nginx: разделение сайтов на одном VPS

На одном сервере два проекта — два отдельных конфига в Nginx:

| Домен            | Файл на VPS (sites-available) | Порт приложения |
|------------------|--------------------------------|-----------------|
| free-tips.ru     | свой конфиг (не в этом репо)   | 3000            |
| scrooge-donat.ru | `scrooge-donat` (этот файл)   | 3001            |

Nginx выбирает блок по `server_name`: запрос на scrooge-donat.ru обрабатывает только этот конфиг, free-tips.ru — только свой.

## SSL через Certbot (без остановки Nginx)

Сертификат получаем по **webroot** — Nginx не останавливаем. Пошагово: **docs/SSL-CERTBOT-VPS.md**.

Кратко: сначала ставишь `scrooge-donat-80-acme.conf`, запускаешь certbot, потом ставишь полный `scrooge-donat.conf`.

## Установка полного конфига (когда сертификат уже есть)

Из папки проекта на сервере (например `~/scrooge-donat` после `git pull`):

```bash
sudo cp deploy/nginx/scrooge-donat.conf /etc/nginx/sites-available/scrooge-donat
sudo ln -sf /etc/nginx/sites-available/scrooge-donat /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Конфиг free-tips.ru не трогать.

## Если на scrooge-donat.ru подставляется сертификат free-tips.ru

Так бывает, когда для scrooge-donat.ru на 443 нет своего блока или нет сертификата — Nginx отдаёт default (первый блок с `listen 443`), то есть free-tips.

**Проверить на VPS:**

```bash
# Конфиг доната подключён?
ls -la /etc/nginx/sites-enabled/scrooge-donat

# Есть ли сертификат для доната? (должны быть файлы)
sudo ls -la /etc/letsencrypt/live/scrooge-donat.ru/
```

Если симлинка нет — конфиг не подхватывается. Если папки с сертификатом нет — сначала получить сертификат (см. docs/SSL-CERTBOT-VPS.md), потом поставить полный конфиг:

```bash
sudo cp ~/scrooge-donat/deploy/nginx/scrooge-donat.conf /etc/nginx/sites-available/scrooge-donat
sudo ln -sf /etc/nginx/sites-available/scrooge-donat /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```
