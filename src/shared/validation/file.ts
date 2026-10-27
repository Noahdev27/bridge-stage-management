import {
  ACCEPTED_IMAGE_MIMES,
  ACCEPTED_MIME,
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
} from "@/shared/constants/domain";

/**
 * Indique si un fichier se présente comme un PDF.
 *
 * Certains navigateurs mobiles transmettent un type vide pour un vrai PDF :
 * l'extension sert alors d'indice. Le serveur vérifie de toute façon la
 * signature binaire du fichier (`%PDF-`), qui seule fait foi.
 */
export function looksLikePdf(name: string, type: string): boolean {
  return (
    type === ACCEPTED_MIME ||
    (type === "" && name.toLowerCase().endsWith(".pdf"))
  );
}

/**
 * Valide un fichier uploadé : PDF uniquement, 2 Mo maximum.
 * À utiliser côté CLIENT (avant envoi) ET côté SERVEUR (dans la Server Action).
 * @returns un message d'erreur en français, ou null si le fichier est valide.
 */
export function validatePdf(file: File): string | null {
  if (!looksLikePdf(file.name, file.type)) {
    return "Seuls les fichiers PDF sont acceptés.";
  }
  if (file.size === 0) {
    return "Ce fichier est vide.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Le fichier dépasse la taille maximale de 2 Mo.";
  }
  return null;
}

/**
 * Valide une image de griffe (signature ou cachet) : PNG / JPEG / WebP, 1 Mo max.
 * À utiliser côté CLIENT (avant envoi) ET côté SERVEUR (dans la Server Action).
 * @returns un message d'erreur en français, ou null si le fichier est valide.
 */
export function validateSignatureImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_MIMES.includes(file.type)) {
    return "Formats acceptés : PNG, JPEG ou WebP.";
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "L'image dépasse la taille maximale de 1 Mo.";
  }
  return null;
}
