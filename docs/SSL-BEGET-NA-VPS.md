# SSL с Beget на VPS (scrooge-donat.ru)

**По вики Beget** ([wiki.beget.tech/ru/ssl/private-key](http://wiki.beget.tech/ru/ssl/private-key.html)):

- **Бесплатный сертификат (Let's Encrypt)** — содержимое не выдаётся клиенту. Скачать/экспортировать сертификат и ключ с панели нельзя.
- **Платный сертификат** — приватный ключ и цепочка сертификатов приходят на почту, указанную при заказе. Их можно положить на свой сервер и прописать в Nginx.

Если у тебя бесплатный SSL от Beget — для своего VPS сертификат нужно получить отдельно (например через certbot, см. **docs/SSL-CERTBOT-VPS.md**). Ниже — вариант для тех, у кого есть возможность скопировать сертификат и ключ (платный серт или ручная установка).

## 1. Скопировать с Beget

В панели Beget для домена scrooge-donat.ru (раздел SSL/Сертификат):

1. **Сертификат** — выдели и скопируй **весь** текст от `-----BEGIN CERTIFICATE-----` до `-----END CERTIFICATE-----` (включая эти строки).
2. **Приватный ключ** — выдели и скопируй **весь** текст от `-----BEGIN RSA PRIVATE KEY-----` до `-----END RSA PRIVATE KEY-----` (включая эти строки).

Не добавляй лишних пробелов и переносов в начало/конец.

## 2. На VPS — создать файлы сертификата и ключа

Подключись к серверу и создай папку для SSL (если ещё нет):

```bash
sudo mkdir -p /etc/nginx/ssl
sudo chmod 700 /etc/nginx/ssl
```

**Сертификат:**

```bash
sudo nano /etc/nginx/ssl/scrooge-donat.ru.crt
```

Вставь скопированный из Beget блок сертификата (от BEGIN до END), сохрани (Ctrl+O, Enter, Ctrl+X).

**Приватный ключ:**

```bash
sudo nano /etc/nginx/ssl/scrooge-donat.ru.key
```

Вставь скопированный из Beget блок ключа (от BEGIN до END), сохрани.

Права на ключ:

```bash
sudo chmod 600 /etc/nginx/ssl/scrooge-donat.ru.key
```

## 3. Nginx — конфиг только для scrooge-donat.ru

В репозитории лежит готовый конфиг: **deploy/nginx/scrooge-donat.conf**. Он не трогает free-tips.ru (отдельный сайт на том же VPS).

На VPS после `git pull` выполни:

```bash
sudo cp deploy/nginx/scrooge-donat.conf /etc/nginx/sites-available/scrooge-donat
sudo ln -sf /etc/nginx/sites-available/scrooge-donat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Конфиг первого сайта (free-tips.ru) не меняй — разделение по доменам идёт через разные файлы и `server_name`.

## 4. Проверка

Открой в браузере: **https://scrooge-donat.ru** — соединение должно быть безопасным (сертификат от Beget).

---

**Если позже Beget обновит сертификат** — скопируй новый сертификат/ключ из панели, обнови файлы на VPS и выполни `sudo nginx -t && sudo systemctl reload nginx`.
