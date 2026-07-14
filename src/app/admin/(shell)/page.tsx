import { auth } from "@/shared/auth/auth";
import { redirect } from "next/navigation";
import {
  countRejectedEligibleForPurge,
  getCandidatures,
  getMonthlyStatsBreakdown,
  getRequestStats,
  getStatsAvailableYears,
  getTutors,
} from "@/features/demandes-admin/queries";
import { CandidatureFilters } from "@/features/demandes-admin/components/CandidatureFilters";
import { parseCandidatureListFilters } from "@/features/demandes-admin/schema";
import { PeriodFilter } from "@/features/demandes-admin/components/PeriodFilter";
import { StatsDashboard } from "@/features/demandes-admin/components/StatsDashboard";
import { PurgeRejectedPanel } from "@/features/demandes-admin/components/PurgeRejectedPanel";
import { daysUntil, isStartDateAlert } from "@/features/demandes-admin/deadline";
import Link from "next/link";
import { GraduationCap, Briefcase, ArrowRight, TriangleAlert } from "lucide-react";
import {
  REJECTED_PURGE_MONTHS,
  START_DATE_ALERT_DAYS,
  STATUS_LABELS,
} from "@/shared/constants/domain";
import type { RequestStatus } from "@prisma/client";

interface AdminPageProps {
  searchParams: Promise<{
    status?: string;
    year?: string;
    month?: string;
    type?: string;
    from?: string;
    to?: string;
    tutorId?: string;
    reportRequired?: string;
  }>;
}

function parseYear(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 2000 && parsed <= 2100
    ? parsed
    : fallback;
}

function parseMonth(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 12
    ? parsed
    : undefined;
}

function alertBadgeLabel(startDate: Date): string {
  const remaining = daysUntil(startDate);
  if (remaining < 0) return "En retard";
  if (remaining === 0) return "Début aujourd'hui";
  if (remaining === 1) return "Début demain";
  return `J-${remaining}`;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = parseYear(params.year, currentYear);
  const month = parseMonth(params.month);

  const listFilters = parseCandidatureListFilters(params);

  const [candidatures, stats, monthlyBreakdown, years, purgeEligibleCount, tutors] =
    await Promise.all([
      getCandidatures(listFilters),
      getRequestStats(year, month),
      getMonthlyStatsBreakdown(year),
      getStatsAvailableYears(),
      countRejectedEligibleForPurge(REJECTED_PURGE_MONTHS),
      getTutors(),
    ]);

  const urgentCount = candidatures.filter((cand) =>
    isStartDateAlert(cand.status, cand.startDate, START_DATE_ALERT_DAYS)
  ).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "badge-warning";
      case "PROCESS":
        return "badge-info";
      case "ACCEPTED":
        return "badge-success text-white";
      case "REJECTED":
        return "badge-error text-white";
      default:
        return "badge-ghost";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Demandes de stage</h1>
        <p className="text-base-content/60 mt-1">
          Suivi et traitement des candidatures Bridge Technologies Solutions.
        </p>
      </div>

      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body p-5 gap-5">
          <PeriodFilter
            years={years}
            selectedYear={year}
            selectedMonth={month}
          />
          <StatsDashboard
            stats={stats}
            monthlyBreakdown={monthlyBreakdown}
            year={year}
            month={month}
          />
        </div>
      </div>

      <PurgeRejectedPanel eligibleCount={purgeEligibleCount} />

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-xl font-bold">Liste des candidatures</h2>
          {urgentCount > 0 && (
            <span className="badge badge-warning gap-1.5 font-semibold">
              <TriangleAlert className="w-3.5 h-3.5" aria-hidden="true" />
              {urgentCount} dossier(s) urgent(s) (≤ {START_DATE_ALERT_DAYS}{" "}
              jours)
            </span>
          )}
        </div>
        <CandidatureFilters tutors={tutors} />

        <div className="overflow-x-auto border border-base-300 rounded-xl bg-base-100 shadow-sm">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200/50">
                <th>Candidat</th>
                <th>Type de Stage</th>
                <th>Date de Soumission</th>
                <th>Début souhaité</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidatures.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-base-content/50">
                    Aucune candidature trouvée pour ces critères.
                  </td>
                </tr>
              ) : (
                candidatures.map((cand) => {
                  const urgent = isStartDateAlert(
                    cand.status,
                    cand.startDate,
                    START_DATE_ALERT_DAYS
                  );

                  return (
                    <tr
                      key={cand.id}
                      className={`hover ${urgent ? "bg-warning/10" : ""}`}
                    >
                      <td>
                        <div className="font-bold">
                          {cand.firstName} {cand.lastName}
                        </div>
                        {urgent && (
                          <span className="badge badge-warning badge-sm mt-1 gap-1">
                            <TriangleAlert
                              className="w-3 h-3"
                              aria-hidden="true"
                            />
                            {alertBadgeLabel(cand.startDate)}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          {cand.internshipType === "ACADEMIC" ? (
                            <GraduationCap
                              className="w-4 h-4 text-primary"
                              aria-hidden="true"
                            />
                          ) : (
                            <Briefcase
                              className="w-4 h-4 text-primary"
                              aria-hidden="true"
                            />
                          )}
                          {cand.internshipType === "ACADEMIC"
                            ? "Académique"
                            : "Professionnel"}
                        </span>
                      </td>
                      <td className="text-sm text-base-content/70">
                        {new Date(cand.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="text-sm text-base-content/70">
                        {new Date(cand.startDate).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <span
                          className={`badge ${getStatusBadge(cand.status)} font-semibold px-2.5 py-1`}
                        >
                          {STATUS_LABELS[cand.status as RequestStatus]}
                        </span>
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/admin/${cand.id}`}
                          className="btn btn-sm btn-ghost text-primary hover:bg-primary/10 gap-1"
                        >
                          Voir le dossier
                          <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
