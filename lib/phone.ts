/**
 * Нормализация и валидация номера телефона (Россия и СНГ).
 * Поддерживаются форматы: +7..., 8..., 7..., только цифры.
 */

const DIGITS_ONLY = /^\d+$/;
/** Российский номер: 11 цифр, начинается с 7 (7XXXXXXXXXX). */
const RUSSIAN_FULL = /^7\d{10}$/;
/** После нормализации: 10 цифр (9XXXXXXXXX) — дополняем до 7 + 10. */
const RUSSIAN_10 = /^[89]\d{9}$/;

/**
 * Нормализует ввод к цифрам (убирает пробелы, скобки, дефисы, плюс).
 * Не добавляет код страны.
 */
export function normalizePhoneInput(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Нормализует номер для хранения и сравнения.
 * Российские номера приводятся к виду 7XXXXXXXXXX (11 цифр).
 * Иные номера возвращаются как есть (только цифры) или пустая строка при невалидной длине.
 */
export function normalizePhone(raw: string): string {
  const digits = normalizePhoneInput(raw);
  if (digits.length === 0) return "";
  if (digits.length === 11 && digits.startsWith("7")) return digits;
  if (digits.length === 10 && digits.startsWith("9")) return "7" + digits;
  if (digits.length === 11 && digits.startsWith("8")) return "7" + digits.slice(1);
  if (digits.length <= 15 && digits.length >= 10) return digits;
  return "";
}

/**
 * Проверяет, что номер валидный (российский 10/11 цифр или международный 10–15 цифр).
 */
export function isValidPhone(raw: string): boolean {
  const normalized = normalizePhone(raw);
  if (normalized.length === 0) return false;
  if (normalized.length === 11 && RUSSIAN_FULL.test(normalized)) return true;
  if (normalized.length >= 10 && normalized.length <= 15 && DIGITS_ONLY.test(normalized)) return true;
  return false;
}

/**
 * Сообщение об ошибке для отображения в форме.
 */
export function getPhoneErrorMessage(raw: string): string {
  const digits = normalizePhoneInput(raw);
  if (digits.length === 0) return "Введите номер телефона";
  if (digits.length < 10) return "Номер слишком короткий";
  if (digits.length > 15) return "Номер слишком длинный";
  if (digits.startsWith("7") && digits.length !== 11) return "Российский номер: 11 цифр (7XXXXXXXXXX)";
  if (digits.startsWith("8") && digits.length !== 11) return "Российский номер: 11 цифр (8XXXXXXXXXX)";
  if (digits.startsWith("9") && digits.length !== 10) return "Российский номер: 10 цифр после 8 (9XXXXXXXXX)";
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) return "";
  if (digits.length === 10 && digits.startsWith("9")) return "";
  if (digits.length >= 10 && digits.length <= 15) return "";
  return "Неверный формат номера";
}
