"use client";

/**
 * Ловит необработанные ошибки на сервере и при рендере.
 * Показывает сообщение и digest, чтобы по логам/экрану найти причину.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = error?.message ?? "Unknown error";
  const digest = error?.digest;

  return (
    <html lang="ru">
      <body style={{ margin: 0, fontFamily: "system-ui", background: "#0a0a0f", color: "#e5e5e5", minHeight: "100vh", padding: "2rem", boxSizing: "border-box" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h1 style={{ color: "#f59e0b", marginBottom: "0.5rem" }}>Ошибка приложения</h1>
          <p style={{ color: "#a3a3a3", marginBottom: "1rem" }}>
            На сервере произошла ошибка при загрузке страницы.
          </p>
          <pre
            style={{
              background: "rgba(255,255,255,0.05)",
              padding: "1rem",
              borderRadius: "8px",
              overflow: "auto",
              fontSize: "13px",
              marginBottom: "1rem",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: "200px",
            }}
          >
            {message}
          </pre>
          {digest && (
            <p style={{ fontSize: "12px", color: "#737373", marginBottom: "1rem" }}>
              Digest: {digest}
            </p>
          )}
          <p style={{ fontSize: "14px", color: "#a3a3a3", marginBottom: "1rem" }}>
            Частые причины: не задан <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px" }}>NEXTAUTH_SECRET</code> в .env,
            неверный <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px" }}>DATABASE_URL</code> или БД недоступна.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              background: "#f59e0b",
              color: "#000",
              border: "none",
              borderRadius: "6px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Попробовать снова
          </button>
        </div>
      </body>
    </html>
  );
}
