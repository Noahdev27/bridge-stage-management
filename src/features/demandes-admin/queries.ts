import { prisma } from "@/shared/db/prisma";
import { RequestStatus, type Prisma } from "@prisma/client";

/**
 * Récupère toutes les candidatures filtrées par statut pour la table principale.
 */
export async function getCandidatures(statusFilter?: string) {
  try {
    const isValidStatus =
      !!statusFilter &&
      statusFilter !== "ALL" &&
      statusFilter in RequestStatus;

    const whereClause: Prisma.InternshipRequestWhereInput = isValidStatus
      ? { status: statusFilter as RequestStatus }
      : {};

    const candidatures = await prisma.internshipRequest.findMany({
      where: whereClause,
      include: {
        profile: true, 
      },
      orderBy: {
        createdAt: "desc", 
      },
    });

    return candidatures.map((req) => ({
      id: req.id,
      firstName: req.profile.firstName,
      lastName: req.profile.lastName,
      email: req.profile.email,
      internshipType: req.type,
      createdAt: req.createdAt,
      status: req.status,
    }));
  } catch (error) {
    console.error("[queries] Erreur lors de la récupération des candidatures:", error);
    return [];
  }
}

/**
 * Récupère le dossier complet d'un candidat unique grâce à son ID (Profil + Demande + Documents).
 */
export async function getCandidatureById(id: string) {
  try {
    const candidature = await prisma.internshipRequest.findUnique({
      where: { id },
      include: {
        profile: true,    // Récupère les infos personnelles (école, filière, téléphone, etc.)
        documents: true,  // Récupère la liste des pièces jointes (CV, LM, etc.) via la relation
      },
    });

    return candidature;
  } catch (error) {
    console.error(`[queries] Erreur lors de la récupération de la candidature ${id}:`, error);
    return null;
  }
}