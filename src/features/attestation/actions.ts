"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/db/prisma";
import {
  AuthorizationError,
  requireAdmin,
  requireManager,
} from "@/shared/auth/guards";
import {
  deleteStoragePaths,
  uploadImage,
} from "@/shared/storage/supabase";
import { validateSignatureImage } from "@/shared/validation/file";
import { attestationIssueSchema, parseDateOnly } from "./schema";
import { SIGNATURE_STORAGE_PATH, STAMP_STORAGE_PATH } from "./constants";
import { getAttestationSettings, saveAttestationSettings } from "./settings";

export type AttestationActionState = {
  error?: string;
  success?: boolean;
};

/**
 * Enregistre la période réellement effectuée par le stagiaire.
 *
 * Seul un dossier ACCEPTED peut être attesté : délivrer une attestation pour une
 * candidature refusée ou encore en traitement produirait un faux.
 */
export async function saveInternshipPeriod(
  requestId: string,
  _prev: AttestationActionState,
  formData: FormData
): Promise<AttestationActionState> {
  try {
    await requireManager();

    const parsed = attestationIssueSchema.safeParse({
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Données invalides.";
      return { error: firstError };
    }

    const request = await prisma.internshipRequest.findUnique({
      where: { id: requestId },
      select: { status: true },
    });

    if (!request) {
      return { error: "Candidature introuvable." };
    }

    if (request.status !== "ACCEPTED") {
      return {
        error:
          "Seule une candidature acceptée peut donner lieu à une attestation de stage.",
      };
    }

    await prisma.internshipRequest.update({
      where: { id: requestId },
      data: {
        startDate: parseDateOnly(parsed.data.startDate),
        endDate: parseDateOnly(parsed.data.endDate),
      },
    });

    revalidatePath(`/admin/${requestId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { error: "Accès non autorisé." };
    }
    console.error(
      `[attestation] Erreur lors de l'enregistrement de la période ${requestId}:`,
      error
    );
    return { error: "Une erreur est survenue lors de l'enregistrement." };
  }
}

/** Les deux griffes apposables, et leur emplacement de stockage. */
const BRANDING_SLOTS = {
  signature: { path: SIGNATURE_STORAGE_PATH, label: "La signature" },
  stamp: { path: STAMP_STORAGE_PATH, label: "Le cachet" },
} as const;

export type BrandingSlot = keyof typeof BRANDING_SLOTS;

/**
 * Installe la griffe de signature ou le cachet de l'entreprise.
 *
 * Réservé aux administrateurs : poser une griffe revient à autoriser la
 * signature de la direction sur tout document délivré ensuite. Un gestionnaire
 * RH peut délivrer une attestation, pas décider de ce qui la signe.
 */
export async function uploadAttestationBranding(
  slot: BrandingSlot,
  _prev: AttestationActionState,
  formData: FormData
): Promise<AttestationActionState> {
  try {
    const admin = await requireAdmin();

    const target = BRANDING_SLOTS[slot];
    if (!target) return { error: "Emplacement inconnu." };

    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) {
      return { error: "Sélectionnez une image." };
    }

    const validationError = validateSignatureImage(file);
    if (validationError) return { error: validationError };

    // L'extension suit le type réel du fichier, pas le nom fourni.
    const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
    const storagePath = `${target.path}.${extension}`;

    const previous = await getAttestationSettings();
    const previousPath =
      slot === "signature" ? previous.signaturePath : previous.stampPath;

    await uploadImage(file, storagePath);

    await saveAttestationSettings(
      slot === "signature" ? { signaturePath: storagePath } : { stampPath: storagePath },
      admin.email
    );

    // Un changement d'extension laisserait l'ancien fichier orphelin dans le bucket.
    if (previousPath && previousPath !== storagePath) {
      await deleteStoragePaths([previousPath]);
    }

    revalidatePath("/admin/parametres");

    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { error: "Accès non autorisé." };
    }
    console.error(`[attestation] Échec du téléversement (${slot}):`, error);
    return { error: "Une erreur est survenue lors du téléversement." };
  }
}

/** Retire une griffe : les attestations suivantes repartent sans elle. */
export async function removeAttestationBranding(
  slot: BrandingSlot
): Promise<AttestationActionState> {
  try {
    const admin = await requireAdmin();

    const settings = await getAttestationSettings();
    const currentPath =
      slot === "signature" ? settings.signaturePath : settings.stampPath;

    if (!currentPath) return { success: true };

    await saveAttestationSettings(
      slot === "signature" ? { signaturePath: null } : { stampPath: null },
      admin.email
    );
    await deleteStoragePaths([currentPath]);

    revalidatePath("/admin/parametres");

    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { error: "Accès non autorisé." };
    }
    console.error(`[attestation] Échec du retrait (${slot}):`, error);
    return { error: "Une erreur est survenue lors du retrait." };
  }
}
