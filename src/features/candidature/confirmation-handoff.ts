/**
 * Passage entre `/candidature` et `/candidature/confirmation`.
 *
 * Le code de suivi ne transite plus par le navigateur : il n'est communiqué que
 * par l'email de confirmation. Cette charge utile ne sert donc plus qu'à deux
 * choses — attester qu'un envoi vient d'avoir lieu (sans quoi la page de
 * confirmation renvoie au formulaire), et rappeler l'adresse destinataire.
 *
 * `sessionStorage` plutôt que la query string : l'adresse email n'a pas à
 * s'inscrire dans l'historique du navigateur, les logs serveur ni l'en-tête
 * Referer. Le stockage est cantonné à l'onglet et effacé à sa fermeture.
 *
 * L'entrée n'est volontairement pas supprimée à la lecture : rafraîchir la page
 * de confirmation doit continuer d'afficher le message.
 */

export const CONFIRMATION_STORAGE_KEY = "bridge:candidature-confirmation";

export type ConfirmationHandoff = {
  /** Marqueur explicite : une charge utile vide resterait un objet valide. */
  submitted: true;
  /** Adresse à laquelle le code de suivi a été envoyé. */
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
      (parsed as ConfirmationHandoff).submitted !== true
    ) {
      return null;
    }

    const { email } = parsed as ConfirmationHandoff;
    return {
      submitted: true,
      email: typeof email === "string" ? email : undefined,
    };
  } catch {
    return null;
  }
}
