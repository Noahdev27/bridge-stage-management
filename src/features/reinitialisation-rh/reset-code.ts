import "server-only";

import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { after } from "next/server";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { STAFF_ROLES } from "@/shared/auth/guards";
import {
  notifyPasswordChanged,
  notifyStaffPasswordResetCode,
} from "@/features/notifications/send-notification";
import {
  RESET_CODE_LENGTH,
  RESET_CODE_MAX_ATTEMPTS,
  RESET_CODE_TTL_MINUTES,
} from "./constants";

/**
 * « Mot de passe oublié » des comptes du back-office (ADMIN, RH, TUTOR), par
 * code à 6 chiffres envoyé à l'adresse du compte.
 *
 * Un code plutôt qu'un lien : la personne le tape sur l'écran où elle a fait
 * la demande, sans changer d'appareil ni de navigateur, et un lien intercepté
 * dans une boîte partagée ne suffit pas à lui seul.
 *
 * Un code aussi court n'est sûr que s'il est :
 * — de courte durée (15 minutes) ;
 * — limité en essais (5, décomptés atomiquement avant la comparaison, pour
 *   que des requêtes simultanées ne puissent pas dépasser la limite) ;
 * — stocké en HMAC avec une clé hors de la base, et lié au compte.
 *
 * Volontairement hors d'un fichier "use server" : ces fonctions manipulent
 * des codes et ne doivent pas être exposées comme Server Actions.
 */

const RESET_CODE_TTL_MS = RESET_CODE_TTL_MINUTES * 60 * 1000;

/** Délai minimal entre deux envois pour un même compte (boîte inondée sinon). */
const RESEND_COOLDOWN_MS = 60 * 1000;

export type ResetCodeOutcome =
  | { status: "reset"; userId: string; email: string; role: Role }
  | { status: "invalid"; attemptsLeft: number }
  | { status: "expired" }
  /** `justLocked` : c'est cet essai qui a épuisé le code (journalisé une fois). */
  | { status: "locked"; justLocked: boolean; userId: string; email: string; role: Role };

function codeSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET manquant : impossible de protéger le code.");
  return secret;
}

/** Empreinte liée au compte : un même code n'a pas la même empreinte ailleurs. */
function hashCode(userId: string, code: string): string {
  return createHmac("sha256", codeSecret()).update(`${userId}:${code}`).digest("hex");
}

function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Tirage uniforme de 000000 à 999999, zéros de tête compris. */
function createCode(): string {
  return randomInt(0, 10 ** RESET_CODE_LENGTH)
    .toString()
    .padStart(RESET_CODE_LENGTH, "0");
}

function isStaffRole(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

/**
 * Émet un nouveau code pour un compte du back-office et l'envoie par email.
 *
 * Silencieux pour une adresse inconnue ou un compte candidat : l'appelant
 * répond toujours la même chose, ce formulaire public ne doit pas révéler
 * quelles adresses ont un accès au back-office.
 *
 * @returns le compte concerné si un code a été envoyé, `null` sinon.
 */
export async function issueStaffResetCode(
  email: string
): Promise<{ id: string; email: string; role: Role } | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordResetCodeExpiresAt: true,
    },
  });

  if (!user || !isStaffRole(user.role)) return null;

  // Date d'émission déduite de l'expiration, comme pour le lien candidat.
  const issuedAt = user.passwordResetCodeExpiresAt
    ? user.passwordResetCodeExpiresAt.getTime() - RESET_CODE_TTL_MS
    : 0;
  if (Date.now() - issuedAt < RESEND_COOLDOWN_MS) return null;

  const code = createCode();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetCodeHash: hashCode(user.id, code),
      passwordResetCodeExpiresAt: new Date(Date.now() + RESET_CODE_TTL_MS),
      passwordResetCodeAttempts: 0,
    },
  });

  await notifyStaffPasswordResetCode({
    to: user.email,
    name: user.name,
    code,
    validityMinutes: RESET_CODE_TTL_MINUTES,
  });

  return { id: user.id, email: user.email, role: user.role };
}

/**
 * Vérifie le code saisi et, s'il est bon, remplace le mot de passe.
 * Le code est à usage unique : il est effacé dans la même écriture.
 */
export async function consumeStaffResetCode(
  email: string,
  code: string,
  newPassword: string
): Promise<ResetCodeOutcome> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordResetCodeHash: true,
      passwordResetCodeExpiresAt: true,
    },
  });

  // Adresse inconnue, compte candidat ou aucun code demandé : même réponse
  // qu'un mauvais code, sans rien révéler du compte.
  if (!user || !isStaffRole(user.role) || !user.passwordResetCodeHash) {
    return { status: "invalid", attemptsLeft: RESET_CODE_MAX_ATTEMPTS };
  }

  if (
    !user.passwordResetCodeExpiresAt ||
    user.passwordResetCodeExpiresAt.getTime() < Date.now()
  ) {
    return { status: "expired" };
  }

  // L'essai est décompté AVANT la comparaison, en une écriture conditionnelle :
  // deux requêtes simultanées ne peuvent pas consommer le même dernier essai.
  const claimed = await prisma.user.updateMany({
    where: {
      id: user.id,
      passwordResetCodeHash: user.passwordResetCodeHash,
      passwordResetCodeAttempts: { lt: RESET_CODE_MAX_ATTEMPTS },
    },
    data: { passwordResetCodeAttempts: { increment: 1 } },
  });

  const locked = (justLocked: boolean): ResetCodeOutcome => ({
    status: "locked",
    justLocked,
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  if (claimed.count === 0) return locked(false);

  if (!sameHash(hashCode(user.id, code), user.passwordResetCodeHash)) {
    const { passwordResetCodeAttempts } = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { passwordResetCodeAttempts: true },
    });
    const attemptsLeft = RESET_CODE_MAX_ATTEMPTS - passwordResetCodeAttempts;
    return attemptsLeft > 0 ? { status: "invalid", attemptsLeft } : locked(true);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await bcrypt.hash(newPassword, 10),
      passwordResetCodeHash: null,
      passwordResetCodeExpiresAt: null,
      passwordResetCodeAttempts: 0,
      // Ferme toutes les sessions ouvertes, celle d'un éventuel intrus comprise.
      sessionVersion: { increment: 1 },
    },
  });

  after(() =>
    notifyPasswordChanged({
      to: user.email,
      name: user.name,
      role: user.role,
      method: "reset",
    })
  );

  return { status: "reset", userId: user.id, email: user.email, role: user.role };
}
