import "server-only";

import { prisma } from "@/shared/db/prisma";
import { REJECTED_PURGE_MONTHS } from "@/shared/constants/domain";
import {
  deleteRequestDocumentsFolder,
  deleteStoragePaths,
  extractStoragePathFromUrl,
} from "@/shared/storage/supabase";

/**
 * Purge RGPD des dossiers rejetés.
 *
 * Volontairement hors d'un fichier "use server" : cette fonction supprime des
 * données de façon irréversible et ne doit jamais être exposée comme Server
 * Action publique. Les appelants (action RH, route cron) contrôlent l'accès.
 */

export type PurgeResult = {
  purgedCount: number;
};

/** Date limite : tout dossier rejeté avant ce seuil est purgeable. */
export function getPurgeCutoff(months: number = REJECTED_PURGE_MONTHS): Date {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return cutoff;
}

export async function runRejectedPurge(): Promise<PurgeResult> {
  const cutoff = getPurgeCutoff();

  const outdated = await prisma.internshipRequest.findMany({
    where: {
      status: "REJECTED",
      updatedAt: { lte: cutoff },
    },
    include: {
      documents: true,
      profile: { select: { id: true } },
    },
  });

  if (outdated.length === 0) {
    return { purgedCount: 0 };
  }

  for (const request of outdated) {
    const storagePaths = request.documents
      .map((doc) => doc.storagePath ?? extractStoragePathFromUrl(doc.url))
      .filter((path): path is string => !!path);

    await deleteStoragePaths(storagePaths);
    await deleteRequestDocumentsFolder(request.id, request.createdAt);

    // La suppression du profil cascade sur la demande et ses documents.
    await prisma.profile.delete({ where: { id: request.profile.id } });
  }

  return { purgedCount: outdated.length };
}
