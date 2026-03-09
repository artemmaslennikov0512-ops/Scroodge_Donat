/**
 * Отправка SMS (коды подтверждения телефона).
 * SMS.ru: задайте SMSRU_API_ID в .env.
 * В dev без ключа код выводится в консоль.
 */

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^8/, "7");
}

export async function sendPhoneCode(phone: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const normalized = normalizePhone(phone);
  if (normalized.length < 10) {
    return { ok: false, error: "Некорректный номер" };
  }

  const apiId = process.env.SMSRU_API_ID;
  const text = `Код подтверждения: ${code}. Никому не сообщайте.`;

  if (apiId) {
    try {
      const to = normalized.startsWith("7") ? normalized : `7${normalized}`;
      const url = new URL("https://sms.ru/sms/send");
      url.searchParams.set("api_id", apiId);
      url.searchParams.set("to", to);
      url.searchParams.set("msg", text);
      url.searchParams.set("json", "1");

      const res = await fetch(url.toString());
      const data = (await res.json()) as { status?: string; status_code?: number };
      if (data.status === "OK" && data.status_code === 100) {
        return { ok: true };
      }
      return { ok: false, error: "Ошибка отправки SMS" };
    } catch (e) {
      console.error("[SMS] send error:", e);
      return { ok: false, error: "Ошибка отправки SMS" };
    }
  }

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[dev] SMS code for", phone, ":", code);
  }
  return { ok: true };
}
