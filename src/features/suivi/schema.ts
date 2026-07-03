import { z } from "zod";

/**
 * Schéma de validation pour la saisie du code de suivi candidat.
 * - Supprime les espaces superflus (trim)
 * - Force le passage en majuscules (toUpperCase)
 * - Vérifie que la longueur est exactement de 8 caractères
 * - S'assure que le format est purement alphanumérique
 */
export const trackingCodeSchema = z.object({
  trackingCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Le code de suivi est obligatoire.")
    .length(8, "Le code de suivi doit comporter exactement 8 caractères.")
    .regex(/^[A-Z0-9]+$/, "Le code de suivi ne doit contenir que des lettres et des chiffres."),
});

export type TrackingCodeInput = z.infer<typeof trackingCodeSchema>;