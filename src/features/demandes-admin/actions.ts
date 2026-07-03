"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/db/prisma";
import { notifyStatusChange } from "@/features/notifications/actions/send-notification"; // Import ajouté

export type AdminActionState = {
  error?: string;
  success?: boolean;
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

    // 1. Récupérer les infos du candidat AVANT la mise à jour pour envoyer le mail
    const request = await prisma.internshipRequest.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!request || !request.profile) {
      return { error: "Candidature introuvable." };
    }

    // 2. Mise à jour en base de données
    await prisma.internshipRequest.update({
      where: { id },
      data: { status: newStatus },
    });

    // 3. --- CÂBLAGE : Notification automatique ---
    // On notifie le candidat avec son email et son nom récupérés via la relation prisma
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