"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/db/prisma";
import { AuthorizationError, requireManager } from "@/shared/auth/guards";
import {
  notifyStatusChange,
  notifyTutorAssignment,
} from "@/features/notifications/send-notification";
import {
  isDecisionStatus,
  requestEvaluationSchema,
  statusUpdateSchema,
} from "./schema";
import { runRejectedPurge } from "./purge";
import { recordAudit } from "@/shared/audit/audit";
import { STATUS_LABELS } from "@/shared/constants/domain";
import type { RequestStatus } from "@prisma/client";

export type AdminActionState = {
  error?: string;
  success?: boolean;
  purgedCount?: number;
};

const UNAUTHORIZED: AdminActionState = { error: "Accès non autorisé." };

const ALLOWED_STATUSES: RequestStatus[] = [
  "PENDING",
  "PROCESS",
  "ACCEPTED",
  "REJECTED",
];

export async function updateCandidatureStatus(
  id: string,
  newStatus: RequestStatus,
  comment?: string
): Promise<AdminActionState> {
  try {
    const actor = await requireManager();

    if (!ALLOWED_STATUSES.includes(newStatus)) {
      return { error: "Statut de candidature invalide." };
    }

    const parsed = statusUpdateSchema.safeParse({
      status: newStatus,
      comment: comment || undefined,
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Données invalides.";
      return { error: firstError };
    }

    // Le message n'accompagne qu'une décision finale : sur un retour en
    // « En attente » ou « Traitement », on efface celui d'une décision passée
    // pour ne pas le réexpédier plus tard hors contexte.
    const decisionComment = isDecisionStatus(newStatus)
      ? parsed.data.comment?.trim() || null
      : null;

    const request = await prisma.internshipRequest.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!request || !request.profile) {
      return { error: "Candidature introuvable." };
    }

    await prisma.internshipRequest.update({
      where: { id },
      data: { status: newStatus, decisionComment },
    });

    // Le texte du message n'est pas recopié : il peut contenir des données
    // personnelles, et il reste consultable sur le dossier.
    await recordAudit(actor, {
      action: "request.status_changed",
      summary: `Statut « ${STATUS_LABELS[request.status]} » → « ${STATUS_LABELS[newStatus]} »`,
      targetType: "request",
      targetId: id,
      metadata: { from: request.status, to: newStatus, withComment: !!decisionComment },
    });

    await notifyStatusChange(
      request.profile.email,
      `${request.profile.firstName} ${request.profile.lastName}`,
      newStatus,
      request.trackingCode,
      decisionComment
    );

    revalidatePath("/admin");
    revalidatePath(`/admin/${id}`);

    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return UNAUTHORIZED;
    console.error(`[admin-actions] Erreur lors de la mise à jour ${id}:`, error);
    return { error: "Une erreur est survenue lors de la mise à jour." };
  }
}

export async function saveRequestEvaluation(
  requestId: string,
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const user = await requireManager();

    const parsed = requestEvaluationSchema.safeParse({
      rating: formData.get("rating"),
      comment: formData.get("comment") || undefined,
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Données invalides.";
      return { error: firstError };
    }

    const request = await prisma.internshipRequest.findUnique({
      where: { id: requestId },
      select: { id: true },
    });

    if (!request) {
      return { error: "Candidature introuvable." };
    }

    const author = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true },
    });

    const comment = parsed.data.comment?.trim() || null;

    const previousEvaluation = await prisma.requestEvaluation.findUnique({
      where: { requestId },
      select: { rating: true },
    });

    await prisma.requestEvaluation.upsert({
      where: { requestId },
      create: {
        requestId,
        rating: parsed.data.rating,
        comment,
        authorId: author?.id,
      },
      update: {
        rating: parsed.data.rating,
        comment,
        authorId: author?.id,
      },
    });

    await recordAudit(user, {
      action: "request.evaluated",
      summary: previousEvaluation
        ? `Note ${previousEvaluation.rating}/5 → ${parsed.data.rating}/5`
        : `Note ${parsed.data.rating}/5`,
      targetType: "request",
      targetId: requestId,
      metadata: { from: previousEvaluation?.rating ?? null, to: parsed.data.rating },
    });

    revalidatePath(`/admin/${requestId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return UNAUTHORIZED;
    console.error(
      `[admin-actions] Erreur lors de l'enregistrement de l'évaluation ${requestId}:`,
      error
    );
    return { error: "Une erreur est survenue lors de l'enregistrement." };
  }
}

export async function assignTutor(
  requestId: string,
  tutorId: string | null
): Promise<AdminActionState> {
  try {
    const actor = await requireManager();

    const request = await prisma.internshipRequest.findUnique({
      where: { id: requestId },
      include: {
        profile: { select: { firstName: true, lastName: true } },
        tutor: { select: { name: true, email: true } },
      },
    });

    if (!request) {
      return { error: "Candidature introuvable." };
    }

    const tutor = tutorId
      ? await prisma.user.findFirst({
          where: { id: tutorId, role: "TUTOR" },
          select: { id: true, name: true, email: true },
        })
      : null;

    if (tutorId && !tutor) {
      return { error: "Tuteur introuvable." };
    }

    await prisma.internshipRequest.update({
      where: { id: requestId },
      data: { tutorId },
    });

    if ((tutor?.id ?? null) !== request.tutorId) {
      const previous = request.tutor?.name || request.tutor?.email;
      await recordAudit(actor, tutor
        ? {
            action: "request.tutor_assigned",
            summary: previous
              ? `Tuteur ${previous} remplacé par ${tutor.name || tutor.email}`
              : `Tuteur ${tutor.name || tutor.email} affecté`,
            targetType: "request",
            targetId: requestId,
            metadata: { from: request.tutorId, to: tutor.id },
          }
        : {
            action: "request.tutor_removed",
            summary: `Tuteur ${previous ?? "inconnu"} retiré`,
            targetType: "request",
            targetId: requestId,
            metadata: { from: request.tutorId },
          });
    }

    // Notification dédiée au tuteur nouvellement affecté (cf. CDC Phase 2).
    if (tutor && tutor.id !== request.tutorId) {
      await notifyTutorAssignment({
        to: tutor.email,
        tutorName: tutor.name,
        candidateName: `${request.profile.firstName} ${request.profile.lastName}`,
        internshipType: request.type,
        startDate: request.startDate,
        requestId: request.id,
      });
    }

    revalidatePath("/admin");
    revalidatePath(`/admin/${requestId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return UNAUTHORIZED;
    console.error(`[admin-actions] Erreur assignation tuteur ${requestId}:`, error);
    return { error: "Impossible d'assigner le tuteur." };
  }
}

export async function purgeRejectedApplications(): Promise<AdminActionState> {
  try {
    const actor = await requireManager();

    const { purgedCount } = await runRejectedPurge();

    await recordAudit(actor, {
      action: "request.purged",
      summary: `Purge manuelle : ${purgedCount} dossier(s) rejeté(s) supprimé(s)`,
      metadata: { purgedCount, trigger: "manual" },
    });

    revalidatePath("/admin");

    return { success: true, purgedCount };
  } catch (error) {
    if (error instanceof AuthorizationError) return UNAUTHORIZED;
    console.error("[admin-actions] Erreur lors de la purge RGPD:", error);
    return { error: "Une erreur est survenue lors de la purge des dossiers." };
  }
}
