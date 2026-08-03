import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { InternshipType } from "@prisma/client";
import { MIN_DURATION_MONTHS } from "@/shared/constants/domain";

/**
 * VALIDATION — Schémas Zod pour chaque étape du formulaire de candidature.
 * Réutilisés côté client (validation avant envoi) ET côté serveur (dans l'action).
 */

function isValidInternationalPhone(value: string) {
  const phoneNumber = parsePhoneNumberFromString(value);
  return phoneNumber?.isValid() ?? false;
}

/**
 * Chaîne obligatoire.
 *
 * Le message métier est aussi attaché au contrôle de *type*, pas seulement à
 * `.min(1)`. Sans cela, un champ jamais saisi vaut `undefined` côté client
 * (l'état du formulaire part de `{}`) et `null` côté serveur (`FormData.get`
 * d'une clé absente) : le contrôle de type échoue avant `.min(1)` et Zod
 * affiche son message anglais par défaut au candidat.
 */
function requiredText(message: string, max: number, maxMessage: string) {
  return z
    .string({ error: message })
    .min(1, message)
    .max(max, maxMessage);
}

const internationalPhoneSchema = z
  .string({ error: "Le numéro de téléphone est requis." })
  .min(1, "Le numéro de téléphone est requis.")
  .refine((value) => value.trim().startsWith("+"), {
    message: "Le numéro doit commencer par l'indicatif international, ex. +237.",
  })
  .refine((value) => isValidInternationalPhone(value), {
    message:
      "Le numéro doit être un numéro international valide avec un indicatif pays.",
  });

function gpsCoordinateSchema(min: number, max: number, label: string) {
  return z
    .union([z.string(), z.number()], { error: `La ${label} est requise.` })
    .refine(
      (value) => value !== "" && value !== null && value !== undefined,
      { message: `La ${label} est requise.` }
    )
    .transform((value) =>
      typeof value === "string" ? Number(value.replace(",", ".")) : value
    )
    .pipe(
      z
        .number()
        .refine((value) => !Number.isNaN(value), "Coordonnée invalide.")
        .refine(
          (value) => value >= min && value <= max,
          `La ${label} doit être comprise entre ${min} et ${max}.`
        )
    );
}

// ===== ÉTAPE 1 : Informations personnelles =====
export const step1InfosSchema = z.object({
  firstName: requiredText(
    "Le prénom est requis.",
    100,
    "Le prénom ne doit pas dépasser 100 caractères."
  ),
  lastName: requiredText(
    "Le nom est requis.",
    100,
    "Le nom ne doit pas dépasser 100 caractères."
  ),
  email: z
    .string({ error: "L'email est requis." })
    .min(1, "L'email est requis.")
    .email("Veuillez entrer une adresse email valide.")
    .max(255, "L'email ne doit pas dépasser 255 caractères."),
  // Téléphone du candidat
  phone: internationalPhoneSchema,
  lieudit: requiredText(
    "Le lieu-dit (domicile) est requis.",
    255,
    "Le lieu-dit ne doit pas dépasser 255 caractères."
  ),
  latitude: gpsCoordinateSchema(-90, 90, "latitude"),
  longitude: gpsCoordinateSchema(-180, 180, "longitude"),
  // Téléphones de deux proches du candidat
  relativePhone1: internationalPhoneSchema,
  relativePhone2: internationalPhoneSchema,
});

export type Step1InfosInput = z.infer<typeof step1InfosSchema>;

// ===== ÉTAPE 2 : Parcours académique et paramètres du stage =====
export const step2ParcoursSchema = z.object({
  school: requiredText(
    "L'école/université est requise.",
    255,
    "Le nom de l'établissement ne doit pas dépasser 255 caractères."
  ),
  field: requiredText(
    "La filière est requise.",
    255,
    "La filière ne doit pas dépasser 255 caractères."
  ),
  level: requiredText(
    "Le niveau d'étude est requis.",
    100,
    "Le niveau d'étude ne doit pas dépasser 100 caractères."
  ),
  internshipType: z.nativeEnum(InternshipType, {
    message: "Sélectionnez un type de stage valide.",
  }),
  duration: z
    .string({ error: "La durée est requise." })
    .min(1, "La durée est requise.")
    .regex(/^\d+$/, "La durée doit être un nombre de mois."),
  startDate: z
    .string({ error: "La date de début souhaitée est requise." })
    .min(1, "La date de début souhaitée est requise.")
    .refine(
      (date) => {
        const d = new Date(date);
        return !isNaN(d.getTime());
      },
      "Date invalide."
    )
    .refine(
      (date) => new Date(date) > new Date(),
      "La date de début doit être dans le futur."
    ),
  reportRequired: z.boolean().default(false),
  offerId: z.string().min(1).optional(),
}).superRefine((data, ctx) => {
  const duration = Number(data.duration);
  const minDuration = MIN_DURATION_MONTHS[data.internshipType];

  if (!Number.isInteger(duration) || duration <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["duration"],
      message: "La durée doit être un nombre entier de mois.",
    });
    return;
  }

  if (duration < minDuration) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["duration"],
      message: `La durée doit être d'au moins ${minDuration} mois pour un stage ${
        data.internshipType === "PROFESSIONAL" ? "professionnel" : "académique"
      }.`,
    });
  }
});

export type Step2ParcoursInput = z.infer<typeof step2ParcoursSchema>;

// ===== ÉTAPE 3 : Upload de documents =====
// Note : les fichiers seront validés dans le composant + dans l'action
export const step3DocumentsSchema = z.record(
  z.string(),
  z.instanceof(File).optional()
);

export type Step3DocumentsInput = z.infer<typeof step3DocumentsSchema>;

// ===== ÉTAPE 4 : Récapitulatif (pas de validation supplémentaire) =====
// Les données des étapes précédentes sont déjà validées

// ===== SCHÉMA GLOBAL : complet de la candidature =====
export const completeApplicationSchema = step1InfosSchema.merge(step2ParcoursSchema);

export type CompleteApplicationInput = z.infer<typeof completeApplicationSchema>;
