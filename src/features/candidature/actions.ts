"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { InternshipType } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import {
  createUploadSlot,
  deleteStoragePaths,
  documentPathFor,
  inspectStoredFile,
  moveDocument,
} from "@/shared/storage/supabase";
import { looksLikePdf } from "@/shared/validation/file";
import { MAX_FILE_SIZE, REQUIRED_DOCUMENTS } from "@/shared/constants/domain";
import {
  TRACKING_CODE_ALPHABET,
  TRACKING_CODE_LENGTH,
} from "@/shared/tracking/tracking-code";
import {
  RATE_LIMITS,
  consumeRateLimit,
  currentClientIp,
  formatRetryAfter,
} from "@/shared/security/rate-limit";
import { getAppUrl } from "@/shared/config/app-url";
import {
  notifyNewApplication,
  notifySubmission,
} from "@/features/notifications/send-notification";
import { completeApplicationSchema } from "./schema";

/**
 * ÉCRITURES — dépôt d'une candidature, en deux temps.
 *
 * Les PDF ne passent pas par le serveur de l'application : Vercel refuse toute
 * requête de plus de 4,5 Mo, alors qu'un dossier professionnel complet (6 PDF
 * de 2 Mo) atteint 12 Mo — d'où l'erreur brute que voyaient les candidats.
 *
 * 1. `prepareCandidatureUpload` ouvre une adresse de dépôt signée par document ;
 *    le navigateur y envoie chaque fichier directement.
 * 2. `submitCandidature` revérifie les fichiers déposés puis crée le dossier.
 */

export type ActionState = {
  error?: string;
  success?: boolean;
  /**
   * Le code de suivi ne part que par email : s'il n'a pas pu être envoyé, le
   * candidat doit le savoir pour le redemander depuis /suivi.
   */
  emailSent?: boolean;
};

/**
 * Génère un code de suivi aléatoire et non devinable.
 * 16 caractères tirés d'un alphabet de 32, soit 80 bits d'entropie.
 *
 * `octet % 32` est uniforme car 256 est un multiple de 32 : aucun caractère
 * n'est favorisé, contrairement à un modulo sur un alphabet de taille
 * quelconque.
 */
