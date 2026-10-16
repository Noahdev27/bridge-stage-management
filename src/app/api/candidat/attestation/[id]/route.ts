import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/shared/db/prisma";
import { AuthorizationError, requireCandidate } from "@/shared/auth/guards";
import { renderAttestationHtml } from "@/features/attestation/document";
import { getCandidateAttestation } from "@/features/attestation/queries";
import { loadAttestationBranding } from "@/features/attestation/settings";

/**
 * Téléchargement de l'attestation par le stagiaire lui-même.
 *
 * Volontairement distincte de la route RH : celle-ci est en lecture seule et
 * n'attribue jamais de référence. Un candidat ne peut donc récupérer que le
 * document que l'entreprise a effectivement délivré — la garde complète est
 * dans `getCandidateAttestation`.
 *
 * Réservée au compte candidat : le code de suivi seul n'y donne pas accès. Il
 * circule par email et sert à consulter un statut, pas à obtenir une pièce
 * nominative signée.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const candidate = await requireCandidate();

    // Le rôle vient du JWT, qui survit à un déploiement : on revérifie en base
    // que l'adresse est confirmée, comme dans l'espace candidat.
    const account = await prisma.user.findUnique({
      where: { email: candidate.email },
      select: { emailVerifiedAt: true },
    });

    if (!account?.emailVerifiedAt) {
      return NextResponse.json(
        { error: "Adresse email non confirmée." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const internship = await getCandidateAttestation(id, candidate.email);

    // Réponse unique que le dossier n'existe pas, ne lui appartienne pas ou ne
    // soit pas encore attesté : distinguer ces cas révélerait l'existence de
    // dossiers tiers.
    if (!internship || !internship.attestationRef) {
      return NextResponse.json(
        { error: "Aucune attestation disponible pour ce dossier." },
        { status: 404 }
      );
    }

    const branding = await loadAttestationBranding();

    const html = renderAttestationHtml(internship, {
      reference: internship.attestationRef,
      issuedAt: internship.attestationIssuedAt ?? internship.updatedAt,
      branding,
      verificationCode: internship.trackingCode,
      autoPrint: request.nextUrl.searchParams.get("print") === "1",
    });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // Document nominatif : jamais mis en cache par un intermédiaire.
        "Cache-Control": "no-store, private",
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 401 });
    }
    console.error("[attestation-candidat] Erreur lors de la délivrance:", error);
    return NextResponse.json(
      { error: "Impossible d'ouvrir l'attestation." },
      { status: 500 }
    );
  }
}
