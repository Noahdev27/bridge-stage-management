/**
 * Mise en forme CSV de l'export des candidatures, pour Excel en français.
 *
 * — Séparateur « ; » : c'est celui qu'attend Excel configuré en français, qui
 *   afficherait sinon chaque ligne dans une seule colonne.
 * — BOM UTF-8 en tête : sans lui, Excel lit le fichier en Windows-1252 et
 *   les accents deviennent illisibles.
 * — Neutralisation des formules : une cellule saisie par un candidat qui
 *   commence par =, +, -, @ serait exécutée comme formule à l'ouverture du
 *   fichier (injection CSV). Elle est précédée d'une apostrophe.
 */

export const CSV_SEPARATOR = ";";
const BOM = "﻿";

export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [header, ...rows].map((row) => row.map(csvCell).join(CSV_SEPARATOR));
  // CRLF : fin de ligne attendue par la norme CSV et par Excel.
  return BOM + lines.join("\r\n") + "\r\n";
}
