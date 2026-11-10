"use server";

import { recordAudit } from "@/shared/audit/audit";
import {
  RATE_LIMITS,
  consumeRateLimit,
  currentClientIp,
  formatRetryAfter,
} from "@/shared/security/rate-limit";
import { staffResetConfirmSchema, staffResetRequestSchema } from "./schema";
import { consumeStaffResetCode, issueStaffResetCode } from "./reset-code";
import { RESET_CODE_MAX_ATTEMPTS } from "./constants";

export type StaffResetState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  /** Étape 1 franchie : l'écran de saisie du code s'affiche. */
  codeSent?: boolean;
  /** Adresse saisie, renvoyée pour l'étape 2 (jamais placée dans l'URL). */
  email?: string;
  /** Mot de passe remplacé : l'écran de confirmation s'affiche. */
  reset?: boolean;
  /** Le code courant n'est plus utilisable : il faut en redemander un. */
  needsNewCode?: boolean;
};

/**
 * Étape 1 : envoie un code à 6 chiffres à l'adresse d'un compte du back-office.
 *
 * La réponse est toujours la même, qu'un compte existe ou non : ce formulaire
 * public ne doit pas permettre de tester quelles adresses ont un accès RH.
 */
export async function requestStaffResetCode(
  _prev: StaffResetState,
  formData: FormData
): Promise<StaffResetState> {
  const limit = await consumeRateLimit(RATE_LIMITS.emailFormsPerIp, await currentClientIp());
  if (!limit.allowed) {
    return {
      error: `Trop de demandes depuis votre connexion. Réessayez ${formatRetryAfter(limit.retryAfterSeconds)}.`,
    };
  }

  const parsed = staffResetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Email invalide." };
  }

  try {
    const account = await issueStaffResetCode(parsed.data.email);
    if (account) {
      await recordAudit(
        { email: account.email, role: account.role },
        {
          action: "auth.password_reset_requested",
          summary: "Code de réinitialisation du mot de passe envoyé par email",
          targetType: "user",
          targetId: account.id,
        }
      );
    }
  } catch (error) {
    console.error("[reinitialisation-rh] Échec d'émission du code:", error);
    return { error: "Une erreur est survenue. Veuillez réessayer." };
  }

  return { codeSent: true, email: parsed.data.email };
}

/** Étape 2 : vérifie le code et enregistre le nouveau mot de passe. */
export async function confirmStaffReset(
  _prev: StaffResetState,
  formData: FormData
): Promise<StaffResetState> {
  const rawEmail = (formData.get("email") ?? "").toString();
  // L'écran de saisie du code reste affiché quel que soit le résultat.
  const base: StaffResetState = { codeSent: true, email: rawEmail };

  const limit = await consumeRateLimit(
    RATE_LIMITS.resetCodeChecksPerIp,
    await currentClientIp()
  );
  if (!limit.allowed) {
    return {
      ...base,
      error: `Trop d'essais depuis votre connexion. Réessayez ${formatRetryAfter(limit.retryAfterSeconds)}.`,
    };
  }

  const parsed = staffResetConfirmSchema.safeParse({
    email: rawEmail,
    code: (formData.get("code") ?? "").toString(),
    password: (formData.get("password") ?? "").toString(),
    confirmPassword: (formData.get("confirmPassword") ?? "").toString(),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ...base, error: "Vérifiez les champs signalés.", fieldErrors };
  }

  try {
    const outcome = await consumeStaffResetCode(
      parsed.data.email,
      parsed.data.code,
      parsed.data.password
    );

    switch (outcome.status) {
      case "reset":
        await recordAudit(
          { email: outcome.email, role: outcome.role },
          {
            action: "auth.password_reset",
            summary: "Mot de passe réinitialisé par code envoyé par email",
            targetType: "user",
            targetId: outcome.userId,
          }
        );
        return { reset: true };

      case "invalid":
        return {
          ...base,
          fieldErrors: {
            code:
              outcome.attemptsLeft < RESET_CODE_MAX_ATTEMPTS
                ? `Code incorrect. ${outcome.attemptsLeft} essai${outcome.attemptsLeft > 1 ? "s" : ""} restant${outcome.attemptsLeft > 1 ? "s" : ""}.`
                : "Code incorrect.",
          },
        };

      case "expired":
        return {
          ...base,
          needsNewCode: true,
          error: "Ce code a expiré. Demandez-en un nouveau.",
        };

      case "locked":
        // Une suite d'essais ratés sur un compte du back-office ressemble à
        // une attaque : on la rend visible dans le journal, une seule fois.
        if (outcome.justLocked) {
          await recordAudit(
            { email: outcome.email, role: outcome.role },
            {
              action: "auth.password_reset_locked",
              summary: `Code de réinitialisation bloqué après ${RESET_CODE_MAX_ATTEMPTS} essais incorrects`,
              targetType: "user",
              targetId: outcome.userId,
            }
          );
        }
        return {
          ...base,
          needsNewCode: true,
          error: "Trop d'essais incorrects : ce code est bloqué. Demandez-en un nouveau.",
        };
    }
  } catch (error) {
    console.error("[reinitialisation-rh] Échec de la réinitialisation:", error);
    return { ...base, error: "Une erreur est survenue. Veuillez réessayer." };
  }
}
