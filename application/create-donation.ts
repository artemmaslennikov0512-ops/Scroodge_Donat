import { isAmountInRange, validateMessage } from "@/domain/donation";
import type { PaymentGateway } from "@/infrastructure/payment-gateway-port";
import type { DonationRepository } from "@/infrastructure/donation-repository-port";

export type CreateDonationInput = {
  streamerId: string;
  streamId?: string | null;
  amount: number;
  message?: string | null;
  isAnonymous: boolean;
  idempotencyKey?: string | null;
  goalId?: string | null;
};

export type CreateDonationResult =
  | { success: true; clientSecret: string; donationId: string }
  | { success: false; error: string };

export function createCreateDonationUseCase(
  donationRepo: DonationRepository,
  paymentGateway: PaymentGateway
) {
  return async function createDonation(input: CreateDonationInput): Promise<CreateDonationResult> {
    if (!isAmountInRange(input.amount)) {
      return { success: false, error: "Сумма вне допустимого диапазона" };
    }

    let message: string | null = null;
    try {
      message = validateMessage(input.message);
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Неверное сообщение" };
    }

    const record = await donationRepo.create({
      streamerId: input.streamerId,
      streamId: input.streamId,
      amountRub: input.amount,
      message,
      isAnonymous: input.isAnonymous,
      goalId: input.goalId ?? undefined,
    });

    const payment = await paymentGateway.createPayment({
      donationId: record.id,
      streamerId: input.streamerId,
      streamId: input.streamId,
      amountRub: input.amount,
      message,
      isAnonymous: input.isAnonymous,
      idempotencyKey: input.idempotencyKey,
    });

    if (!payment.success) {
      return { success: false, error: payment.error };
    }

    return {
      success: true,
      clientSecret: payment.clientSecret,
      donationId: record.id,
    };
  };
}
