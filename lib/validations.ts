import { z } from "zod";
import { DONATION_AMOUNT_MIN_RUB, DONATION_AMOUNT_MAX_RUB, DONATION_MESSAGE_MAX_LENGTH } from "@/domain/donation";
import { isValidPhone, normalizePhone } from "@/lib/phone";

/** Строка телефона: валидация и нормализация (Россия/СНГ). */
export const phoneSchema = z
  .string()
  .min(1, "Введите номер телефона")
  .refine(isValidPhone, "Неверный формат номера. Пример: +7 999 123-45-67")
  .transform(normalizePhone);

export const createDonationBodySchema = z.object({
  streamerId: z.string().min(1, "streamerId обязателен"),
  amount: z
    .number()
    .min(DONATION_AMOUNT_MIN_RUB, `Минимальная сумма ${DONATION_AMOUNT_MIN_RUB} ₽`)
    .max(DONATION_AMOUNT_MAX_RUB, `Максимальная сумма ${DONATION_AMOUNT_MAX_RUB} ₽`),
  message: z.string().max(DONATION_MESSAGE_MAX_LENGTH).optional().nullable(),
  isAnonymous: z.boolean().optional().default(false),
  streamId: z.string().max(100).optional().nullable(),
  idempotencyKey: z.string().max(128).optional().nullable(),
  goalId: z.string().min(1).optional().nullable(),
});

export type CreateDonationBody = z.infer<typeof createDonationBodySchema>;
