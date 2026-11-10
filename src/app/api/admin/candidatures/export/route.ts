import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/shared/db/prisma";
import { AuthorizationError, requireManager } from "@/shared/auth/guards";
import { recordAudit } from "@/shared/audit/audit";
import { STATUS_LABELS, TYPE_LABELS } from "@/shared/constants/domain";
import { formatTrackingCode } from "@/shared/tracking/tracking-code";
import { parseCandidatureListFilters } from "@/features/demandes-admin/schema";
import { buildCandidatureWhere } from "@/features/demandes-admin/queries";
import { toCsv } from "@/features/demandes-admin/csv";

/**
 * Export CSV (Excel) des candidatures, avec les filtres de la liste.
 *
 * Réservé aux gestionnaires (ADMIN, RH) : le fichier contient les données
 * personnelles de tous les candidats filtrés et quitte la plateforme. Chaque
 * export est donc consigné au journal d'audit.
 */

/** Plafond de sécurité : au-delà, il faut affiner les filtres. */
const MAX_ROWS = 5000;

function day(date: Date | null): string {
  return date ? date.toLocaleDateString("fr-FR", { timeZone: "Africa/Douala" }) : "";
}

export async function GET(request: NextRequest) {
  let viewer;
  try {
    viewer = await requireManager();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }
    throw error;
  }

  const filters = parseCandidatureListFilters(
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );
  // La pagination de l'écran ne s'applique pas : on exporte tout le filtre.
  const where = buildCandidatureWhere({ ...filters, page: undefined }, viewer);

  const requests = await prisma.internshipRequest.findMany({
    where,
    include: {
      profile: true,
      tutor: { select: { name: true, email: true } },
      offer: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
  });

  const csv = toCsv(
    [
      "Code de suivi",
      "Déposée le",
      "Statut",
      "Type de stage",
      "Offre",
      "Nom",
      "Prénom",
      "Email",
      "Téléphone",
      "Lieu-dit",
      "École",
      "Filière",
      "Niveau",
      "Début souhaité",
      "Durée (mois)",
      "Rapport exigé",
      "Tuteur",
      "Référence attestation",
    ],
    requests.map((req) => [
      formatTrackingCode(req.trackingCode),
      day(req.createdAt),
      STATUS_LABELS[req.status],
      TYPE_LABELS[req.type],
      req.offer?.title ?? "Candidature spontanée",
      req.profile.lastName,
      req.profile.firstName,
      req.profile.email,
      req.profile.phone,
      req.profile.lieudit,
      req.profile.school,
      req.profile.field,
      req.profile.level,
      day(req.startDate),
      req.duration,
      req.reportRequired ? "Oui" : "Non",
      req.tutor?.name || req.tutor?.email || "",
      req.attestationRef ?? "",
    ])
  );

  // Les filtres sont consignés, sauf la recherche libre : elle contient
  // souvent un nom de candidat, qui n'a pas sa place dans le journal.
  const loggedFilters = { ...filters, q: undefined, page: undefined };
  await recordAudit(viewer, {
    action: "request.exported",
    summary: `Export CSV de ${requests.length} candidature(s)`,
    metadata: {
      count: requests.length,
      filters: JSON.parse(JSON.stringify(loggedFilters)),
      withSearch: !!filters.q,
    },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="candidatures-${stamp}.csv"`,
      // Données personnelles : ni cache navigateur ni cache intermédiaire.
      "Cache-Control": "no-store",
    },
  });
}
