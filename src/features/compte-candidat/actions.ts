"use server";

import bcrypt from "bcryptjs";
import { AuthError, CredentialsSignin } from "next-auth";
import { prisma } from "@/shared/db/prisma";
import {
  candidateRegisterSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  resendVerificationSchema,
} from "./schema";
import { issueEmailVerification } from "./verification";
import { consumePasswordReset, issuePasswordReset } from "./password-reset";
import { revalidatePath } from "next/cache";
import { auth, signIn, signOut, TOO_MANY_ATTEMPTS_CODE } from "@/shared/auth/auth";
import { AuthorizationError, requireCandidate } from "@/shared/auth/guards";
import { recordAudit } from "@/shared/audit/audit";
import { deleteRequestWithFiles } from "@/features/demandes-admin/purge";
import {
  RATE_LIMITS,
  consumeRateLimit,
  currentClientIp,
  formatRetryAfter,
} from "@/shared/security/rate-limit";

export type CandidateActionState = {
  error?: string;
  success?: boolean;
  /** Renseigné après une inscription : l'espace n'est pas encore accessible. */
  verificationSent?: boolean;
};

export async function registerCandidate(
  _prev: CandidateActionState,
  formData: FormData
): Promise<CandidateActionState> {
  const limit = await consumeRateLimit(RATE_LIMITS.emailFormsPerIp, await currentClientIp());
  if (!limit.allowed) {
    return {
      error: `Trop de demandes depuis votre connexion. Réessayez ${formatRetryAfter(limit.retryAfterSeconds)}.`,
    };
  }

  const parsed = candidateRegisterSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, role: true, emailVerifiedAt: true },
  });

  // Un compte vérifié appartient à quelqu'un : on ne le touche pas.
  if (existing && (existing.emailVerifiedAt || existing.role !== "CANDIDATE")) {
    return { error: "Un compte existe déjà avec cet email." };
  }

  const password = await bcrypt.hash(parsed.data.password, 10);
  const name = `${parsed.data.firstName} ${parsed.data.lastName}`;

  // Le compte est créé NON vérifié : `emailVerifiedAt` reste nul jusqu'au clic
  // sur le lien envoyé à l'adresse déclarée. Tant qu'il l'est, la connexion est
  // refusée et aucun dossier n'est consultable.
  //
  // Un compte candidat non vérifié est réinscriptible : ses identifiants sont
  // écrasés et un nouveau jeton est émis. Sans cela, quiconque s'inscrirait avec
  // l'adresse d'un candidat la lui confisquerait — le compte squatté resterait
  // inutilisable, mais le titulaire ne pourrait plus jamais créer le sien.
  // Écraser est sans risque : seul celui qui relève l'adresse peut valider.
  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { password, name },
        select: { id: true, email: true, name: true },
      })
    : await prisma.user.create({
        data: {
          email: parsed.data.email,
          password,
          name,
          role: "CANDIDATE",
        },
        select: { id: true, email: true, name: true },
      });

  await issueEmailVerification(user);

  return { success: true, verificationSent: true };
}

export async function loginCandidate(
  formData: FormData
): Promise<CandidateActionState | void> {
  const email = formData.get("email");

  // Message explicite pour un compte non vérifié : `authorize()` refuserait la
  // connexion avec une erreur d'identifiants, trompeuse dans ce cas. Le contrôle
  // qui fait autorité reste celui de `shared/auth/auth.ts`.
  if (typeof email === "string" && email) {
    const account = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { role: true, emailVerifiedAt: true },
    });

    if (account?.role === "CANDIDATE" && !account.emailVerifiedAt) {
      return {
        error:
          "Adresse email non confirmée. Ouvrez le lien reçu par email, ou demandez un nouvel envoi ci-dessous.",
      };
    }
  }

  try {
    await signIn("credentials", {
      email,
      password: formData.get("password"),
      redirectTo: "/espace-candidat",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      if (err instanceof CredentialsSignin && err.code === TOO_MANY_ATTEMPTS_CODE) {
        return {
          error: "Trop de tentatives échouées. Réessayez dans 15 minutes.",
        };
      }
      return { error: "Email ou mot de passe incorrect." };
    }
    throw err;
  }
}

