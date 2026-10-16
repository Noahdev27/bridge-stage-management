import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import {
  actionsOfCategory,
  isAuditCategory,
  type AuditCategory,
} from "@/shared/audit/catalog";

export const AUDIT_PAGE_SIZE = 50;

export type AuditFilters = {
  category?: AuditCategory;
  actor?: string;
  page: number;
};

export function parseAuditFilters(
  raw: Record<string, string | undefined>
): AuditFilters {
  const page = Number(raw.page);
  return {
    category: isAuditCategory(raw.category) ? raw.category : undefined,
    actor: raw.actor?.trim() || undefined,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export async function getAuditLogs(filters: AuditFilters) {
  const where: Prisma.AuditLogWhereInput = {};
  if (filters.category) where.action = { in: actionsOfCategory(filters.category) };
  if (filters.actor) where.actorEmail = filters.actor;

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { entries, total };
}

/** Auteurs ayant au moins une entrée, pour le filtre. */
export async function getAuditActors(): Promise<string[]> {
  const rows = await prisma.auditLog.findMany({
    distinct: ["actorEmail"],
    select: { actorEmail: true },
    orderBy: { actorEmail: "asc" },
  });
  return rows.map((row) => row.actorEmail);
}

/**
 * Nom du candidat de chaque dossier cité, s'il existe encore.
 *
 * Le journal ne stocke pas ce nom (cf. `shared/audit/audit.ts`) : il est lu au
 * moment de l'affichage. Un dossier purgé n'a donc plus de nom, comme le veut
 * la purge RGPD.
 */
export async function resolveRequestNames(
  requestIds: string[]
): Promise<Map<string, string>> {
  if (requestIds.length === 0) return new Map();

  const requests = await prisma.internshipRequest.findMany({
    where: { id: { in: [...new Set(requestIds)] } },
    select: { id: true, profile: { select: { firstName: true, lastName: true } } },
  });

  return new Map(
    requests.map((r) => [r.id, `${r.profile.firstName} ${r.profile.lastName}`])
  );
}
