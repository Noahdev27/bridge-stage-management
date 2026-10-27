"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/db/prisma";
import { AuthorizationError, requireManager } from "@/shared/auth/guards";
import { offerFormSchema } from "./schema";
import { recordAudit } from "@/shared/audit/audit";

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
  // L'accueil affiche les offres ouvertes.
  revalidatePath("/");
  if (offerId) {
    revalidatePath(`/admin/offres/${offerId}`);
  }
}

export async function createOffer(
  _prev: OfferActionState,
  formData: FormData
): Promise<OfferActionState> {
  try {
    const actor = await requireManager();

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

    await recordAudit(actor, {
      action: "offer.created",
      summary: `Offre « ${offer.title} » créée${offer.isPublished ? " et publiée" : ""}`,
      targetType: "offer",
      targetId: offer.id,
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
    const actor = await requireManager();

    const existing = await prisma.internshipOffer.findUnique({
      where: { id },
      select: { id: true, title: true },
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

    await recordAudit(actor, {
      action: "offer.updated",
      summary: existing.title === parsed.data.title
        ? `Offre « ${parsed.data.title} » modifiée`
        : `Offre « ${existing.title} » modifiée (renommée « ${parsed.data.title} »)`,
      targetType: "offer",
      targetId: id,
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
    const actor = await requireManager();

    const existing = await prisma.internshipOffer.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!existing) {
      return { error: "Offre introuvable." };
    }

    await prisma.internshipOffer.update({
      where: { id },
      data: { isPublished: nextPublished },
    });

    await recordAudit(actor, {
      action: nextPublished ? "offer.published" : "offer.unpublished",
      summary: `Offre « ${existing.title} » ${nextPublished ? "publiée" : "dépubliée"}`,
      targetType: "offer",
      targetId: id,
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
    const actor = await requireManager();

    const existing = await prisma.internshipOffer.findUnique({
      where: { id },
      select: { id: true, title: true, _count: { select: { requests: true } } },
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
      await recordAudit(actor, {
        action: "offer.unpublished",
        summary: `Offre « ${existing.title} » dépubliée au lieu d'être supprimée (liée à ${existing._count.requests} candidature(s))`,
        targetType: "offer",
        targetId: id,
      });
      revalidateOfferPaths(id);
      return {
        error:
          "Offre liée à des candidatures : elle a été dépubliée plutôt que supprimée.",
      };
    }

    await prisma.internshipOffer.delete({ where: { id } });

    await recordAudit(actor, {
      action: "offer.deleted",
      summary: `Offre « ${existing.title} » supprimée`,
      targetType: "offer",
      targetId: id,
    });

    revalidateOfferPaths();

    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return UNAUTHORIZED;
    console.error(`[offres-actions] Erreur suppression offre ${id}:`, error);
    return { error: "Une erreur est survenue lors de la suppression de l'offre." };
  }
}
