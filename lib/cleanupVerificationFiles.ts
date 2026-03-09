/**
 * Удаление с диска файлов верификации (паспорт, селфи) через 24 часа после рассмотрения заявки.
 * Вызывается по крону: GET /api/cron/cleanup-verification-files с заголовком Authorization: Bearer <CRON_SECRET>.
 */

import { db } from "@/lib/db";
import { deleteLocalFileIfExists, getRelativePathFromStored } from "@/lib/upload";

const REVIEWED_OLDER_THAN_MS = 24 * 60 * 60 * 1000; // 24 часа

export async function cleanupReviewedVerificationFiles(): Promise<{
  processed: number;
  deleted: number;
  errors: number;
}> {
  const olderThan = new Date(Date.now() - REVIEWED_OLDER_THAN_MS);
  const list = await db.streamerVerification.findMany({
    where: {
      status: { in: ["approved", "rejected"] },
      reviewedAt: { not: null, lt: olderThan },
      OR: [
        { passportFile: { not: "" } },
        { selfieFile: { not: "" } },
      ],
    },
    select: { id: true, userId: true, passportFile: true, selfieFile: true },
  });

  let deleted = 0;
  let errors = 0;

  for (const v of list) {
    const d1 = await deleteLocalFileIfExists(v.passportFile);
    const d2 = await deleteLocalFileIfExists(v.selfieFile);
    if (d1) deleted++;
    else if (v.passportFile && getRelativePathFromStored(v.passportFile)) errors++;
    if (d2) deleted++;
    else if (v.selfieFile && getRelativePathFromStored(v.selfieFile)) errors++;

    await db.streamerVerification.update({
      where: { id: v.id },
      data: { passportFile: "", selfieFile: "" },
    });
  }

  return { processed: list.length, deleted, errors };
}
