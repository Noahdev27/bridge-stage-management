import "server-only";

import { createHash, randomBytes } from "crypto";
import { prisma } from "@/shared/db/prisma";
import { notifyEmailVerification } from "@/features/notifications/send-notification";

/**
 * Vérification de l'adresse email d'un compte candidat.
 *
 * Sans cette étape, l'inscription ne prouve rien : un candidat postule sans
 * créer de compte (le parcours ne crée qu'un `Profile`), donc n'importe qui
 * pouvait s'inscrire avec l'adresse d'un candidat et lire son dossier — code de
 * suivi compris. Le compte n'est utilisable qu'après clic sur le lien reçu à
 * l'adresse déclarée.
 *
 * Volontairement hors d'un fichier "use server" : ces fonctions manipulent des
 * jetons et ne doivent pas être exposées comme Server Actions.
 */

/** Durée de validité d'un lien de vérification. */
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Délai minimal entre deux envois pour une même adresse. `resendVerification`
 * est un déclencheur d'email public : sans ce palier, il permettrait d'inonder
 * la boîte d'un tiers dont on connaît l'adresse.
 */
const RESEND_COOLDOWN_MS = 2 * 60 * 1000;

export type VerificationOutcome =
  | "verified"
  | "already-verified"
  | "expired"
  | "invalid";

/**
 * Seul le hash du jeton est stocké : une fuite de la base ne permet pas de
 * valider un compte à la place de son titulaire.
 */
function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * URL publique de l'application, pour construire un lien absolu cliquable
 * depuis un client mail.
 */
function getAppUrl(): string {
  if (process.env.AUTH_URL) return process.env.AUTH_URL.replace(/\/+$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

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
 * Émet un jeton pour ce compte (en remplaçant tout jeton précédent) et envoie
 * le lien de vérification. L'envoi est non bloquant côté notifications : un
 * échec SMTP n'annule pas l'inscription, le candidat pourra redemander l'email.
 *
 * @param options.throttle applique le palier anti-abus (renvoi à la demande).
 *   L'inscription elle-même n'est pas throttlée : le premier email doit partir.
 * @returns `false` si l'envoi a été écarté par le palier.
 */
export async function issueEmailVerification(
  user: {
    id: string;
    email: string;
    name: string | null;
    verificationTokenExpiresAt?: Date | null;
  },
  options: { throttle?: boolean } = {}
): Promise<boolean> {
  if (options.throttle && isWithinCooldown(user.verificationTokenExpiresAt ?? null)) {
    return false;
  }

  const rawToken = randomBytes(32).toString("base64url");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationTokenHash: hashToken(rawToken),
      verificationTokenExpiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const verificationUrl = `${getAppUrl()}/candidat/verification?token=${rawToken}`;

  await notifyEmailVerification({
    to: user.email,
    candidateName: user.name,
    verificationUrl,
  });

  return true;
}

/**
 * Valide un jeton reçu par email et marque l'adresse comme vérifiée.
 * Le jeton est à usage unique : il est effacé en même temps.
 */
export async function consumeEmailVerification(
  rawToken: string
): Promise<VerificationOutcome> {
  if (!rawToken) return "invalid";

  const user = await prisma.user.findUnique({
    where: { verificationTokenHash: hashToken(rawToken) },
    select: {
      id: true,
      emailVerifiedAt: true,
      verificationTokenExpiresAt: true,
    },
  });

  if (!user) return "invalid";
  if (user.emailVerifiedAt) return "already-verified";

  if (
    !user.verificationTokenExpiresAt ||
    user.verificationTokenExpiresAt.getTime() < Date.now()
  ) {
    return "expired";
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      verificationTokenHash: null,
      verificationTokenExpiresAt: null,
    },
  });

  return "verified";
}
