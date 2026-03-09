/**
 * Заглушка платёжного шлюза: без реального Stripe.
 * Сразу помечает донат как succeeded и начисляет баланс стримеру.
 */

import type {
  PaymentGateway,
  CreatePaymentParams,
  CreatePaymentResult,
  GetStatusResult,
} from "./payment-gateway-port";
import type { DonationRepository } from "./donation-repository-port";
import { db } from "@/lib/db";
import { STUB_CLIENT_SECRET } from "@/lib/constants";

export function createStubPaymentGateway(donationRepo: DonationRepository): PaymentGateway {
  return {
    async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
      try {
        await donationRepo.updateStatus(params.donationId, "succeeded", null);
        const donation = await donationRepo.getById(params.donationId);
        if (!donation || donation.amountRub <= 0) {
          return { success: true, clientSecret: STUB_CLIENT_SECRET, donationId: params.donationId };
        }

        if (donation.goalId) {
          await db.goal.update({
            where: { id: donation.goalId },
            data: { currentAmount: { increment: donation.amountRub } },
          });
        }

        const streamer = await db.streamer.findUnique({
          where: { id: params.streamerId },
          select: { userId: true },
        });
        if (streamer?.userId) {
          await db.user.update({
            where: { id: streamer.userId },
            data: { balance: { increment: donation.amountRub } },
          });
        }

        return {
          success: true,
          clientSecret: STUB_CLIENT_SECRET,
          donationId: params.donationId,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Ошибка заглушки платежа";
        return { success: false, error: message };
      }
    },

    async getStatus(donationId: string): Promise<GetStatusResult> {
      return donationRepo.getById(donationId).then((r) => (r ? { status: r.status } : null));
    },

    async handleWebhook(): Promise<{ ok: boolean }> {
      return { ok: true };
    },
  };
}
