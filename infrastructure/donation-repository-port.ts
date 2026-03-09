/**
 * Порт репозитория донатов.
 * Реализация — Prisma (prisma-donation-repository.ts).
 */

export type DonationRecord = {
  id: string;
  streamerId: string;
  streamId: string | null;
  goalId: string | null;
  amountRub: number;
  message: string | null;
  isAnonymous: boolean;
  status: "pending" | "succeeded" | "failed" | "canceled";
  stripePaymentIntentId: string | null;
  createdAt: Date;
};

export type CreateDonationInput = {
  streamerId: string;
  streamId?: string | null;
  amountRub: number;
  message?: string | null;
  isAnonymous: boolean;
  goalId?: string | null;
};

export interface DonationRepository {
  create(input: CreateDonationInput): Promise<DonationRecord>;
  getById(id: string): Promise<DonationRecord | null>;
  updateStatus(id: string, status: DonationRecord["status"], stripePaymentIntentId?: string | null): Promise<void>;
}
