"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/db/prisma";
import { uploadDocument } from "@/shared/storage/supabase";
import { validatePdf } from "@/shared/validation/file";
import { REQUIRED_DOCUMENTS } from "@/shared/constants/domain";
import { completeApplicationSchema } from "./schema";
import { notifySubmission } from "@/features/notifications/actions/send-notification";
import { randomBytes } from "crypto";
import type { InternshipType } from "@prisma/client";

/**
 * ÉCRITURES — Server Action qui crée une demande de stage complète.
 * Pattern : (état précédent, FormData) -> ActionResult avec tracking code ou erreur.
 */

export type ActionState = {
  error?: string;
  success?: boolean;
  trackingCode?: string;
};

/**
 * Génère un code de suivi aléatoire et non devinable.
 * Format : 8 caractères alphanumériques en majuscules (ex: A7B2K9M1)
 */
function generateTrackingCode(): string {
  return randomBytes(4).toString("hex").toUpperCase().substring(0, 8);
}

function validateDocumentSet(
  internshipType: InternshipType,
  labels: string[]
): string | null {
  const requiredDocs = REQUIRED_DOCUMENTS[internshipType];
  const requiredSet = new Set(requiredDocs);

  const missing = requiredDocs.filter((doc) => !labels.includes(doc));
  if (missing.length > 0) {
    return `Documents manquants pour ce type de stage : ${missing.join(", ")}.`;
  }

  const unexpected = labels.filter((label) => !requiredSet.has(label));
  if (unexpected.length > 0) {
    return `Documents non requis pour ce type de stage : ${[...new Set(unexpected)].join(", ")}.`;
  }

  if (labels.length !== requiredDocs.length) {
    return "Le nombre de documents fournis ne correspond pas au dossier requis.";
  }

  return null;
}

/**
 * Server Action : crée une candidature complète.
 * 1. Valide les données (Zod)
 * 2. Vérifie la composition du dossier selon le type de stage
 * 3. Upload les fichiers sur Supabase
 * 4. Crée Profile + InternshipRequest + Document[] en une transaction
 * 5. Notifie le candidat et retourne le code de suivi
 */
export async function submitCandidature(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    // ===== 1. Validation des données personnelles et parcours =====
    const parsed = completeApplicationSchema.safeParse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      lieudit: formData.get("lieudit"),
      relativePhone1: formData.get("relativePhone1"),
      relativePhone2: formData.get("relativePhone2"),
      school: formData.get("school"),
      field: formData.get("field"),
      level: formData.get("level"),
      internshipType: formData.get("internshipType"),
      duration: formData.get("duration"),
      startDate: formData.get("startDate"),
      reportRequired: formData.get("reportRequired") === "true",
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Données invalides.";
      return { error: firstError };
    }

    const data = parsed.data;
    const internshipType = data.internshipType as InternshipType;

    // ===== 2. Récupérer les fichiers du FormData (PDF only, 2 Mo max) =====
    const files: { label: string; file: File }[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("documents_") && value instanceof File && value.size > 0) {
        // La clé encode le libellé (espaces -> "_") : on le décode.
        const label = key.substring("documents_".length).replace(/_/g, " ");

        const validationError = validatePdf(value);
        if (validationError) {
          return { error: `${label} : ${validationError}` };
        }
        files.push({ label, file: value });
      }
    }

    const documentError = validateDocumentSet(
      internshipType,
      files.map((f) => f.label)
    );
    if (documentError) {
      return { error: documentError };
    }

    // ===== 4. Upload des fichiers sur Supabase, classés par date + dossier =====
    // Arborescence : candidatures/{année}/{mois}/{code de suivi}/{libellé}.pdf
    // → facile à parcourir, et à purger par période (RGPD, 6 mois).
    const trackingCode = generateTrackingCode();
    const now = new Date();
    const datePrefix = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
    const folderPath = `candidatures/${datePrefix}/${trackingCode}`;

    const uploadedDocuments: { label: string; url: string }[] = [];
    try {
      for (const { label, file } of files) {
        const url = await uploadDocument(file, folderPath, label);
        uploadedDocuments.push({ label, url });
      }
    } catch (uploadError) {
      console.error("[candidature] Upload error:", uploadError);
      return { error: "Erreur lors de l'upload d'un fichier. Veuillez réessayer." };
    }

    // ===== 5. Créer profil + demande + documents en une TRANSACTION =====
    const startDate = new Date(data.startDate);

    try {
      await prisma.$transaction(async (tx) => {
        const profile = await tx.profile.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            lieudit: data.lieudit,
            relativePhone1: data.relativePhone1,
            relativePhone2: data.relativePhone2,
            school: data.school,
            field: data.field,
            level: data.level,
          },
        });

        const internshipRequest = await tx.internshipRequest.create({
          data: {
            trackingCode,
            type: internshipType,
            duration: data.duration,
            startDate,
            reportRequired: data.reportRequired,
            status: "PENDING",
            profileId: profile.id,
          },
        });

        await tx.document.createMany({
          data: uploadedDocuments.map((doc) => ({
            label: doc.label,
            url: doc.url,
            requestId: internshipRequest.id,
          })),
        });
      });
    } catch (dbError) {
      console.error("[candidature] Erreur base de données:", dbError);
      return {
        error:
          "Une erreur est survenue lors de la création de votre demande. Veuillez réessayer.",
      };
    }

    // ===== 6. Notifier le candidat (email non bloquant) + retour =====
    await notifySubmission(
      data.email,
      `${data.firstName} ${data.lastName}`,
      trackingCode
    );

    revalidatePath("/candidature");

    return { success: true, trackingCode };
  } catch (error) {
    console.error("[candidature] Erreur serveur:", error);
    return { error: "Erreur serveur. Veuillez réessayer plus tard." };
  }
}
