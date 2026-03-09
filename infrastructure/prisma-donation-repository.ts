import { db } from "@/lib/db";
import type { DonationRepository, DonationRecord, CreateDonationInput } from "./donation-repository-port";

const STATUSES = ["pending", "succeeded", "failed", "canceled"] as const;

function toRecord(d: {
  id: string;
  streamerId: string;
  streamId: string | null;
  goalId: string | null;
  amountRub: number;
  message: string | null;
  isAnonymous: boolean;
  status: string;
  stripePaymentIntentId: string | null;
  createdAt: Date;
}): DonationRecord {
  return {
    id: d.id,
    streamerId: d.streamerId,
    streamId: d.streamId,
    goalId: d.goalId,
    amountRub: d.amountRub,
    message: d.message,
    isAnonymous: d.isAnonymous,
    status: STATUSES.includes(d.status as (typeof STATUSES)[number]) ? (d.status as DonationRecord["status"]) : "pending",
    stripePaymentIntentId: d.stripePaymentIntentId,
    createdAt: d.createdAt,
  };
}

export const prismaDonationRepository: DonationRepository = {
  async create(input: CreateDonationInput): Promise<DonationRecord> {
    const d = await db.donation.create({
      data: {
        streamerId: input.streamerId,
        streamId: input.streamId ?? null,
        goalId: input.goalId ?? null,
        amountRub: input.amountRub,
        message: input.message ?? null,
        isAnonymous: input.isAnonymous,
        status: "pending",
      },
    });
    return toRecord(d);
  },

  async getById(id: string): Promise<DonationRecord | null> {
    const d = await db.donation.findUnique({ where: { id } });
    return d ? toRecord(d) : null;
  },

  async updateStatus(
    id: string,
    status: DonationRecord["status"],
    stripePaymentIntentId?: string | null
  ): Promise<void> {
    await db.donation.update({
      where: { id },
      data: {
        status,
        ...(stripePaymentIntentId != null && { stripePaymentIntentId }),
      },
    });
  },
};
