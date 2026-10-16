import { prisma } from "@/shared/db/prisma";

/**
 * Comptes gestionnaires du back-office.
 *
 * Les comptes ADMIN sont listés à côté des RH : ils partagent exactement les
 * mêmes droits d'écriture (`MANAGER_ROLES`), et masquer qui les détient
 * donnerait une vue trompeuse de qui peut agir sur les dossiers. Seuls les
 * comptes RH sont modifiables ici — voir `actions.ts`.
 */
export async function getAllManagers() {
  try {
    return await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "RH"] } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { evaluations: true } },
      },
      // ADMIN d'abord : la hiérarchie des droits se lit dans l'ordre.
      orderBy: [{ role: "asc" }, { name: "asc" }, { email: "asc" }],
    });
  } catch (error) {
    console.error("[comptes-rh] Erreur lecture comptes gestionnaires:", error);
    return [];
  }
}

export async function getRhById(id: string) {
  try {
    return await prisma.user.findFirst({
      where: { id, role: "RH" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { evaluations: true } },
      },
    });
  } catch (error) {
    console.error(`[comptes-rh] Erreur lecture compte RH ${id}:`, error);
    return null;
  }
}
