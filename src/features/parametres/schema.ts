import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
  .max(128, "Le mot de passe ne doit pas dépasser 128 caractères.");

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Le mot de passe actuel est requis."),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "La confirmation est requise."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les deux mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Le nouveau mot de passe doit être différent de l'actuel.",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis.")
    .max(100, "Le nom ne doit pas dépasser 100 caractères.")
    .transform((value) => value.trim()),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
