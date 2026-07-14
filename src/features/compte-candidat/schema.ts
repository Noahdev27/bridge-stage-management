import { z } from "zod";

export const candidateRegisterSchema = z
  .object({
    firstName: z.string().min(1, "Le prénom est requis.").max(100),
    lastName: z.string().min(1, "Le nom est requis.").max(100),
    email: z.string().email("Email invalide."),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    confirmPassword: z.string().min(1, "Confirmez le mot de passe."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export const candidateLoginSchema = z.object({
  email: z.string().email("Email invalide."),
  password: z.string().min(1, "Mot de passe requis."),
});
