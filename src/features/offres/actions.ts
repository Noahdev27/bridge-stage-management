"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/db/prisma";
import { AuthorizationError, requireManager } from "@/shared/auth/guards";
import { offerFormSchema } from "./schema";

export type OfferActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof ReturnType<typeof extractFormValues>, string>>;
  success?: boolean;
  offerId?: string;
};

const UNAUTHORIZED: OfferActionState = { error: "Accès non autorisé." };

function extractFormValues(formData: FormData) {
  return {
    title: (formData.get("title") ?? "").toString().trim(),
    description: (formData.get("description") ?? "").toString().trim(),
    department: (formData.get("department") ?? "").toString(),
    type: (formData.get("type") ?? "").toString(),
    durationMonths: (formData.get("durationMonths") ?? "").toString(),
    isPublished: formData.get("isPublished") === "on" ? "true" : "false",
  };
}

function toFieldErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string }[]
): OfferActionState["fieldErrors"] {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0]?.toString();
    if (key && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

function revalidateOfferPaths(offerId?: string) {
  revalidatePath("/admin/offres");
  revalidatePath("/offres");
  if (offerId) {
    revalidatePath(`/admin/offres/${offerId}`);
  }
}

export async function createOffer(
  _prev: OfferActionState,
  formData: FormData
): Promise<OfferActionState> {
  try {
    await requireManager();

    const values = extractFormValues(formData);
    const parsed = offerFormSchema.safeParse(values);

    if (!parsed.success) {
      return {
        error: "Données invalides.",
        fieldErrors: toFieldErrors(parsed.error.issues),
      };
    }

    const offer = await prisma.internshipOffer.create({
      data: parsed.data,
    });

    revalidateOfferPaths(offer.id);

    return { success: true, offerId: offer.id };
  } catch (error) {
    if (error instanceof AuthorizationError) return UNAUTHORIZED;
    console.error("[offres-actions] Erreur création offre:", error);
    return { error: "Une erreur est survenue lors de la création de l'offre." };
  }
}

export async function updateOffer(
  id: string,
  _prev: OfferActionState,
  formData: FormData
): Promise<OfferActionState> {
  try {
    await requireManager();

    const existing = await prisma.internshipOffer.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return { error: "Offre introuvable." };
    }

    const values = extractFormValues(formData);
    const parsed = offerFormSchema.safeParse(values);

    if (!parsed.success) {
      return {
        error: "Données invalides.",
        fieldErrors: toFieldErrors(parsed.error.issues),
      };
    }

    await prisma.internshipOffer.update({
      where: { id },
      data: parsed.data,
    });

    revalidateOfferPaths(id);

    return { success: true, offerId: id };
  } catch (error) {
    if (error instanceof AuthorizationError) return UNAUTHORIZED;
    console.error(`[offres-actions] Erreur mise à jour offre ${id}:`, error);
    return { error: "Une erreur est survenue lors de la mise à jour de l'offre." };
  }
}

export async function togglePublishOffer(
  id: string,
  nextPublished: boolean
): Promise<OfferActionState> {
  try {
    await requireManager();

    const existing = await prisma.internshipOffer.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return { error: "Offre introuvable." };
    }

    await prisma.internshipOffer.update({
      where: { id },
      data: { isPublished: nextPublished },
    });

    revalidateOfferPaths(id);

    return { success: true, offerId: id };
  } catch (error) {
    if (error instanceof AuthorizationError) return UNAUTHORIZED;
    console.error(`[offres-actions] Erreur publication offre ${id}:`, error);
    return {
      error: "Une erreur est survenue lors du changement de statut de publication.",
    };
  }
}

export async function deleteOffer(id: string): Promise<OfferActionState> {
  try {
    await requireManager();

    const existing = await prisma.internshipOffer.findUnique({
      where: { id },
      select: { id: true, _count: { select: { requests: true } } },
    });

    if (!existing) {
      return { error: "Offre introuvable." };
    }

    // Une offre référencée par des candidatures est dépubliée plutôt que
    // supprimée : `onDelete: SetNull` sur InternshipRequest.offerId préserve
    // l'historique, mais on évite d'effacer un intitulé encore utile aux RH.
    if (existing._count.requests > 0) {
      await prisma.internshipOffer.update({
        where: { id },
        data: { isPublished: false },
      });
      revalidateOfferPaths(id);
      return {
        error:
          "Offre liée à des candidatures : elle a été dépubliée plutôt que supprimée.",
      };
    }

    await prisma.internshipOffer.delete({ where: { id } });

    revalidateOfferPaths();

    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return UNAUTHORIZED;
    console.error(`[offres-actions] Erreur suppression offre ${id}:`, error);
    return { error: "Une erreur est survenue lors de la suppression de l'offre." };
  }
}
