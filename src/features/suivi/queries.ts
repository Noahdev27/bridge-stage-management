import { prisma } from "../../shared/db/prisma"; // Alignement sur ton instance Prisma réelle
import { normalizeTrackingCode } from "@/shared/tracking/tracking-code";

/**
 * Récupère une demande de stage unique et ses informations clés via son code de suivi.
 * @param trackingCode Le code fourni au candidat, sous une forme quelconque.
 */
export async function getCandidatureByTrackingCode(trackingCode: string) {
  try {
    // Forme canonique : le code est stocké sans séparateur ni minuscule.
    const cleanCode = normalizeTrackingCode(trackingCode);

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