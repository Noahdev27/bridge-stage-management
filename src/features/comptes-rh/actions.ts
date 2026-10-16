"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/shared/db/prisma";
import { AuthorizationError, requireManager } from "@/shared/auth/guards";
import { createRhSchema, updateRhSchema } from "./schema";

/**
 * Gestion des comptes RH depuis le back-office.
 *
 * `requireManager()` : un RH peut créer un autre RH. C'est un choix assumé —
 * l'équipe RH s'auto-administre sans dépendre d'un ADMIN pour chaque arrivée.
 * La contrepartie est qu'un compte RH compromis peut s'en fabriquer d'autres ;
 * la traçabilité repose sur `createdAt` et sur la liste, visible de tout le
 * back-office.
 *
 * Les comptes ADMIN ne sont ni créés ni supprimés ici : un RH ne doit pas
 * pouvoir s'octroyer le rôle au-dessus du sien, ni retirer celui qui l'encadre.
 */

export type RhActionState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  success?: boolean;
  rhId?: string;
};

const UNAUTHORIZED: RhActionState = { error: "Accès non autorisé." };

function toFieldErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string }[]
): RhActionState["fieldErrors"] {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0]?.toString();
    if (key && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

function revalidateRhPaths(id?: string) {
  revalidatePath("/admin/rh");
  if (id) revalidatePath(`/admin/rh/${id}`);
}

export async function createRh(
  _prev: RhActionState,
  formData: FormData
): Promise<RhActionState> {
  try {
    await requireManager();

    const parsed = createRhSchema.safeParse({
      email: (formData.get("email") ?? "").toString(),
      name: (formData.get("name") ?? "").toString(),
      password: (formData.get("password") ?? "").toString(),
    });

    if (!parsed.success) {
      return {
        error: "Données invalides.",
        fieldErrors: toFieldErrors(parsed.error.issues),
      };
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });

    if (existing) {
      return {
        error: "Un compte existe déjà avec cet email.",
        fieldErrors: { email: "Cet email est déjà utilisé." },
      };
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

    const rh = await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        password: hashedPassword,
        role: "RH",
        // Compte provisionné en interne : l'adresse est vérifiée d'office, la
        // confirmation par email ne concerne que l'auto-inscription candidat.
        emailVerifiedAt: new Date(),
      },
      select: { id: true },
    });

    revalidateRhPaths(rh.id);

    return { success: true, rhId: rh.id };
  } catch (error) {
    if (error instanceof AuthorizationError) return UNAUTHORIZED;
    console.error("[comptes-rh] Erreur création compte RH:", error);
    return { error: "Une erreur est survenue lors de la création du compte." };
  }
}

export async function updateRhName(
  id: string,
  _prev: RhActionState,
  formData: FormData
): Promise<RhActionState> {
  try {
    await requireManager();

    // `role: "RH"` dans le filtre : empêche de détourner cette action pour
    // renommer un ADMIN ou n'importe quel autre compte.
    const existing = await prisma.user.findFirst({
      where: { id, role: "RH" },
      select: { id: true },
    });

    if (!existing) {
      return { error: "Compte RH introuvable." };
    }

    const parsed = updateRhSchema.safeParse({
      name: (formData.get("name") ?? "").toString(),
    });

    if (!parsed.success) {
      return {
        error: "Données invalides.",
        fieldErrors: toFieldErrors(parsed.error.issues),
      };
    }

    await prisma.user.update({
      where: { id },
      data: { name: parsed.data.name },
    });

    revalidateRhPaths(id);

    return { success: true, rhId: id };
  } catch (error) {
    if (error instanceof AuthorizationError) return UNAUTHORIZED;
    console.error(`[comptes-rh] Erreur mise à jour compte RH ${id}:`, error);
    return { error: "Une erreur est survenue lors de la mise à jour." };
  }
}

export async function deleteRh(id: string): Promise<RhActionState> {
  try {
    const viewer = await requireManager();

    if (viewer.id === id) {
      return { error: "Vous ne pouvez pas supprimer votre propre compte." };
    }

    const existing = await prisma.user.findFirst({
      where: { id, role: "RH" },
      select: { id: true },
    });

    if (!existing) {
      return { error: "Compte RH introuvable." };
    }

    // onDelete: SetNull sur RequestEvaluation.authorId : les évaluations
    // rédigées par ce compte sont conservées, seule la signature disparaît.
    await prisma.user.delete({ where: { id } });

    revalidateRhPaths();

    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return UNAUTHORIZED;
    console.error(`[comptes-rh] Erreur suppression compte RH ${id}:`, error);
    return { error: "Une erreur est survenue lors de la suppression." };
  }
}
