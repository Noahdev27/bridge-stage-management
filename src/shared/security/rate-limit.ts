import "server-only";

import { headers } from "next/headers";
import { prisma } from "@/shared/db/prisma";

/**
 * Limitation de débit à fenêtre fixe, stockée en base.
 *
 * Chaque requête peut être servie par une instance serverless différente : un
 * compteur en mémoire ne verrait qu'une fraction des tentatives. La clé inclut
 * le numéro de fenêtre, donc un compteur repart de zéro à chaque fenêtre sans
 * qu'il faille le remettre à zéro ; les lignes expirées sont purgées par le
 * cron quotidien (`purgeExpiredRateLimits`).
 *
 * En cas d'indisponibilité de la base, la limite laisse passer : bloquer tous
 * les candidats parce qu'un compteur est illisible serait pire que l'abus
 * qu'il prévient, et l'action elle-même échouerait de toute façon sans base.
 */

export type RateLimitRule = {
  /** Préfixe de la clé, par exemple `candidature`. */
  scope: string;
  /** Nombre d'actions autorisées par fenêtre. */
  limit: number;
  /** Durée de la fenêtre, en secondes. */
  windowSeconds: number;
};

export type RateLimitResult = {
  allowed: boolean;
  /** Secondes avant l'ouverture de la fenêtre suivante. */
  retryAfterSeconds: number;
};

function windowFor(rule: RateLimitRule, now = Date.now()) {
  const windowMs = rule.windowSeconds * 1000;
  const index = Math.floor(now / windowMs);
  const end = (index + 1) * windowMs;
  return {
    index,
    expiresAt: new Date(end),
    retryAfterSeconds: Math.max(1, Math.ceil((end - now) / 1000)),
  };
}

function keyFor(rule: RateLimitRule, identifier: string, index: number) {
  return `${rule.scope}:${identifier.toLowerCase()}:${index}`;
}

/** Compte une action et indique si elle reste dans la limite. */
export async function consumeRateLimit(
  rule: RateLimitRule,
  identifier: string
): Promise<RateLimitResult> {
  const { index, expiresAt, retryAfterSeconds } = windowFor(rule);
  try {
    const row = await prisma.rateLimit.upsert({
      where: { key: keyFor(rule, identifier, index) },
      create: { key: keyFor(rule, identifier, index), count: 1, expiresAt },
      update: { count: { increment: 1 } },
      select: { count: true },
    });
    return { allowed: row.count <= rule.limit, retryAfterSeconds };
  } catch (error) {
    console.error(`[rate-limit] Compteur ${rule.scope} illisible :`, error);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

/**
 * Indique si la limite est déjà atteinte, sans compter d'action.
 *
 * Sert aux échecs de connexion : on ne compte que les mots de passe faux,
 * mais on vérifie le compteur avant même de comparer le mot de passe.
 */
export async function isRateLimited(
  rule: RateLimitRule,
  identifier: string
): Promise<RateLimitResult> {
  const { index, retryAfterSeconds } = windowFor(rule);
  try {
    const row = await prisma.rateLimit.findUnique({
      where: { key: keyFor(rule, identifier, index) },
      select: { count: true },
    });
    return { allowed: (row?.count ?? 0) < rule.limit, retryAfterSeconds };
  } catch (error) {
    console.error(`[rate-limit] Compteur ${rule.scope} illisible :`, error);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

/** Supprime les compteurs dont la fenêtre est close (appelé par le cron). */
export async function purgeExpiredRateLimits(): Promise<number> {
  const { count } = await prisma.rateLimit.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return count;
}

/** Formulation lisible d'un délai d'attente, pour les messages d'erreur. */
export function formatRetryAfter(seconds: number): string {
  if (seconds < 90) return "dans une minute";
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 90) return `dans ${minutes} minutes`;
  return `dans ${Math.ceil(minutes / 60)} heures`;
}

/**
 * Adresse IP du client, telle que transmise par le proxy de l'hébergeur.
 *
 * Vercel et Hostinger placent l'adresse réelle en tête de `x-forwarded-for`.
 * Faute d'en-tête, toutes les requêtes partagent l'identifiant « inconnu » :
 * la limite reste globale plutôt que de disparaître.
 */
export function clientIpFrom(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headerList.get("x-real-ip")?.trim() || "inconnu";
}

/** Adresse IP du client depuis une Server Action ou un composant serveur. */
export async function currentClientIp(): Promise<string> {
  return clientIpFrom(await headers());
}

/**
 * Règles partagées, regroupées pour rester lisibles et cohérentes.
 *
 * Les limites par adresse IP restent larges : une salle informatique
 * d'université partage souvent une seule adresse publique, et plusieurs
 * étudiants y postulent dans la même heure. Les limites par compte, elles,
 * sont strictes.
 */
export const RATE_LIMITS = {
  /** Échecs de mot de passe sur un même compte. */
  loginFailuresPerAccount: { scope: "login-fail-account", limit: 5, windowSeconds: 15 * 60 },
  /** Échecs de mot de passe depuis une même adresse, tous comptes confondus. */
  loginFailuresPerIp: { scope: "login-fail-ip", limit: 20, windowSeconds: 15 * 60 },
  /** Préparations d'envoi de dossier (chacune ouvre des emplacements de stockage). */
  candidaturePerIp: { scope: "candidature", limit: 30, windowSeconds: 60 * 60 },
  /** Consultations de statut par code de suivi. */
  trackingLookupPerIp: { scope: "suivi", limit: 60, windowSeconds: 10 * 60 },
  /** Formulaires publics qui envoient un email (inscription, oubli, renvoi). */
  emailFormsPerIp: { scope: "email-form", limit: 20, windowSeconds: 60 * 60 },
  /** Vérifications publiques d'attestation. */
  attestationCheckPerIp: { scope: "attestation-check", limit: 30, windowSeconds: 10 * 60 },
} as const satisfies Record<string, RateLimitRule>;
