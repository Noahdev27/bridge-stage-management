import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { randomBytes } from "crypto";
import { ATTESTATION_REF_PREFIX } from "./constants";
import { TRACKING_CODE_ALPHABET } from "@/shared/tracking/tracking-code";

/** 12 caractères sur un alphabet de 32 : 60 bits, impossible à deviner. */
export const VERIFY_CODE_LENGTH = 12;

function generateVerifyCode(): string {
  let code = "";
  for (const byte of randomBytes(VERIFY_CODE_LENGTH)) {
    code += TRACKING_CODE_ALPHABET[byte % TRACKING_CODE_ALPHABET.length];
  }
  return code;
}

/**
 * Code de vérification public de l'attestation, attribué une seule fois.
 *
 * Distinct du code de suivi : l'attestation est remise à des tiers (écoles,
 * employeurs), alors que le code de suivi ouvre la page de suivi du dossier.
 * Ce code-ci ne donne accès qu'à la confirmation d'authenticité.
 */
export async function ensureVerifyCode(requestId: string): Promise<string> {
  const existing = await prisma.internshipRequest.findUnique({
    where: { id: requestId },
    select: { attestationVerifyCode: true },
  });
  if (existing?.attestationVerifyCode) return existing.attestationVerifyCode;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateVerifyCode();
    try {
      await prisma.internshipRequest.update({
        where: { id: requestId },
        data: { attestationVerifyCode: code },
      });
      return code;
    } catch (error) {
      const taken =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002";
      if (!taken) throw error;
    }
  }
  throw new Error("Impossible d'attribuer un code de vérification.");
}

/**
 * Attestation correspondant à un code de vérification, pour la page publique.
 * Ne renvoie que ce qu'un tiers doit pouvoir confirmer, rien de plus.
 */
export async function findAttestationByVerifyCode(code: string) {
  const request = await prisma.internshipRequest.findUnique({
    where: { attestationVerifyCode: code },
    select: {
      type: true,
      startDate: true,
      endDate: true,
      attestationRef: true,
      attestationIssuedAt: true,
      status: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  });
  if (!request?.attestationRef || !request.endDate || request.status !== "ACCEPTED") {
    return null;
  }
  return request;
}

/** Dossier complet nécessaire au rendu de l'attestation. */
export async function getAttestationRequest(requestId: string) {
  return prisma.internshipRequest.findUnique({
    where: { id: requestId },
    include: {
      profile: true,
      tutor: { select: { name: true, email: true } },
    },
  });
}

export type AttestationRequest = NonNullable<
  Awaited<ReturnType<typeof getAttestationRequest>>
>;

function formatRef(sequence: number, year: number): string {
  return `N° ${String(sequence).padStart(4, "0")}/${ATTESTATION_REF_PREFIX}/${year}`;
}

/**
 * Attribue une référence d'attestation, une seule fois par dossier.
 *
 * La séquence est annuelle. Deux délivrances simultanées peuvent viser le même
 * numéro : l'index unique sur `attestationRef` tranche, et on réessaie avec le
 * numéro suivant plutôt que d'émettre deux documents portant la même référence.
 */
export async function ensureAttestationRef(
  requestId: string,
  issuedAt: Date
): Promise<string> {
  const existing = await prisma.internshipRequest.findUnique({
    where: { id: requestId },
    select: { attestationRef: true },
  });

  if (existing?.attestationRef) return existing.attestationRef;

  const year = issuedAt.getFullYear();
  const yearPattern = `/${ATTESTATION_REF_PREFIX}/${year}`;

  const issuedThisYear = await prisma.internshipRequest.count({
    where: { attestationRef: { endsWith: yearPattern } },
  });

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const ref = formatRef(issuedThisYear + 1 + attempt, year);
    try {
      await prisma.internshipRequest.update({
        where: { id: requestId },
        data: { attestationRef: ref, attestationIssuedAt: issuedAt },
      });
      return ref;
    } catch (error) {
      const isRefTaken =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002";
      if (!isRefTaken) throw error;
    }
  }

  throw new Error(
    "Impossible d'attribuer une référence d'attestation après 20 tentatives."
  );
}

/**
 * Dossier d'un candidat, pour qu'il télécharge lui-même son attestation.
 *
 * Trois conditions cumulatives, toutes nécessaires :
 * - le dossier appartient bien à l'adresse connectée ;
 * - il est accepté et sa période de stage est renseignée ;
 * - une référence a déjà été attribuée, c'est-à-dire que la RH a réellement
 *   délivré le document. Sans cette dernière, un candidat accepté pourrait
 *   s'auto-délivrer une attestation avant que l'entreprise ne l'ait établie.
 *
 * Cette lecture n'attribue jamais de référence, contrairement au parcours RH.
 */
export async function getCandidateAttestation(
  requestId: string,
  candidateEmail: string
) {
  return prisma.internshipRequest.findFirst({
    where: {
      id: requestId,
      status: "ACCEPTED",
      endDate: { not: null },
      attestationRef: { not: null },
      profile: { email: { equals: candidateEmail, mode: "insensitive" } },
    },
    include: {
      profile: true,
      tutor: { select: { name: true, email: true } },
    },
  });
}
