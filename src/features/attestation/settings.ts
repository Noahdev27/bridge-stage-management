import "server-only";

import { prisma } from "@/shared/db/prisma";
import { downloadAsDataUri } from "@/shared/storage/supabase";

/**
 * Griffe de signature et cachet apposés sur les attestations.
 *
 * Une seule ligne en base (`id = "singleton"`) : ces images valent pour toute
 * l'entreprise.
 */

const SINGLETON_ID = "singleton";

export type AttestationSettings = {
  signaturePath: string | null;
  stampPath: string | null;
  updatedByEmail: string | null;
  updatedAt: Date | null;
};

const EMPTY: AttestationSettings = {
  signaturePath: null,
  stampPath: null,
  updatedByEmail: null,
  updatedAt: null,
};

export async function getAttestationSettings(): Promise<AttestationSettings> {
  const row = await prisma.attestationSettings.findUnique({
    where: { id: SINGLETON_ID },
  });

  if (!row) return EMPTY;

  return {
    signaturePath: row.signaturePath,
    stampPath: row.stampPath,
    updatedByEmail: row.updatedByEmail,
    updatedAt: row.updatedAt,
  };
}

/** Écrit la ligne unique, en la créant à la première installation. */
export async function saveAttestationSettings(
  data: { signaturePath?: string | null; stampPath?: string | null },
  updatedByEmail: string
): Promise<void> {
  await prisma.attestationSettings.upsert({
    where: { id: SINGLETON_ID },
    create: {
      id: SINGLETON_ID,
      signaturePath: data.signaturePath ?? null,
      stampPath: data.stampPath ?? null,
      updatedByEmail,
    },
    update: { ...data, updatedByEmail },
  });
}

export type AttestationBranding = {
  signatureDataUri: string | null;
  stampDataUri: string | null;
};

/**
 * Charge les griffes prêtes à être inlinées dans le document.
 *
 * Une griffe illisible ne doit pas empêcher de délivrer l'attestation : le
 * document part alors sans elle, à signer à la main comme avant.
 */
export async function loadAttestationBranding(): Promise<AttestationBranding> {
  const settings = await getAttestationSettings();

  const [signatureDataUri, stampDataUri] = await Promise.all([
    settings.signaturePath ? downloadAsDataUri(settings.signaturePath) : null,
    settings.stampPath ? downloadAsDataUri(settings.stampPath) : null,
  ]);

  return { signatureDataUri, stampDataUri };
}
