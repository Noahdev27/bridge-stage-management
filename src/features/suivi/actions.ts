"use server";

import { trackingCodeResendSchema, trackingCodeSchema } from "./schema";
import { getCandidatureByTrackingCode } from "./queries";
import { resendTrackingCodes } from "./tracking-code-resend";

export type SuiviActionState = {
  error?: string;
  success?: boolean;
  candidature?: {
    id: string;
    trackingCode: string;
    status: "PENDING" | "PROCESS" | "ACCEPTED" | "REJECTED";
    type: string;
    createdAt: Date;
    startDate: Date;
    duration: string;
    /**
     * Message joint par la RH à sa décision. Déjà envoyé par email au candidat :
     * le reprendre ici évite qu'il soit perdu avec l'email.
     */
    decisionComment: string | null;
    profile: {
      firstName: string;
      lastName: string;
      school: string;
    };
  } | null;
};

/**
 * Server Action : Recherche un dossier par son code de suivi après validation Zod.
 */
export async function checkTrackingStatus(
  _prev: SuiviActionState,
  formData: FormData
): Promise<SuiviActionState> {
  try {
    // 1. Validation du champ avec le schéma Zod
    const rawCode = formData.get("trackingCode");
    const parsed = trackingCodeSchema.safeParse({ trackingCode: rawCode });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Code invalide.";
      return { error: firstError, candidature: null };
    }

    // 2. Recherche en base de données
    const candidature = await getCandidatureByTrackingCode(parsed.data.trackingCode);

    // 3. Si introuvable, message générique et sécurisé
    if (!candidature) {
      return {
        error: "Aucun dossier ne correspond à ce code de suivi. Vérifiez la saisie.",
        candidature: null,
      };
    }

    // 4. Succès : On retourne les infos nécessaires à l'affichage
    return {
      success: true,
      candidature: {
        id: candidature.id,
        trackingCode: candidature.trackingCode,
        status: candidature.status,
        type: candidature.type,
        createdAt: candidature.createdAt,
        startDate: candidature.startDate,
        duration: candidature.duration,
        decisionComment: candidature.decisionComment,
        profile: {
          firstName: candidature.profile.firstName,
          lastName: candidature.profile.lastName,
          school: candidature.profile.school,
        },
      },
    };
  } catch (error) {
    console.error("[suivi-actions] Erreur serveur lors du suivi:", error);
    return {
      error: "Une erreur serveur est survenue. Veuillez réessayer plus tard.",
      candidature: null,
    };
  }
}

export type ResendCodeActionState = {
  error?: string;
  success?: boolean;
};

/**
 * Renvoie le code de suivi à l'adresse du dossier.
 *
 * La réponse est toujours la même, qu'un dossier existe ou non : ce formulaire
 * est public, il ne doit pas permettre de tester si une adresse a candidaté.
 * Le code lui-même ne transite que par email.
 */
export async function resendTrackingCode(
  _prev: ResendCodeActionState,
  formData: FormData
): Promise<ResendCodeActionState> {
  const parsed = trackingCodeResendSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Email invalide." };
  }

  try {
    await resendTrackingCodes(parsed.data.email);
  } catch (error) {
    console.error("[suivi-actions] Erreur renvoi du code de suivi:", error);
    return {
      error: "Une erreur serveur est survenue. Veuillez réessayer plus tard.",
    };
  }

  return { success: true };
}