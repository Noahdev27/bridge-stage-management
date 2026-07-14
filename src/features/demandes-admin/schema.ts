import { z } from "zod";
import { InternshipType, RequestStatus } from "@prisma/client";

export const candidatureListFiltersSchema = z
  .object({
    status: z.nativeEnum(RequestStatus).optional(),
    type: z.nativeEnum(InternshipType).optional(),
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    tutorId: z.string().min(1).optional(),
    reportRequired: z.enum(["true", "false"]).optional(),
  })
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: "La date de début doit être antérieure ou égale à la date de fin.",
    path: ["to"],
  });

export type CandidatureListFilters = z.infer<typeof candidatureListFiltersSchema>;

export function parseCandidatureListFilters(
  raw: Record<string, string | undefined>
): CandidatureListFilters {
  const parsed = candidatureListFiltersSchema.safeParse({
    status:
      raw.status && raw.status in RequestStatus ? raw.status : undefined,
    type: raw.type && raw.type in InternshipType ? raw.type : undefined,
    from: raw.from || undefined,
    to: raw.to || undefined,
    tutorId: raw.tutorId || undefined,
    reportRequired:
      raw.reportRequired === "true" || raw.reportRequired === "false"
        ? raw.reportRequired
        : undefined,
  });

  if (!parsed.success) {
    const fallback: CandidatureListFilters = {};
    if (raw.status && raw.status in RequestStatus) {
      fallback.status = raw.status as RequestStatus;
    }
    if (raw.type && raw.type in InternshipType) {
      fallback.type = raw.type as InternshipType;
    }
    return fallback;
  }

  return parsed.data;
}

export const requestEvaluationSchema = z.object({
  rating: z.coerce
    .number()
    .int("La note doit être un nombre entier.")
    .min(1, "Attribuez une note entre 1 et 5.")
    .max(5, "Attribuez une note entre 1 et 5."),
  comment: z
    .string()
    .max(2000, "Le commentaire ne doit pas dépasser 2000 caractères.")
    .optional(),
});

export type RequestEvaluationInput = z.infer<typeof requestEvaluationSchema>;

export const assignTutorSchema = z.object({
  tutorId: z.string().min(1).nullable(),
});
