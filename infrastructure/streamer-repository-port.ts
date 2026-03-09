/**
 * Порт репозитория стримеров.
 * Реализация — Prisma (prisma-streamer-repository.ts).
 */

export type StreamerRecord = {
  id: string;
  slug: string;
  displayName: string;
};

export interface StreamerRepository {
  getBySlug(slug: string): Promise<StreamerRecord | null>;
  getById(id: string): Promise<StreamerRecord | null>;
}
