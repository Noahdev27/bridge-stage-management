"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/db/prisma";
import { auth } from "@/shared/auth/auth";
import { notifyStatusChange } from "@/features/notifications/actions/send-notification";
import { requestEvaluationSchema } from "./schema";
import { REJECTED_PURGE_MONTHS } from "@/shared/constants/domain";
import {
  deleteRequestDocumentsFolder,
  deleteStoragePaths,
  extractStoragePathFromUrl,
} from "@/shared/storage/supabase";

export type AdminActionState = {
  error?: string;
  success?: boolean;
  purgedCount?: number;
};

export async function updateCandidatureStatus(
  id: string,
  newStatus: "PENDING" | "PROCESS" | "ACCEPTED" | "REJECTED"
): Promise<AdminActionState> {
  try {
    const allowedStatuses = ["PENDING", "PROCESS", "ACCEPTED", "REJECTED"];
    if (!allowedStatuses.includes(newStatus)) {
      return { error: "Statut de candidature invalide." };
    }

    const request = await prisma.internshipRequest.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!request || !request.profile) {
      return { error: "Candidature introuvable." };
    }

    await prisma.internshipRequest.update({
      where: { id },
      data: { status: newStatus },
    });

    await notifyStatusChange(
      request.profile.email,
      `${request.profile.firstName} ${request.profile.lastName}`,
      newStatus,
      request.trackingCode
    );

    revalidatePath("/admin");
    revalidatePath(`/admin/${id}`);

    return { success: true };
  } catch (error) {
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
    const session = await auth();
    if (!session?.user?.email) {
      return { error: "Accès non autorisé." };
    }

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
      where: { email: session.user.email },
      select: { id: true },
    });

    const comment = parsed.data.comment?.trim() || null;

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

    revalidatePath(`/admin/${requestId}`);

    return { success: true };
  } catch (error) {
    console.error(
      `[admin-actions] Erreur lors de l'enregistrement de l'évaluation ${requestId}:`,
      error
    );
    return { error: "Une erreur est survenue lors de l'enregistrement." };
  }
}

export async function purgeRejectedApplications(): Promise<AdminActionState> {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { error: "Accès non autorisé." };
    }

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - REJECTED_PURGE_MONTHS);

    const outdated = await prisma.internshipRequest.findMany({
      where: {
        status: "REJECTED",
        updatedAt: { lte: cutoff },
      },
      include: {
        documents: true,
        profile: { select: { id: true } },
      },
    });

    if (outdated.length === 0) {
      return { success: true, purgedCount: 0 };
    }

    for (const request of outdated) {
      const pathsFromUrls = request.documents
        .map((doc) => extractStoragePathFromUrl(doc.url))
        .filter((path): path is string => !!path);

      await deleteStoragePaths(pathsFromUrls);
      await deleteRequestDocumentsFolder(request.id, request.createdAt);
      await prisma.profile.delete({ where: { id: request.profile.id } });
    }

    revalidatePath("/admin");

    return { success: true, purgedCount: outdated.length };
  } catch (error) {
    console.error("[admin-actions] Erreur lors de la purge RGPD:", error);
    return { error: "Une erreur est survenue lors de la purge des dossiers." };
  }
}
