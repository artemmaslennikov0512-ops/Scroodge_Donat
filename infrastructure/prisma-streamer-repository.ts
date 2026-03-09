import { db } from "@/lib/db";
import type { StreamerRepository, StreamerRecord } from "./streamer-repository-port";

function toRecord(s: { id: string; slug: string; displayName: string }): StreamerRecord {
  return { id: s.id, slug: s.slug, displayName: s.displayName };
}

export const prismaStreamerRepository: StreamerRepository = {
  async getBySlug(slug: string): Promise<StreamerRecord | null> {
    const s = await db.streamer.findUnique({ where: { slug } });
    return s ? toRecord(s) : null;
  },

  async getById(id: string): Promise<StreamerRecord | null> {
    const s = await db.streamer.findUnique({ where: { id } });
    return s ? toRecord(s) : null;
  },
};
