import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

/**
 * Mise à jour de la version de session portée par le JWT.
 *
 * Après un changement de mot de passe, la version du compte augmente et toutes
 * les sessions sont refusées, y compris celle de la personne qui vient de
 * changer son mot de passe. Pour lui éviter de se reconnecter, l'action
 * serveur met à jour son propre JWT avec la nouvelle version.
 *
 * Cette mise à jour passe par le déclencheur « update » d'Auth.js, que le
 * navigateur peut aussi invoquer (POST /api/auth/session) avec des données de
 * son choix. La nouvelle version n'est donc acceptée qu'accompagnée d'une
 * preuve signée avec AUTH_SECRET, que seul le serveur sait produire : une
 * session révoquée ne peut pas se réhabiliter elle-même.
 */

export type SessionRefresh = { version: number; proof: string };

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET manquant.");
  return value;
}

function sign(userId: string, version: number): string {
  return createHmac("sha256", secret())
    .update(`session-refresh:${userId}:${version}`)
    .digest("hex");
}

/** Données à passer à `unstable_update` pour adopter la nouvelle version. */
export function buildSessionRefresh(userId: string, version: number): SessionRefresh {
  return { version, proof: sign(userId, version) };
}

/** Indique si des données de mise à jour reçues portent une preuve valide. */
export function readSessionRefresh(data: unknown, userId: string): number | null {
  const refresh = (data as { sessionRefresh?: Partial<SessionRefresh> } | null)
    ?.sessionRefresh;
  if (
    !refresh ||
    typeof refresh.version !== "number" ||
    typeof refresh.proof !== "string"
  ) {
    return null;
  }

  const expected = Buffer.from(sign(userId, refresh.version), "hex");
  const received = Buffer.from(refresh.proof, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received)
    ? refresh.version
    : null;
}
