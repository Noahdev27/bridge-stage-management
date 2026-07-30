import { z } from "zod";
import {
  LEGACY_TRACKING_CODE_LENGTH,
  TRACKING_CODE_LENGTH,
  normalizeTrackingCode,
} from "@/shared/tracking/tracking-code";

/**
 * Schéma de validation pour la saisie du code de suivi candidat.
 *
 * La saisie est d'abord ramenée à sa forme canonique (majuscules, séparateurs
 * retirés, caractères ambigus corrigés), ce qui rend le champ tolérant au
 * copier-coller du code formaté envoyé par email (`ABCD-EFGH-JKMN-PQRS`).
 *
 * La longueur acceptée couvre l'ancien format (8 caractères) et le format
 * courant (16) : les dossiers déposés avant le renforcement de l'entropie
 * doivent rester consultables par leurs candidats.
 */
export const trackingCodeSchema = z.object({
  trackingCode: z
    .string()
    .transform(normalizeTrackingCode)
    .refine((code) => code.length > 0, "Le code de suivi est obligatoire.")
    .refine(
      (code) =>
        code.length === TRACKING_CODE_LENGTH ||
        code.length === LEGACY_TRACKING_CODE_LENGTH,
      `Le code de suivi doit comporter ${TRACKING_CODE_LENGTH} caractères (ou ${LEGACY_TRACKING_CODE_LENGTH} pour les dossiers les plus anciens).`
    ),
});

export type TrackingCodeInput = z.infer<typeof trackingCodeSchema>;
