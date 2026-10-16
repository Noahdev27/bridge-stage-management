import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import type { AuditAction } from "./catalog";

/**
 * Enregistrement des événements du journal d'audit.
 *
 * Règle de contenu : ne jamais écrire de donnée personnelle de candidat (nom,
 * email, téléphone). Le journal n'est pas purgé avec les dossiers rejetés : y
 * recopier ces données contournerait la purge RGPD. Un dossier se désigne par
 * `targetType: "request"` et son identifiant ; la page du journal retrouve le
 * nom tant que le dossier existe.
 */

export type AuditActor = {
  email: string;
  role?: string | null;
};

/** Auteur des traitements automatiques (cron de purge). */
export const SYSTEM_ACTOR: AuditActor = { email: "système", role: null };

export type AuditEntry = {
  action: AuditAction;
  summary: string;
  targetType?: "request" | "user" | "offer" | "attestation";
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

/**
 * Ajoute une entrée au journal.
 *
 * Ne lève jamais : l'action métier a déjà eu lieu quand on l'enregistre, et un
 * incident sur le journal ne doit ni l'annuler ni faire croire à l'utilisateur
 * qu'elle a échoué. L'échec est consigné dans les logs serveur.
 */
export async function recordAudit(
  actor: AuditActor,
  entry: AuditEntry
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorEmail: actor.email,
        actorRole: actor.role ?? null,
        action: entry.action,
        summary: entry.summary,
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        metadata: entry.metadata,
      },
    });
  } catch (error) {
    console.error(`[audit] Échec d'enregistrement de ${entry.action}:`, error);
  }
}
