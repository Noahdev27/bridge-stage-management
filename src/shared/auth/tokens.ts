import "server-only";

import { createHash, randomBytes } from "crypto";

/**
 * Jetons à usage unique envoyés par email (vérification d'adresse,
 * réinitialisation de mot de passe).
 *
 * Volontairement hors d'un fichier "use server" : ces fonctions ne doivent pas
 * être exposées comme Server Actions.
 */

/** Jeton en clair, envoyé au titulaire de l'adresse et jamais stocké. */
export function createRawToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Seul le hash du jeton est conservé en base : une fuite ne permet ni de
 * valider un compte ni d'en changer le mot de passe à la place du titulaire.
 */
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