/**
 * Renvoie l'email de vérification. Sans cette porte de sortie, un candidat dont
 * l'email s'est perdu resterait bloqué définitivement.
 *
 * La réponse est toujours la même, qu'un compte existe ou non : ce formulaire
 * public ne doit pas permettre de tester si une adresse est inscrite.
 */
export async function resendVerification(
  _prev: CandidateActionState,
  formData: FormData
): Promise<CandidateActionState> {
  const limit = await consumeRateLimit(RATE_LIMITS.emailFormsPerIp, await currentClientIp());
  if (!limit.allowed) {
    return {
      error: `Trop de demandes depuis votre connexion. Réessayez ${formatRetryAfter(limit.retryAfterSeconds)}.`,
    };
  }

  const parsed = resendVerificationSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Email invalide." };
  }

  const account = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerifiedAt: true,
      verificationTokenExpiresAt: true,
    },
  });

  if (account && account.role === "CANDIDATE" && !account.emailVerifiedAt) {
    // Throttlé : ce point d'entrée est public, il ne doit pas servir à inonder
    // la boîte d'un tiers.
    await issueEmailVerification(account, { throttle: true });
  }

  return { success: true };
}

/**
 * Envoie un lien de réinitialisation de mot de passe.
 *
 * La réponse est toujours la même, qu'un compte existe ou non : ce formulaire
 * public ne doit pas permettre de tester si une adresse est inscrite.
 */
export async function requestPasswordReset(
  _prev: CandidateActionState,
  formData: FormData
): Promise<CandidateActionState> {
  const limit = await consumeRateLimit(RATE_LIMITS.emailFormsPerIp, await currentClientIp());
  if (!limit.allowed) {
    return {
      error: `Trop de demandes depuis votre connexion. Réessayez ${formatRetryAfter(limit.retryAfterSeconds)}.`,
    };
  }

  const parsed = passwordResetRequestSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Email invalide." };
  }

  const account = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerifiedAt: true,
      passwordResetTokenExpiresAt: true,
    },
  });

  // Réservé aux comptes candidats déjà confirmés : voir `password-reset.ts`
  // pour le détail des comptes volontairement exclus de ce parcours.
  if (account && account.role === "CANDIDATE" && account.emailVerifiedAt) {
    await issuePasswordReset(account);
  }

  return { success: true };
}

/** Valide le jeton reçu par email et enregistre le nouveau mot de passe. */
export async function resetPassword(
  _prev: CandidateActionState,
  formData: FormData
): Promise<CandidateActionState> {
  const parsed = passwordResetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const outcome = await consumePasswordReset(
    parsed.data.token,
    parsed.data.password
  );

  if (outcome === "expired") {
    return {
      error:
        "Ce lien a dépassé sa durée de validité d'une heure. Demandez-en un nouveau.",
    };
  }

  if (outcome === "invalid") {
    return {
      error:
        "Ce lien est incorrect ou a déjà été utilisé. Demandez-en un nouveau.",
    };
  }

  return { success: true };
}

export async function getCandidateRequests() {
  const session = await auth();
  if (!session?.user?.email || session.user.role !== "CANDIDATE") {
    return [];
  }

  // Le rôle vient du JWT, qui survit à un déploiement : on revérifie en base que
  // l'adresse est bien confirmée, sinon une session ouverte avant la mise en
  // place de la vérification donnerait encore accès aux dossiers.
  const account = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { emailVerifiedAt: true },
  });

  if (!account?.emailVerifiedAt) {
    return [];
  }

  return prisma.internshipRequest.findMany({
    // Insensible à la casse : le compte est enregistré en minuscules, le
    // dossier avec l'adresse telle que saisie dans le formulaire.
    where: {
      profile: { email: { equals: session.user.email, mode: "insensitive" } },
    },
    include: { profile: true },
    orderBy: { createdAt: "desc" },
  });
}

/** Indique si la session candidat courante a une adresse confirmée. */
export async function isCandidateEmailVerified(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.email || session.user.role !== "CANDIDATE") return false;

  const account = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { emailVerifiedAt: true },
  });

  return !!account?.emailVerifiedAt;
}

/**
 * Auteur des actions d'un candidat dans le journal d'audit. Son adresse n'y
 * est pas écrite : le journal n'est jamais purgé, il conserverait sinon une
 * donnée personnelle au-delà de la suppression du dossier.
 */
const CANDIDATE_ACTOR = { email: "candidat", role: "CANDIDATE" } as const;

/** Statuts d'une candidature que son auteur peut encore retirer. */
const WITHDRAWABLE = ["PENDING", "PROCESS"] as const;

async function requireVerifiedCandidate() {
  const candidate = await requireCandidate();
  const account = await prisma.user.findUnique({
    where: { email: candidate.email },
    select: { emailVerifiedAt: true },
  });
  if (!account?.emailVerifiedAt) throw new AuthorizationError();
  return candidate;
}

/**
 * Retrait d'une candidature par son auteur.
 *
 * Possible tant que la RH n'a pas rendu sa décision. Le dossier est effacé
 * entièrement (données et fichiers), comme le ferait la purge RGPD : un
 * candidat qui se retire ne doit laisser aucune trace personnelle.
 */
export async function withdrawCandidature(
  requestId: string
): Promise<CandidateActionState> {
  try {
    const candidate = await requireVerifiedCandidate();

    const request = await prisma.internshipRequest.findFirst({
      where: {
        id: requestId,
        status: { in: [...WITHDRAWABLE] },
        profile: { email: { equals: candidate.email, mode: "insensitive" } },
      },
      include: { documents: true },
    });

    if (!request) {
      return {
        error:
          "Cette candidature ne peut plus être retirée : une décision a déjà été rendue.",
      };
    }

    await deleteRequestWithFiles(request);
    await recordAudit(CANDIDATE_ACTOR, {
      action: "request.withdrawn",
      summary: "Candidature retirée par le candidat",
      targetType: "request",
      targetId: request.id,
    });

    revalidatePath("/espace-candidat");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { error: "Accès non autorisé." };
    }
    console.error("[compte-candidat] Échec du retrait de candidature:", error);
    return { error: "Une erreur est survenue. Veuillez réessayer." };
  }
}

/**
 * Suppression du compte candidat par son titulaire.
 *
 * Les candidatures encore en attente ou en traitement sont retirées avec lui.
 * Les dossiers ayant reçu une décision restent du ressort de la RH : un
 * dossier refusé est effacé par la purge RGPD, un dossier accepté sert à la
 * délivrance de l'attestation.
 */
export async function deleteCandidateAccount(): Promise<CandidateActionState | void> {
  try {
    const candidate = await requireVerifiedCandidate();

    const pending = await prisma.internshipRequest.findMany({
      where: {
        status: { in: [...WITHDRAWABLE] },
        profile: { email: { equals: candidate.email, mode: "insensitive" } },
      },
      include: { documents: true },
    });
    for (const request of pending) {
      await deleteRequestWithFiles(request);
    }

    await prisma.user.deleteMany({
      where: { email: candidate.email, role: "CANDIDATE" },
    });

    await recordAudit(CANDIDATE_ACTOR, {
      action: "account.candidate_deleted",
      summary: `Compte candidat supprimé par son titulaire (${pending.length} candidature(s) en cours retirée(s))`,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { error: "Accès non autorisé." };
    }
    console.error("[compte-candidat] Échec de suppression du compte:", error);
    return { error: "Une erreur est survenue. Veuillez réessayer." };
  }

  // Hors du try : la redirection de signOut est une exception volontaire.
  await signOut({ redirectTo: "/?compte=supprime" });
}
