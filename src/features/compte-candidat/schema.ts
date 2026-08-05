import { z } from "zod";

/**
 * L'email sert d'identifiant de connexion ET de clé de rattachement des
 * dossiers : il est normalisé (trim + minuscules) pour qu'une différence de
 * casse ne crée pas deux comptes distincts, et pour que la recherche du compte
 * à la connexion tombe toujours sur la même ligne.
 */
const emailSchema = z
  .string()
  .min(1, "L'email est requis.")
  .email("Email invalide.")
  .max(255)
  .transform((value) => value.trim().toLowerCase());

export const candidateRegisterSchema = z
  .object({
    firstName: z.string().min(1, "Le prénom est requis.").max(100),
    lastName: z.string().min(1, "Le nom est requis.").max(100),
    email: emailSchema,
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
      .max(128, "Le mot de passe ne doit pas dépasser 128 caractères."),
    confirmPassword: z.string().min(1, "Confirmez le mot de passe."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export const candidateLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mot de passe requis."),
});

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

/**
 * Le jeton transite par un champ caché du formulaire : il est validé côté
 * serveur avant toute écriture, comme s'il venait de l'URL.
 */
export const passwordResetSchema = z
  .object({
    token: z.string().min(1, "Lien de réinitialisation invalide."),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
      .max(128, "Le mot de passe ne doit pas dépasser 128 caractères."),
    confirmPassword: z.string().min(1, "Confirmez le mot de passe."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });
