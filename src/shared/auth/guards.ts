import "server-only";

import type { Role } from "@prisma/client";
import { auth } from "./auth";

/**
 * Gardes d'autorisation réutilisables.
 *
 * Le middleware ne protège que la navigation : une Server Action est dispatchée
 * par identifiant et peut être invoquée depuis n'importe quelle route de l'app.
 * Chaque action sensible doit donc revérifier le rôle elle-même.
 */

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
};

/** Rôles autorisés à ouvrir le back-office. */
export const STAFF_ROLES: Role[] = ["ADMIN", "RH", "TUTOR"];

/** Rôles autorisés à modifier un dossier (statut, évaluation, tuteur, purge). */
export const MANAGER_ROLES: Role[] = ["ADMIN", "RH"];

export class AuthorizationError extends Error {
  constructor(message = "Accès non autorisé.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const email = session?.user?.email;
  const role = session?.user?.role;

  if (!email || !role) return null;

  // L'id vient du JWT ; il est absent des anciennes sessions, d'où le repli.
  const id = session?.user?.id ?? "";
  return { id, email, role: role as Role };
}

/**
 * Exige une session dont le rôle fait partie de `roles`.
 * @throws AuthorizationError si la session est absente ou le rôle insuffisant.
 */
export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || !roles.includes(user.role)) {
    throw new AuthorizationError();
  }
  return user;
}

/** Membre du back-office (ADMIN, RH ou TUTOR) — lecture des dossiers. */
export async function requireStaff(): Promise<SessionUser> {
  return requireRole(STAFF_ROLES);
}

/** Gestionnaire RH ou administrateur — écriture sur les dossiers. */
export async function requireManager(): Promise<SessionUser> {
  return requireRole(MANAGER_ROLES);
}

/**
 * Administrateur uniquement.
 *
 * Réservé aux réglages qui engagent l'entreprise au-delà d'un dossier — la
 * griffe de signature et le cachet, par exemple : installer une griffe permet
 * d'apposer la signature de la direction sur tout document délivré ensuite.
 */
export async function requireAdmin(): Promise<SessionUser> {
  return requireRole(["ADMIN"]);
}

/** Session candidat authentifiée. */
export async function requireCandidate(): Promise<SessionUser> {
  return requireRole(["CANDIDATE"]);
}
