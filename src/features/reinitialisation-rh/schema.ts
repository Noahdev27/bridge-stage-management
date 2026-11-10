import { z } from "zod";

/**
 * Même normalisation qu'à la connexion : trim + minuscules, appliqués AVANT
 * le contrôle de format pour qu'une espace collée avec l'adresse ne la fasse
 * pas refuser.
 */
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "L'email est requis.")
  .email("Email invalide.")
  .max(255);

export const staffResetRequestSchema = z.object({
  email: emailSchema,
});

export const staffResetConfirmSchema = z
  .object({
    email: emailSchema,
    // Les espaces sont tolérés : un code copié depuis l'email en contient
    // parfois (« 123 456 »).
    code: z
      .string()
      .transform((value) => value.replace(/\s/g, ""))
      .pipe(z.string().regex(/^\d{6}$/, "Le code comporte 6 chiffres.")),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
      .max(128, "Le mot de passe ne doit pas dépasser 128 caractères."),
    confirmPassword: z.string().min(1, "Confirmez le mot de passe."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les deux mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });
