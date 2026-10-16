/**
 * Mentions fixes de l'attestation.
 */

/** Ville d'émission, reprise du modèle papier de la DRH. */
export const ATTESTATION_CITY = process.env.ATTESTATION_CITY || "Douala";

/**
 * Mention portée au-dessus de la signature.
 *
 * Volontairement impersonnelle : les attestations Bridge sont signées « La
 * Direction. », sans nom ni fonction nominative. Nommer un signataire obligerait
 * à corriger le gabarit à chaque changement de direction, et ferait porter à une
 * personne un document que signe l'entreprise.
 */
export const ATTESTATION_SIGNATORY_MENTION = "La Direction.";

/** Raison sociale telle qu'elle doit apparaître dans le corps du document. */
export const COMPANY_LEGAL_NAME = "BRIDGE TECHNOLOGIES SOLUTIONS Sarl";

/** Trigramme utilisé dans la référence : N° 0007/BTS/DRH/2026. */
export const ATTESTATION_REF_PREFIX = "BTS/DRH";

/** Chemins publics du papier à en-tête (extraits du modèle Word de la DRH). */
export const LETTERHEAD_TOP = "/attestation/entete-bridge.png";
export const LETTERHEAD_BOTTOM = "/attestation/pied-bridge.png";

/** Emplacements des griffes dans le bucket privé Supabase. */
export const SIGNATURE_STORAGE_PATH = "attestation/signature";
export const STAMP_STORAGE_PATH = "attestation/cachet";
