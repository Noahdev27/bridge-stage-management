import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { ATTESTATION_REF_PREFIX } from "./constants";

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
      profile: { email: candidateEmail },
    },
    include: {
      profile: true,
      tutor: { select: { name: true, email: true } },
    },
  });
}
