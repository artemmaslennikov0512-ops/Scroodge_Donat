/**
 * Отправка уведомления в Discord при новом сообщении в чат поддержки.
 * Использует SUPPORT_DISCORD_WEBHOOK_URL из env. Не блокирует ответ API.
 */

const WEBHOOK_URL = process.env.SUPPORT_DISCORD_WEBHOOK_URL;

export function notifySupportNewMessage(params: {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  username: string | null;
  messagePreview: string;
  appUrl: string;
}): void {
  if (!WEBHOOK_URL || typeof WEBHOOK_URL !== "string" || !WEBHOOK_URL.startsWith("https://")) {
    return;
  }

  const displayName =
    params.userName || params.username || params.userEmail || params.userId;
  const preview =
    params.messagePreview.length > 200
      ? params.messagePreview.slice(0, 200) + "…"
      : params.messagePreview;
  const adminLink = `${params.appUrl.replace(/\/$/, "")}/admin/support/${params.userId}`;

  const payload = {
    content: null,
    embeds: [
      {
        title: "Новое сообщение в поддержку",
        color: 0xe91e63,
        fields: [
          { name: "Пользователь", value: displayName, inline: true },
          {
            name: "Email",
            value: params.userEmail || "—",
            inline: true,
          },
          {
            name: "Сообщение",
            value: preview || "—",
            inline: false,
          },
          {
            name: "Открыть заявку",
            value: `[Перейти в админку](${adminLink})`,
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {
    // игнорируем ошибки вебхука, чтобы не ломать ответ API
  });
}
