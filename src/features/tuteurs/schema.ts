import { z } from "zod";

const emailSchema = z
  .string()
  .min(1, "L'email est requis.")
  .email("Veuillez entrer une adresse email valide.")
  .max(255)
  .transform((value) => value.trim().toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
  .max(128, "Le mot de passe ne doit pas dépasser 128 caractères.");

const nameSchema = z
  .string()
  .min(1, "Le nom est requis.")
  .max(100, "Le nom ne doit pas dépasser 100 caractères.")
  .transform((value) => value.trim());

export const createTutorSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
});

export type CreateTutorInput = z.infer<typeof createTutorSchema>;

export const updateTutorSchema = z.object({
  name: nameSchema,
});

export type UpdateTutorInput = z.infer<typeof updateTutorSchema>;
