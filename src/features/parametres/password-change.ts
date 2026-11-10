import "server-only";

import { after } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/shared/db/prisma";
import { keepCurrentSession } from "@/shared/auth/auth";
import { notifyPasswordChanged } from "@/features/notifications/send-notification";
import {
  RATE_LIMITS,
  consumeRateLimit,
  formatRetryAfter,
  isRateLimited,
} from "@/shared/security/rate-limit";
import { changePasswordSchema } from "./schema";
import type { ParametresActionState } from "./actions";

/**
 * Changement de mot de passe par son titulaire connecté, commun au
 * back-office et à l'espace candidat.
 *
 * Le mot de passe actuel est exigé même avec une session ouverte : un poste
 * laissé déverrouillé ne doit pas suffire à confisquer le compte. Les erreurs
 * sur ce champ sont comptées avec les échecs de connexion du compte, sans quoi
 * une session volée permettrait de deviner le mot de passe sans limite.
 *
 * Les autres sessions du compte sont fermées (version de session incrémentée),
 * celle d'où vient le changement est conservée, et le titulaire est prévenu
 * par email.
 *
 * Volontairement hors d'un fichier "use server" : l'appelant vérifie d'abord
 * la session, puis passe l'adresse qu'elle porte.
 */
export async function changeOwnPassword(
  email: string,
  formData: FormData
): Promise<{ state: ParametresActionState; userId?: string }> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: (formData.get("currentPassword") ?? "").toString(),
    newPassword: (formData.get("newPassword") ?? "").toString(),
    confirmPassword: (formData.get("confirmPassword") ?? "").toString(),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { state: { error: "Données invalides.", fieldErrors } };
  }

  const limit = await isRateLimited(RATE_LIMITS.loginFailuresPerAccount, email);
  if (!limit.allowed) {
    return {
      state: {
        error: `Trop d'essais incorrects. Réessayez ${formatRetryAfter(limit.retryAfterSeconds)}.`,
      },
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true, email: true, name: true, role: true },
  });

  if (!user) {
    return { state: { error: "Compte introuvable." } };
  }

  const validCurrent = await bcrypt.compare(parsed.data.currentPassword, user.password);

  if (!validCurrent) {
    await consumeRateLimit(RATE_LIMITS.loginFailuresPerAccount, email);
    return {
      state: {
        error: "Mot de passe actuel incorrect.",
        fieldErrors: { currentPassword: "Mot de passe actuel incorrect." },
      },
    };
  }

  const { sessionVersion } = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await bcrypt.hash(parsed.data.newPassword, 10),
      sessionVersion: { increment: 1 },
    },
    select: { sessionVersion: true },
  });

  await keepCurrentSession(user.id, sessionVersion);

  after(() =>
    notifyPasswordChanged({
      to: user.email,
      name: user.name,
      role: user.role,
      method: "change",
    })
  );

  return { state: { success: true }, userId: user.id };
}
