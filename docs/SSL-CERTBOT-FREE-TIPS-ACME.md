# Если certbot не проходит: добавить acme-challenge в free-tips

Когда на порт 80 первым отвечает конфиг free-tips (default), запросы на scrooge-donat.ru тоже попадают туда и получают 301. Let's Encrypt не может получить файл.

**Решение:** в конфиг free-tips в тот же блок `server`, где есть `listen 80`, добавить location для acme-challenge. Тогда путь `/.well-known/acme-challenge/` будет отдаваться без редиректа с любого домена на этом сервере.

**На VPS:**

1. Открыть конфиг free-tips:
   ```bash
   nano /etc/nginx/sites-available/free-tips.ru.conf
   ```

2. Найти блок `server {` с `listen 80;` (может быть в начале файла).

3. Внутри этого блока **перед** любым `location /` вставить:
   ```nginx
   location ^~ /.well-known/acme-challenge/ {
       root /var/www/certbot;
       default_type text/plain;
   }
   ```

4. Сохранить (Ctrl+O, Enter, Ctrl+X).

5. Проверить и перезагрузить:
   ```bash
   nginx -t && systemctl reload nginx
   ```

6. Создать папку и тестовый файл, проверить ответ 200:
   ```bash
   mkdir -p /var/www/certbot/.well-known/acme-challenge
   echo ok > /var/www/certbot/.well-known/acme-challenge/check
   curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1/.well-known/acme-challenge/check -H "Host: scrooge-donat.ru"
   ```
   Должно вывести **200**.

7. Запустить certbot:
   ```bash
   certbot certonly --webroot -w /var/www/certbot -d scrooge-donat.ru -d www.scrooge-donat.ru --agree-tos --email tippingserviceft@mail.ru --non-interactive
   ```

После успешного выпуска сертификата можно оставить этот location в free-tips — он нужен для продления certbot (renew). Либо потом убрать, если захочешь.
