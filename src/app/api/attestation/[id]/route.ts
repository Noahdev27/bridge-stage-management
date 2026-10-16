import { NextResponse, type NextRequest } from "next/server";
import { AuthorizationError, requireManager } from "@/shared/auth/guards";
import { renderAttestationHtml } from "@/features/attestation/document";
import {
  ensureAttestationRef,
  getAttestationRequest,
} from "@/features/attestation/queries";
import { loadAttestationBranding } from "@/features/attestation/settings";

/**
 * Délivre l'attestation de stage d'un dossier accepté.
 *
 * Réservée à la RH : le document engage l'entreprise. La référence est attribuée
 * à la première délivrance puis réutilisée, pour qu'une réimpression porte le
 * même numéro que l'original remis au stagiaire.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireManager();
    const { id } = await params;

    const internship = await getAttestationRequest(id);

    if (!internship) {
      return NextResponse.json(
        { error: "Candidature introuvable." },
        { status: 404 }
      );
    }

    if (internship.status !== "ACCEPTED") {
      return NextResponse.json(
        {
          error:
            "Seule une candidature acceptée peut donner lieu à une attestation.",
        },
        { status: 409 }
      );
    }

    if (!internship.endDate) {
      return NextResponse.json(
        {
          error:
            "Renseignez la date de fin du stage avant de délivrer l'attestation.",
        },
        { status: 409 }
      );
    }

    const issuedAt = internship.attestationIssuedAt ?? new Date();
    const [reference, branding] = await Promise.all([
      ensureAttestationRef(id, issuedAt),
      loadAttestationBranding(),
    ]);

    const html = renderAttestationHtml(internship, {
      reference,
      issuedAt,
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
    console.error("[attestation] Erreur lors de la délivrance:", error);
    return NextResponse.json(
      { error: "Impossible de générer l'attestation." },
      { status: 500 }
    );
  }
}
