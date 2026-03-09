/**
 * Сборка зависимостей: репозитории и платёжный шлюз (заглушка).
 * Редирект на страницу ввода карты платежки настраивается позже.
 */

import { prismaDonationRepository } from "@/infrastructure/prisma-donation-repository";
import { prismaStreamerRepository } from "@/infrastructure/prisma-streamer-repository";
import { createStubPaymentGateway } from "@/infrastructure/stub-payment-gateway";
import { createCreateDonationUseCase } from "@/application/create-donation";

const donationRepo = prismaDonationRepository;
const streamerRepo = prismaStreamerRepository;
const paymentGateway = createStubPaymentGateway(donationRepo);

export const createDonation = createCreateDonationUseCase(donationRepo, paymentGateway);
export const getStreamerBySlug = (slug: string) => streamerRepo.getBySlug(slug);
