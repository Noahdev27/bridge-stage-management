import { prisma } from "@/shared/db/prisma";
import { RequestStatus, type Prisma } from "@prisma/client";
import type { SessionUser } from "@/shared/auth/guards";
import type { CandidatureListFilters } from "./schema";

/**
 * `received` = toutes les demandes reçues sur la période (cf. CDC : « demandes
 * reçues / traitées / acceptées / rejetées »), `pending` = celles encore en
 * attente d'un premier traitement.
 */
export type RequestStats = {
  received: number;
  pending: number;
  processed: number;
  accepted: number;
  rejected: number;
};

const EMPTY_STATS: RequestStats = {
  received: 0,
  pending: 0,
  processed: 0,
  accepted: 0,
  rejected: 0,
};

export type MonthlyStats = {
  month: number;
  label: string;
  stats: RequestStats;
};

const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function getPeriodBounds(year: number, month?: number) {
  if (month !== undefined) {
    return {
      start: new Date(year, month - 1, 1),
      end: new Date(year, month, 1),
    };
  }

  return {
    start: new Date(year, 0, 1),
    end: new Date(year + 1, 0, 1),
  };
}

function buildStatsFromCounts(
  counts: Partial<Record<RequestStatus, number>>
): RequestStats {
  const pending = counts.PENDING ?? 0;
  const processed = counts.PROCESS ?? 0;
  const accepted = counts.ACCEPTED ?? 0;
  const rejected = counts.REJECTED ?? 0;

  return {
    received: pending + processed + accepted + rejected,
    pending,
    processed,
    accepted,
    rejected,
  };
}

function aggregateByStatus(
  rows: { status: RequestStatus; createdAt: Date }[],
  month?: number
): RequestStats {
  const filtered =
    month !== undefined
      ? rows.filter((row) => row.createdAt.getMonth() === month - 1)
      : rows;

  const counts: Partial<Record<RequestStatus, number>> = {};
  for (const row of filtered) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }

  return buildStatsFromCounts(counts);
}

export async function getStatsAvailableYears(): Promise<number[]> {
  try {
    const bounds = await prisma.internshipRequest.aggregate({
      _min: { createdAt: true },
      _max: { createdAt: true },
    });

    const currentYear = new Date().getFullYear();
    if (!bounds._min.createdAt || !bounds._max.createdAt) {
      return [currentYear];
    }

    const minYear = bounds._min.createdAt.getFullYear();
    const maxYear = Math.max(bounds._max.createdAt.getFullYear(), currentYear);
    return Array.from({ length: maxYear - minYear + 1 }, (_, index) => maxYear - index);
  } catch (error) {
    console.error("[queries] Erreur lors de la récupération des années:", error);
    return [new Date().getFullYear()];
  }
}

export async function getRequestStats(
  year: number,
  month?: number
): Promise<RequestStats> {
  try {
    const { start, end } = getPeriodBounds(year, month);
    const groups = await prisma.internshipRequest.groupBy({
      by: ["status"],
      where: { createdAt: { gte: start, lt: end } },
      _count: { _all: true },
    });

    const counts = Object.fromEntries(
      groups.map((group) => [group.status, group._count._all])
    ) as Partial<Record<RequestStatus, number>>;

    return buildStatsFromCounts(counts);
  } catch (error) {
    console.error("[queries] Erreur lors du calcul des statistiques:", error);
    return EMPTY_STATS;
  }
}

export async function getMonthlyStatsBreakdown(year: number): Promise<MonthlyStats[]> {
  try {
    const { start, end } = getPeriodBounds(year);
    const rows = await prisma.internshipRequest.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: { status: true, createdAt: true },
    });

    return MONTH_LABELS.map((label, index) => ({
      month: index + 1,
      label,
      stats: aggregateByStatus(rows, index + 1),
    }));
  } catch (error) {
    console.error("[queries] Erreur lors du regroupement mensuel:", error);
    return MONTH_LABELS.map((label, index) => ({
      month: index + 1,
      label,
      stats: EMPTY_STATS,
    }));
  }
}

/** Nombre de candidatures par page dans la liste du back-office. */
export const CANDIDATURES_PAGE_SIZE = 25;

