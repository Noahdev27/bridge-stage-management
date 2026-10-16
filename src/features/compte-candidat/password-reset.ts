import "server-only";

import bcrypt from "bcryptjs";
import { prisma } from "@/shared/db/prisma";
import { createRawToken, hashToken } from "@/shared/auth/tokens";
import { getAppUrl } from "@/shared/config/app-url";
import { notifyPasswordReset } from "@/features/notifications/send-notification";

/**
 * Réinitialisation du mot de passe d'un compte candidat par lien envoyé à
 * l'adresse du compte.
 *
 * Réservé aux comptes CANDIDATE dont l'adresse est confirmée :
 * — un compte non confirmé n'a jamais prouvé que son titulaire relève
 *   l'adresse ; il passe par « Renvoyer l'email de vérification » ;
 * — les comptes du back-office (ADMIN, RH, TUTOR) sont provisionnés par un
 *   gestionnaire et changent leur mot de passe depuis Paramètres. Leur ouvrir
 *   un point d'entrée public ajouterait une surface d'attaque sur les comptes
 *   les plus sensibles sans besoin réel.
 *
 * Volontairement hors d'un fichier "use server" : ces fonctions manipulent des
 * jetons et ne doivent pas être exposées comme Server Actions.
 */

/**
 * Durée de validité d'un lien de réinitialisation. Plus courte que celle de la
 * vérification d'adresse (24 h) : ce lien ouvre l'accès à un compte existant.
 */
const TOKEN_TTL_MS = 60 * 60 * 1000;

/**
 * Délai minimal entre deux envois pour une même adresse. Le formulaire est
 * public : sans ce palier, il permettrait d'inonder la boîte d'un tiers.
 */
const RESEND_COOLDOWN_MS = 2 * 60 * 1000;

export type PasswordResetOutcome = "reset" | "expired" | "invalid";

/**
 * Date d'émission du jeton courant, déduite de son expiration : évite d'ajouter
 * une colonne pour la seule mesure du palier anti-abus.
 */
function isWithinCooldown(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  const issuedAt = expiresAt.getTime() - TOKEN_TTL_MS;
  return Date.now() - issuedAt < RESEND_COOLDOWN_MS;
}

/**
 * Émet un jeton de réinitialisation (en remplaçant tout jeton précédent) et
 * envoie le lien. L'envoi est non bloquant côté notifications : un échec SMTP
 * ne casse pas le parcours, le candidat pourra redemander un lien.
 *
 * @returns `false` si l'envoi a été écarté par le palier anti-abus.
 */
export async function issuePasswordReset(user: {
  id: string;
  email: string;
  name: string | null;
  passwordResetTokenExpiresAt?: Date | null;
}): Promise<boolean> {
  if (isWithinCooldown(user.passwordResetTokenExpiresAt ?? null)) {
    return false;
  }

  const rawToken = createRawToken();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: hashToken(rawToken),
      passwordResetTokenExpiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const resetUrl = `${getAppUrl()}/candidat/reinitialisation?token=${rawToken}`;

  await notifyPasswordReset({
    to: user.email,
    candidateName: user.name,
    resetUrl,
  });

  return true;
}

/**
 * Indique si un jeton est encore utilisable, sans le consommer : la page de
 * réinitialisation affiche ainsi un message clair plutôt qu'un formulaire qui
 * échouerait à la validation.
 */
export async function isPasswordResetTokenUsable(
  rawToken: string
): Promise<boolean> {
  if (!rawToken) return false;

  const user = await prisma.user.findUnique({
    where: { passwordResetTokenHash: hashToken(rawToken) },
    select: { passwordResetTokenExpiresAt: true },
  });

  return (
    !!user?.passwordResetTokenExpiresAt &&
    user.passwordResetTokenExpiresAt.getTime() >= Date.now()
  );
}

/**
 * Valide un jeton reçu par email et remplace le mot de passe.
 * Le jeton est à usage unique : il est effacé dans la même écriture.
 */
export async function consumePasswordReset(
  rawToken: string,
  newPassword: string
): Promise<PasswordResetOutcome> {
  if (!rawToken) return "invalid";

  const user = await prisma.user.findUnique({
    where: { passwordResetTokenHash: hashToken(rawToken) },
    select: { id: true, passwordResetTokenExpiresAt: true },
  });

  if (!user) return "invalid";

  if (
    !user.passwordResetTokenExpiresAt ||
    user.passwordResetTokenExpiresAt.getTime() < Date.now()
  ) {
    return "expired";
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await bcrypt.hash(newPassword, 10),
      passwordResetTokenHash: null,
      passwordResetTokenExpiresAt: null,
    },
  });

  return "reset";
}
