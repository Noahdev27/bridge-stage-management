import { prisma } from "@/shared/db/prisma";
import type { Department } from "@prisma/client";

export async function getPublishedOffers(department?: Department) {
  try {
    return await prisma.internshipOffer.findMany({
      where: {
        isPublished: true,
        ...(department ? { department } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("[offers] Erreur lecture offres:", error);
    return [];
  }
}

export async function getOfferById(id: string) {
  try {
    return await prisma.internshipOffer.findFirst({
      where: { id, isPublished: true },
    });
  } catch (error) {
    console.error(`[offers] Erreur offre ${id}:`, error);
    return null;
  }
}

/** Toutes les offres (publiées ou non) pour l'espace RH. */
export async function getAllOffers() {
  try {
    return await prisma.internshipOffer.findMany({
      orderBy: [{ isPublished: "desc" }, { createdAt: "desc" }],
      include: { _count: { select: { requests: true } } },
    });
  } catch (error) {
    console.error("[offers] Erreur lecture offres (admin):", error);
    return [];
  }
}

/** Offre unique par id, sans filtrage publication (admin uniquement). */
export async function getOfferByIdAdmin(id: string) {
  try {
    return await prisma.internshipOffer.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error(`[offers] Erreur offre admin ${id}:`, error);
    return null;
  }
}
