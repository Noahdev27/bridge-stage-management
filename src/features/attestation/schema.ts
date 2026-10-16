import { z } from "zod";

/**
 * VALIDATION — Délivrance de l'attestation de stage.
 *
 * L'attestation est un document officiel : la période qu'elle porte doit être
 * celle réellement effectuée. `startDate` / `duration` de la demande sont ce que
 * le candidat a *souhaité*, donc la RH confirme les deux bornes ici.
 */

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00`)), "Date invalide.");

export const attestationIssueSchema = z
  .object({
    startDate: dateOnly,
    endDate: dateOnly,
  })
  .refine((data) => data.startDate < data.endDate, {
    message: "La date de fin doit être postérieure à la date de début.",
    path: ["endDate"],
  })
  .refine(
    (data) => Date.parse(`${data.endDate}T00:00:00`) <= Date.now(),
    {
      message:
        "La date de fin ne peut pas être dans le futur : le stage doit être terminé pour être attesté.",
      path: ["endDate"],
    }
  );

export type AttestationIssueInput = z.infer<typeof attestationIssueSchema>;

/** Convertit une saisie `yyyy-mm-dd` en Date UTC, sans dérive de fuseau. */
export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Formate une Date en `yyyy-mm-dd` pour un `<input type="date">`. */
export function toDateInputValue(value: Date): string {
  return value.toISOString().slice(0, 10);
}
