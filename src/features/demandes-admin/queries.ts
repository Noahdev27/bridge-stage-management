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

/**
 * Récupère les candidatures filtrées pour la table principale.
 * Un tuteur ne voit que les dossiers qui lui sont affectés.
 */
export async function getCandidatures(
  filters: CandidatureListFilters = {},
  viewer?: SessionUser
) {
  try {
    const whereClause: Prisma.InternshipRequestWhereInput = {};

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.type) {
      whereClause.type = filters.type;
    }

    if (filters.from || filters.to) {
      whereClause.createdAt = {};
      if (filters.from) {
        whereClause.createdAt.gte = new Date(`${filters.from}T00:00:00`);
      }
      if (filters.to) {
        const end = new Date(`${filters.to}T00:00:00`);
        end.setDate(end.getDate() + 1);
        whereClause.createdAt.lt = end;
      }
    }

    if (filters.tutorId) {
      whereClause.tutorId = filters.tutorId;
    }

    if (filters.reportRequired === "true") {
      whereClause.reportRequired = true;
    } else if (filters.reportRequired === "false") {
      whereClause.reportRequired = false;
    }

    if (viewer?.role === "TUTOR") {
      whereClause.tutorId = viewer.id;
    }

    const candidatures = await prisma.internshipRequest.findMany({
      where: whereClause,
      include: {
        profile: true,
        tutor: { select: { id: true, name: true, email: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return candidatures.map((req) => ({
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
    }));
  } catch (error) {
    console.error("[queries] Erreur lors de la récupération des candidatures:", error);
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