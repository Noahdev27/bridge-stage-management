"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/db/prisma";
import { AuthorizationError, requireStaff } from "@/shared/auth/guards";
import { updateProfileSchema } from "./schema";
import { changeOwnPassword } from "./password-change";
import { recordAudit } from "@/shared/audit/audit";

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
    const { state, userId } = await changeOwnPassword(viewer.email, formData);

    if (state.success) {
      await recordAudit(viewer, {
        action: "auth.password_changed",
        summary: "Mot de passe modifié par son titulaire",
        targetType: "user",
        targetId: userId,
      });
      revalidatePath("/admin/parametres");
    }

    return state;
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

    const account = await prisma.user.update({
      where: { email: viewer.email },
      data: { name: parsed.data.name },
      select: { id: true },
    });

    await recordAudit(viewer, {
      action: "account.profile_renamed",
      summary: `Nom de profil changé en « ${parsed.data.name} »`,
      targetType: "user",
      targetId: account.id,
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
