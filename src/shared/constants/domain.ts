// Règles métier transverses (cf. cahier des charges et document MVP).

import type { InternshipType, RequestStatus } from "@prisma/client";

/** Taille maximale d'un document : 2 Mo. */
export const MAX_FILE_SIZE = 2 * 1024 * 1024;

/** Seul format de document accepté. */
export const ACCEPTED_MIME = "application/pdf";

/** Libellés FR des statuts (pour l'affichage candidat et back-office). */
export const STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: "En attente",
  PROCESS: "Traitement en cours",
  ACCEPTED: "Acceptée",
  REJECTED: "Rejetée",
};

/** Classe DaisyUI (badge) associée à chaque statut. */
export const STATUS_BADGE: Record<RequestStatus, string> = {
  PENDING: "badge-warning",
  PROCESS: "badge-info",
  ACCEPTED: "badge-success",
  REJECTED: "badge-error",
};

/** Libellés FR des types de stage. */
export const TYPE_LABELS: Record<InternshipType, string> = {
  ACADEMIC: "Académique",
  PROFESSIONAL: "Professionnel",
};

/**
 * Documents requis selon le type de stage (cf. Annexe A du document MVP).
 * Le formulaire de candidature doit adapter la liste d'uploads à ce tableau.
 */
export const REQUIRED_DOCUMENTS: Record<InternshipType, string[]> = {
  ACADEMIC: [
    "Lettre de motivation manuscrite signée",
    "CV à jour",
    "Certificat de scolarité ou lettre de recommandation de l'école",
    "Pièce d'identité",
    "Plan de localisation",
  ],
  PROFESSIONAL: [
    "Lettre de motivation manuscrite",
    "CV à jour",
    "Dernier diplôme",
    "Autres formations ou certifications",
    "Pièce d'identité",
    "Plan de localisation",
  ],
};

/** Durée minimale (en mois) selon le type de stage. */
export const MIN_DURATION_MONTHS: Record<InternshipType, number> = {
  ACADEMIC: 1,
  PROFESSIONAL: 3,
};
