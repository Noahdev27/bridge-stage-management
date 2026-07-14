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