/** Filtres communs à la liste et au compteur, hors pagination. */
function buildCandidatureWhere(
  filters: CandidatureListFilters,
  viewer?: SessionUser
): Prisma.InternshipRequestWhereInput {
  const where: Prisma.InternshipRequestWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  if (filters.tutorId) where.tutorId = filters.tutorId;
  if (filters.offerId) where.offerId = filters.offerId;

  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) {
      where.createdAt.gte = new Date(`${filters.from}T00:00:00`);
    }
    if (filters.to) {
      const end = new Date(`${filters.to}T00:00:00`);
      end.setDate(end.getDate() + 1);
      where.createdAt.lt = end;
    }
  }

  if (filters.reportRequired === "true") where.reportRequired = true;
  else if (filters.reportRequired === "false") where.reportRequired = false;

  if (filters.q) {
    const terms = filters.q.split(/\s+/).filter(Boolean).slice(0, 4);
    // Chaque mot doit se retrouver quelque part : « marie fotso » trouve
    // Marie Fotso, que le prénom et le nom soient dans un ordre ou l'autre.
    where.AND = terms.map((term) => ({
      OR: [
        { profile: { firstName: { contains: term, mode: "insensitive" } } },
        { profile: { lastName: { contains: term, mode: "insensitive" } } },
        { profile: { email: { contains: term, mode: "insensitive" } } },
        {
          trackingCode: {
            contains: term.replace(/[^0-9a-z]/gi, "").toUpperCase(),
          },
        },
      ],
    }));
  }

  if (viewer?.role === "TUTOR") {
    where.tutorId = viewer.id;
  }

  return where;
}

/**
 * Récupère une page de candidatures filtrées pour la table principale.
 * Un tuteur ne voit que les dossiers qui lui sont affectés.
 */
export async function getCandidatures(
  filters: CandidatureListFilters = {},
  viewer?: SessionUser
) {
  const where = buildCandidatureWhere(filters, viewer);
  const requestedPage = filters.page ?? 1;

  try {
    const total = await prisma.internshipRequest.count({ where });
    const pageCount = Math.max(1, Math.ceil(total / CANDIDATURES_PAGE_SIZE));
    const page = Math.min(requestedPage, pageCount);

    const candidatures = await prisma.internshipRequest.findMany({
      where,
      include: {
        profile: true,
        tutor: { select: { id: true, name: true, email: true } },
        offer: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * CANDIDATURES_PAGE_SIZE,
      take: CANDIDATURES_PAGE_SIZE,
    });

    return {
      total,
      page,
      pageCount,
      items: candidatures.map((req) => ({
        id: req.id,
        firstName: req.profile.firstName,
        lastName: req.profile.lastName,
        email: req.profile.email,
        internshipType: req.type,
        createdAt: req.createdAt,
        startDate: req.startDate,
        status: req.status,
        reportRequired: req.reportRequired,
        tutorName: req.tutor?.name || req.tutor?.email || null,
        tutorId: req.tutorId,
        offerTitle: req.offer?.title ?? null,
      })),
    };
  } catch (error) {
    console.error("[queries] Erreur lors de la récupération des candidatures:", error);
    return { total: 0, page: 1, pageCount: 1, items: [] };
  }
}

/**
 * Dossiers en attente dont la date de début arrive sous `days` jours (ou est
 * dépassée), sur l'ensemble de la base et non sur la seule page affichée.
 */
export async function countUrgentCandidatures(
  days: number,
  viewer?: SessionUser
): Promise<number> {
  const today = new Date();
  const limit = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days + 1);
  try {
    return await prisma.internshipRequest.count({
      where: {
        status: "PENDING",
        startDate: { lt: limit },
        ...(viewer?.role === "TUTOR" ? { tutorId: viewer.id } : {}),
      },
    });
  } catch (error) {
    console.error("[queries] Erreur lors du décompte des dossiers urgents:", error);
    return 0;
  }
}

/** Offres proposées dans le filtre de la liste (y compris dépubliées). */
export async function getOfferOptions() {
  try {
    return await prisma.internshipOffer.findMany({
      select: { id: true, title: true, isPublished: true },
      orderBy: [{ isPublished: "desc" }, { createdAt: "desc" }],
    });
  } catch (error) {
    console.error("[queries] Erreur lors de la récupération des offres:", error);
    return [];
  }
}

export async function getTutors() {
  try {
    return await prisma.user.findMany({
      where: { role: "TUTOR" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("[queries] Erreur lors de la récupération des tuteurs:", error);
    return [];
  }
}

export async function countRejectedEligibleForPurge(months: number): Promise<number> {
  try {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    return await prisma.internshipRequest.count({
      where: {
        status: "REJECTED",
        updatedAt: { lte: cutoff },
      },
    });
  } catch (error) {
    console.error("[queries] Erreur lors du décompte des dossiers à purger:", error);
    return 0;
  }
}

/**
 * Récupère le dossier complet d'un candidat unique grâce à son ID (Profil + Demande + Documents).
 * Un tuteur ne peut ouvrir que les dossiers qui lui sont affectés.
 */
export async function getCandidatureById(id: string, viewer?: SessionUser) {
  try {
    const candidature = await prisma.internshipRequest.findFirst({
      where: {
        id,
        ...(viewer?.role === "TUTOR" ? { tutorId: viewer.id } : {}),
      },
      include: {
        profile: true,
        documents: true,
        tutor: { select: { id: true, name: true, email: true } },
        offer: true,
        evaluation: {
          include: {
            author: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    return candidature;
  } catch (error) {
    console.error(`[queries] Erreur lors de la récupération de la candidature ${id}:`, error);
    return null;
  }
}