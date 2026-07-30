"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/shared/db/prisma";
import { AuthorizationError, requireManager } from "@/shared/auth/guards";
import { createTutorSchema, updateTutorSchema } from "./schema";

export type TutorActionState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  success?: boolean;
  tutorId?: string;
};

const UNAUTHORIZED: TutorActionState = { error: "Accès non autorisé." };

function toFieldErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string }[]
): TutorActionState["fieldErrors"] {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0]?.toString();
    if (key && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

function revalidateTutorPaths(id?: string) {
  revalidatePath("/admin/tuteurs");
  revalidatePath("/admin");
  if (id) revalidatePath(`/admin/tuteurs/${id}`);
}

export async function createTutor(
  _prev: TutorActionState,
  formData: FormData
): Promise<TutorActionState> {
  try {
    await requireManager();

    const parsed = createTutorSchema.safeParse({
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

    const tutor = await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        password: hashedPassword,
        role: "TUTOR",
        // Compte provisionné par la RH : l'adresse est vérifiée d'office, la
        // confirmation par email ne concerne que l'auto-inscription candidat.
        emailVerifiedAt: new Date(),
      },
      select: { id: true },
    });

    revalidateTutorPaths(tutor.id);

    return { success: true, tutorId: tutor.id };
  } catch (error) {
    if (error instanceof AuthorizationError) return UNAUTHORIZED;
    console.error("[tuteurs-actions] Erreur création tuteur:", error);
    return { error: "Une erreur est survenue lors de la création du tuteur." };
  }
}

export async function updateTutorName(
  id: string,
  _prev: TutorActionState,
  formData: FormData
): Promise<TutorActionState> {
  try {
    await requireManager();

    const existing = await prisma.user.findFirst({
      where: { id, role: "TUTOR" },
      select: { id: true },
    });

    if (!existing) {
      return { error: "Tuteur introuvable." };
    }

    const parsed = updateTutorSchema.safeParse({
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

    revalidateTutorPaths(id);

    return { success: true, tutorId: id };
  } catch (error) {
    if (error instanceof AuthorizationError) return UNAUTHORIZED;
    console.error(`[tuteurs-actions] Erreur mise à jour tuteur ${id}:`, error);
    return { error: "Une erreur est survenue lors de la mise à jour du tuteur." };
  }
}

export async function deleteTutor(id: string): Promise<TutorActionState> {
  try {
    const viewer = await requireManager();

    if (viewer.id === id) {
      return { error: "Vous ne pouvez pas supprimer votre propre compte." };
    }

    const existing = await prisma.user.findFirst({
      where: { id, role: "TUTOR" },
      select: { id: true },
    });

    if (!existing) {
      return { error: "Tuteur introuvable." };
    }

    // onDelete: SetNull sur InternshipRequest.tutorId et
    // RequestEvaluation.authorId : les dossiers et évaluations liés sont
    // conservés, seule la référence au tuteur est effacée.
    await prisma.user.delete({ where: { id } });

    revalidateTutorPaths();

    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return UNAUTHORIZED;
    console.error(`[tuteurs-actions] Erreur suppression tuteur ${id}:`, error);
    return { error: "Une erreur est survenue lors de la suppression du tuteur." };
  }
}
