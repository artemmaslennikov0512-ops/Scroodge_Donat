/**
 * Вызывается один раз при старте инстанса Next.js.
 * Логи выводятся в stdout и видны в `docker compose logs app`.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const port = process.env.PORT ?? "3000";
    const env = process.env.NODE_ENV ?? "development";
    // Используем write + \n, чтобы вывод не буферизовался в Docker
    process.stdout.write(
      `[app] Next.js started | NODE_ENV=${env} | PORT=${port}\n`
    );
  }
}
