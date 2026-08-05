/**
 * Passage du code de suivi entre `/candidature` et `/candidature/confirmation`.
 *
 * Le code de suivi vaut 80 bits d'entropie et donne accès au dossier via
 * `/suivi` : le faire transiter par la query string l'inscrirait dans
 * l'historique du navigateur, les logs serveur et l'en-tête Referer. On passe
 * donc par `sessionStorage`, cantonné à l'onglet et à l'origine, et effacé à sa
 * fermeture.
 *
 * L'entrée n'est volontairement pas supprimée à la lecture : rafraîchir la page
 * de confirmation doit continuer d'afficher le code.
 */

export const CONFIRMATION_STORAGE_KEY = "bridge:candidature-confirmation";

export type ConfirmationHandoff = {
  trackingCode: string;
  email?: string;
};

/** `false` si le stockage est indisponible (navigation privée, quota). */
export function writeConfirmationHandoff(payload: ConfirmationHandoff): boolean {
  try {
    sessionStorage.setItem(CONFIRMATION_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/**
 * Renvoie la chaîne brute stockée. La lecture est séparée de l'analyse pour que
 * `useSyncExternalStore` reçoive un instantané stable : renvoyer un objet
 * fraîchement construit à chaque appel ferait boucler React.
 */
export function readConfirmationHandoffRaw(): string | null {
  try {
    return sessionStorage.getItem(CONFIRMATION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function parseConfirmationHandoff(raw: string): ConfirmationHandoff | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as ConfirmationHandoff).trackingCode !== "string" ||
      !(parsed as ConfirmationHandoff).trackingCode
    ) {
      return null;
    }

    const { trackingCode, email } = parsed as ConfirmationHandoff;
    return {
      trackingCode,
      email: typeof email === "string" ? email : undefined,
    };
  } catch {
    return null;
  }
}
