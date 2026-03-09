/**
 * Безопасный разбор JSON из fetch. Если сервер вернул HTML (ошибка 500/404),
 * не падаем с "Unexpected token '<'" и выбрасываем понятную ошибку.
 */
export async function parseJsonFromResponse<T = unknown>(
  res: Response
): Promise<T> {
  const text = await res.text();
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    if (text.trimStart().startsWith("<")) {
      throw new Error(
        "Сервер вернул страницу вместо данных. Проверьте, что приложение и БД запущены."
      );
    }
    throw new Error(text || "Ошибка сервера");
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Сервер вернул некорректный ответ.");
  }
}
