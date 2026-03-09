/**
 * Порт платёжного шлюза.
 * В проекте используется только реализация на Stripe (stripe-gateway.ts).
 * Paygine и другие провайдеры не используются.
 */

export type CreatePaymentParams = {
  donationId: string;
  streamerId: string;
  streamId?: string | null;
  amountRub: number;
  message?: string | null;
  isAnonymous: boolean;
  idempotencyKey?: string | null;
};

export type CreatePaymentResult =
  | { success: true; clientSecret: string; donationId: string }
  | { success: false; error: string };

export type DonationStatus = "pending" | "succeeded" | "failed" | "canceled";

export type GetStatusResult = { status: DonationStatus } | null;

export interface PaymentGateway {
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  getStatus(donationId: string): Promise<GetStatusResult>;
  handleWebhook(rawBody: string, signature: string | null): Promise<{ ok: boolean }>;
}
