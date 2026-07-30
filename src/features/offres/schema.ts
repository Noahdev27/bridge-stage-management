import { z } from "zod";
import { Department, InternshipType } from "@prisma/client";

export const offerFormSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre est requis.")
    .max(150, "Le titre ne doit pas dépasser 150 caractères."),
  description: z
    .string()
    .min(1, "La description est requise.")
    .max(4000, "La description ne doit pas dépasser 4000 caractères."),
  department: z.nativeEnum(Department, {
    message: "Sélectionnez un département valide.",
  }),
  type: z.nativeEnum(InternshipType, {
    message: "Sélectionnez un type de stage valide.",
  }),
  durationMonths: z.coerce
    .number()
    .int("La durée doit être un nombre entier de mois.")
    .min(1, "La durée doit être d'au moins 1 mois.")
    .max(24, "La durée ne peut pas dépasser 24 mois."),
  isPublished: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .transform((value) => value === true || value === "true"),
});

export type OfferFormInput = z.infer<typeof offerFormSchema>;
