"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/shared/db/prisma";
import { AuthorizationError, requireStaff } from "@/shared/auth/guards";
import { changePasswordSchema, updateProfileSchema } from "./schema";

export type ParametresActionState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  success?: boolean;
};

const UNAUTHORIZED: ParametresActionState = { error: "Accès non autorisé." };

function toFieldErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string }[]
): ParametresActionState["fieldErrors"] {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0]?.toString();
    if (key && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

export async function changePassword(
  _prev: ParametresActionState,
  formData: FormData
): Promise<ParametresActionState> {
  try {
    const viewer = await requireStaff();

    const parsed = changePasswordSchema.safeParse({
      currentPassword: (formData.get("currentPassword") ?? "").toString(),
      newPassword: (formData.get("newPassword") ?? "").toString(),
      confirmPassword: (formData.get("confirmPassword") ?? "").toString(),
    });

    if (!parsed.success) {
      return {
        error: "Données invalides.",
        fieldErrors: toFieldErrors(parsed.error.issues),
      };
    }

    const user = await prisma.user.findUnique({
      where: { email: viewer.email },
      select: { id: true, password: true },
    });

    if (!user) {
      return { error: "Compte introuvable." };
    }

    const validCurrent = await bcrypt.compare(
      parsed.data.currentPassword,
      user.password
    );

    if (!validCurrent) {
      return {
        error: "Mot de passe actuel incorrect.",
        fieldErrors: { currentPassword: "Mot de passe actuel incorrect." },
      };
    }

    const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    revalidatePath("/admin/parametres");

    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return UNAUTHORIZED;
    console.error("[parametres-actions] Erreur changement mot de passe:", error);
    return {
      error: "Une erreur est survenue lors du changement de mot de passe.",
    };
  }
}

export async function updateProfileName(
  _prev: ParametresActionState,
  formData: FormData
): Promise<ParametresActionState> {
  try {
    const viewer = await requireStaff();

    const parsed = updateProfileSchema.safeParse({
      name: (formData.get("name") ?? "").toString(),
    });

    if (!parsed.success) {
      return {
        error: "Données invalides.",
        fieldErrors: toFieldErrors(parsed.error.issues),
      };
    }

    await prisma.user.update({
      where: { email: viewer.email },
      data: { name: parsed.data.name },
    });

    revalidatePath("/admin/parametres");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return UNAUTHORIZED;
    console.error("[parametres-actions] Erreur mise à jour profil:", error);
    return { error: "Une erreur est survenue lors de la mise à jour du profil." };
  }
}
