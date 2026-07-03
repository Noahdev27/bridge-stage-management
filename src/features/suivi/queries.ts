import { prisma } from "../../shared/db/prisma"; // Alignement sur ton instance Prisma réelle

/**
 * Récupère une demande de stage unique et ses informations clés via son code de suivi.
 * @param trackingCode Le code unique à 8 caractères fourni au candidat.
 */
export async function getCandidatureByTrackingCode(trackingCode: string) {
  try {
    // On force la recherche en majuscules pour correspondre au format stocké
    const cleanCode = trackingCode.trim().toUpperCase();

    const candidature = await prisma.internshipRequest.findUnique({
      where: {
        trackingCode: cleanCode,
      },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            school: true,
          },
        },
      },
    });

    return candidature;
  } catch (error) {
    console.error(`[suivi-queries] Erreur lors de la recherche du code ${trackingCode}:`, error);
    return null;
  }
}