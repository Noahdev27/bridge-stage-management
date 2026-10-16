/**
 * Format du code de suivi candidat.
 *
 * Le CDC (§ 8) exige « un token aléatoire non devinable (ex. UUID) ». L'ancien
 * format (8 caractères hexadécimaux) ne portait que 32 bits d'entropie, très
 * en dessous d'un UUID, sur une page `/suivi` publique et sans limitation de
 * débit. Le format courant fait 16 caractères tirés d'un alphabet de 32, soit
 * 80 bits.
 *
 * L'alphabet suit Crockford base32 : ni I, ni L, ni O, ni U, pour éviter les
 * confusions à la lecture (le code est recopié depuis un email ou un écran).
 * Sa taille de 32 permet un tirage uniforme depuis un octet (256 % 32 === 0).
 *
 * Ce module reste pur (aucun accès à `crypto`) afin d'être importable côté
 * client comme côté serveur ; la génération vit dans la Server Action.
 */

export const TRACKING_CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Longueur des codes émis depuis la correction d'entropie. */
export const TRACKING_CODE_LENGTH = 16;

/** Longueur des codes émis avant : les dossiers concernés restent consultables. */
export const LEGACY_TRACKING_CODE_LENGTH = 8;

/** Taille des groupes à l'affichage (`ABCD-EFGH-…`). */
const GROUP_SIZE = 4;

/** Confusions de lecture les plus fréquentes, corrigées à la saisie. */
const LOOKALIKES: Record<string, string> = { O: "0", I: "1", L: "1" };

/**
 * Ramène une saisie utilisateur à sa forme canonique : majuscules, séparateurs
 * et espaces retirés, caractères ambigus corrigés. Tout caractère hors alphabet
 * est ignoré, ce qui rend la recherche tolérante au copier-coller (`ABCD-EFGH`,
 * `abcd efgh`… donnent le même code).
 */
export function normalizeTrackingCode(raw: string): string {
  let normalized = "";
  for (const char of raw.toUpperCase()) {
    const mapped = LOOKALIKES[char] ?? char;
    if (TRACKING_CODE_ALPHABET.includes(mapped)) {
      normalized += mapped;
    }
  }
  return normalized;
}

/** Présentation lisible d'un code : groupes de 4 séparés par des tirets. */
export function formatTrackingCode(code: string): string {
  const groups = code.match(new RegExp(`.{1,${GROUP_SIZE}}`, "g"));
  return groups ? groups.join("-") : code;
}