function generateTrackingCode(): string {
  const bytes = randomBytes(TRACKING_CODE_LENGTH);
  let code = "";
  for (const byte of bytes) {
    code += TRACKING_CODE_ALPHABET[byte % TRACKING_CODE_ALPHABET.length];
  }
  return code;
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

/** Fichier tel que décrit par le navigateur, avant son envoi. */
export type UploadRequestFile = {
  label: string;
  name: string;
  size: number;
  type: string;
};

export type PrepareUploadResult = {
  error?: string;
  /** Identifiant du dossier de dépôt temporaire, à renvoyer à la validation. */
  uploadId?: string;
  slots?: { label: string; signedUrl: string }[];
};

const UPLOAD_ID_PATTERN = /^[a-f0-9]{32}$/;

function uploadFolder(uploadId: string): string {
  return `temp/${uploadId}`;
}

/** Étape 1 : ouvre un emplacement de dépôt signé par document. */
export async function prepareCandidatureUpload(input: {
  internshipType: string;
  files: UploadRequestFile[];
}): Promise<PrepareUploadResult> {
  try {
    // Chaque préparation ouvre des emplacements de stockage : c'est le point
    // d'entrée à protéger contre l'envoi massif de dossiers.
    const limit = await consumeRateLimit(
      RATE_LIMITS.candidaturePerIp,
      await currentClientIp()
    );
    if (!limit.allowed) {
      return {
        error: `Trop d'envois depuis votre connexion. Réessayez ${formatRetryAfter(limit.retryAfterSeconds)}.`,
      };
    }

    const type = z.nativeEnum(InternshipType).safeParse(input?.internshipType);
    if (!type.success || !Array.isArray(input.files)) {
      return { error: "Type de stage invalide." };
    }

    const documentError = validateDocumentSet(
      type.data,
      input.files.map((f) => String(f.label))
    );
    if (documentError) return { error: documentError };

    // Contrôle sur la description des fichiers ; leur contenu réel est
    // revérifié après le dépôt, dans `submitCandidature`.
    for (const file of input.files) {
      if (!looksLikePdf(String(file.name), String(file.type))) {
        return { error: `${file.label} : seuls les fichiers PDF sont acceptés.` };
      }
      if (!(Number(file.size) > 0 && Number(file.size) <= MAX_FILE_SIZE)) {
        return { error: `${file.label} : le fichier doit faire au plus 2 Mo.` };
      }
    }

    const uploadId = randomBytes(16).toString("hex");
    const folder = uploadFolder(uploadId);
    const slots = await Promise.all(
      input.files.map(async (file) => {
        const slot = await createUploadSlot(documentPathFor(folder, file.label));
        return { label: file.label, signedUrl: slot.signedUrl };
      })
    );

    return { uploadId, slots };
  } catch (error) {
    console.error("[candidature] Échec de préparation de l'envoi:", error);
    return {
      error: "Impossible de préparer l'envoi de vos documents. Veuillez réessayer.",
    };
  }
}

export type CandidatureSubmission = {
  uploadId: string;
  fields: Record<string, unknown>;
};

/**
 * Étape 2 : crée la candidature à partir des fichiers déposés.
 * 1. Valide les données (Zod) et l'offre éventuelle
 * 2. Vérifie chaque fichier déposé : présence, taille, signature PDF réelle
 * 3. Crée Profile + InternshipRequest, puis range les fichiers et les Document
 * 4. Notifie le candidat (code de suivi) et l'équipe RH
 */
export async function submitCandidature(
  input: CandidatureSubmission
): Promise<ActionState> {
  const uploadId = typeof input?.uploadId === "string" ? input.uploadId : "";
  // L'identifiant compose un chemin de stockage : seul le format exact généré
  // par `prepareCandidatureUpload` est accepté, jamais un chemin arbitraire.
  if (!UPLOAD_ID_PATTERN.test(uploadId)) {
    return { error: "Envoi invalide. Veuillez recommencer." };
  }
  const folder = uploadFolder(uploadId);

  try {
    const fields = input.fields ?? {};
    if (fields.consent !== true) {
      return {
        error: "Veuillez accepter le traitement de vos données pour envoyer votre dossier.",
      };
    }
    const parsed = completeApplicationSchema.safeParse({
      ...fields,
      reportRequired:
        fields.reportRequired === true || fields.reportRequired === "true",
      offerId: fields.offerId || undefined,
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
    }

    const data = parsed.data;
    const hasGps = data.latitude !== undefined && data.longitude !== undefined;
    const internshipType = data.internshipType as InternshipType;

    let offerTitle: string | null = null;
    if (data.offerId) {
      const offer = await prisma.internshipOffer.findFirst({
        where: { id: data.offerId, isPublished: true },
        select: { title: true, type: true, durationMonths: true },
      });
      if (!offer) {
        return { error: "Cette offre n'est plus disponible." };
      }
      // L'offre fixe le type et une durée minimale : une candidature qui s'en
      // écarte ne correspondrait plus à l'offre affichée côté RH.
      if (offer.type !== internshipType) {
        return { error: "Le type de stage ne correspond pas à celui de l'offre." };
      }
      if (Number(data.duration) < offer.durationMonths) {
        return {
          error: `Cette offre demande une durée d'au moins ${offer.durationMonths} mois.`,
        };
      }
      offerTitle = offer.title;

      const duplicate = await prisma.internshipRequest.findFirst({
        where: {
          offerId: data.offerId,
          status: { in: ["PENDING", "PROCESS", "ACCEPTED"] },
          profile: { email: { equals: data.email, mode: "insensitive" } },
        },
        select: { id: true },
      });
      if (duplicate) {
        return {
          error:
            "Vous avez déjà une candidature en cours pour cette offre. Suivez-la depuis la page de suivi.",
        };
      }
    }

    // ===== Vérification des fichiers déposés par le navigateur =====
    const stagedFiles = REQUIRED_DOCUMENTS[internshipType].map((label) => ({
      label,
      storagePath: documentPathFor(folder, label),
    }));

    const inspections = await Promise.all(
      stagedFiles.map((f) => inspectStoredFile(f.storagePath))
    );
    for (const [i, info] of inspections.entries()) {
      const { label } = stagedFiles[i];
      const problem = !info
        ? `${label} : le fichier n'a pas été reçu. Veuillez renvoyer votre dossier.`
        : info.size > MAX_FILE_SIZE
          ? `${label} : le fichier dépasse 2 Mo.`
          : !info.isPdf
            ? `${label} : ce fichier n'est pas un PDF valide.`
            : null;
      if (problem) {
        await deleteStoragePaths(stagedFiles.map((f) => f.storagePath));
        return { error: problem };
      }
    }

    const trackingCode = generateTrackingCode();
    const startDate = new Date(data.startDate);
    const now = new Date();
    const datePrefix = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;

    let requestId: string;
    let profileId: string;

    try {
      const created = await prisma.$transaction(async (tx) => {
        const profile = await tx.profile.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            lieudit: data.lieudit,
            // Une coordonnée seule ne localise rien : on garde les deux ou aucune.
            latitude: hasGps ? data.latitude : null,
            longitude: hasGps ? data.longitude : null,
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
            offerId: data.offerId,
          },
        });

        return { requestId: internshipRequest.id, profileId: profile.id };
      });

      requestId = created.requestId;
      profileId = created.profileId;
    } catch (dbError) {
      await deleteStoragePaths(stagedFiles.map((f) => f.storagePath));
      console.error("[candidature] Erreur base de données:", dbError);
      return {
        error:
          "Une erreur est survenue lors de la création de votre demande. Veuillez réessayer.",
      };
    }

    const finalFolder = `candidatures/${datePrefix}/${requestId}`;
    const pendingPaths = stagedFiles.map((f) => f.storagePath);
    const finalizedPaths: string[] = [];

    try {
      const uploadedDocuments: {
        label: string;
        url: string;
        storagePath: string;
      }[] = [];

      // Rangement en parallèle : six déplacements successifs ajoutaient
      // plusieurs secondes à l'attente du candidat.
      const moves = await Promise.allSettled(
        stagedFiles.map((staged) => moveDocument(staged.storagePath, finalFolder))
      );
      for (const [index, outcome] of moves.entries()) {
        if (outcome.status === "rejected") continue;
        const pendingIndex = pendingPaths.indexOf(stagedFiles[index].storagePath);
        if (pendingIndex !== -1) pendingPaths.splice(pendingIndex, 1);
        finalizedPaths.push(outcome.value.storagePath);
        uploadedDocuments.push({
          label: stagedFiles[index].label,
          url: outcome.value.signedUrl,
          storagePath: outcome.value.storagePath,
        });
      }
      const failedMove = moves.find((outcome) => outcome.status === "rejected");
      if (failedMove) throw (failedMove as PromiseRejectedResult).reason;

      await prisma.document.createMany({
        data: uploadedDocuments.map((doc) => ({
          label: doc.label,
          url: doc.url,
          storagePath: doc.storagePath,
          requestId,
        })),
      });
    } catch (finalizeError) {
      await deleteStoragePaths([...pendingPaths, ...finalizedPaths]);
      try {
        await prisma.profile.delete({ where: { id: profileId } });
      } catch (rollbackError) {
        console.error("[candidature] Échec du rollback:", rollbackError);
      }
      console.error("[candidature] Erreur finalisation:", finalizeError);
      return {
        error:
          "Une erreur est survenue lors de la création de votre demande. Veuillez réessayer.",
      };
    }

    const candidateName = `${data.firstName} ${data.lastName}`;

    // Le code de suivi n'est transmis que par email : on attend le résultat
    // pour pouvoir prévenir le candidat si l'envoi a échoué.
    const emailSent = await notifySubmission(data.email, candidateName, trackingCode);

    // L'alerte RH part après la réponse : le candidat n'a pas à l'attendre.
    after(async () => {
      try {
        const managers = await prisma.user.findMany({
          where: { role: { in: ["ADMIN", "RH"] } },
          select: { email: true },
        });
        await notifyNewApplication({
          recipients: managers.map((m) => m.email),
          candidateName,
          internshipType,
          offerTitle,
          dossierUrl: `${getAppUrl()}/admin/${requestId}`,
        });
      } catch (notifyError) {
        console.error("[candidature] Alerte RH non envoyée:", notifyError);
      }
    });

    revalidatePath("/admin");

    return { success: true, emailSent };
  } catch (error) {
    console.error("[candidature] Erreur serveur:", error);
    return { error: "Erreur serveur. Veuillez réessayer plus tard." };
  }
}
