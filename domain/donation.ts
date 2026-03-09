/**
 * Доменные правила донатов.
 * Без зависимостей от БД и платёжного провайдера (Stripe вызывается снаружи).
 */

export const DONATION_AMOUNT_MIN_RUB = 10;
export const DONATION_AMOUNT_MAX_RUB = 100_000;
export const DONATION_MESSAGE_MAX_LENGTH = 500;

export function isAmountInRange(amountRub: number): boolean {
  return amountRub >= DONATION_AMOUNT_MIN_RUB && amountRub <= DONATION_AMOUNT_MAX_RUB;
}

export function validateMessage(message: string | null | undefined): string | null {
  if (message == null || message.trim() === "") return null;
  const trimmed = message.trim();
  if (trimmed.length > DONATION_MESSAGE_MAX_LENGTH) {
    throw new Error(`Сообщение не более ${DONATION_MESSAGE_MAX_LENGTH} символов`);
  }
  return trimmed;
}
