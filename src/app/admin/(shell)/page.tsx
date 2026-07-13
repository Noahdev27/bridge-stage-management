import { auth } from "@/shared/auth/auth";
import { redirect } from "next/navigation";
import {
  getCandidatures,
  getMonthlyStatsBreakdown,
  getRequestStats,
  getStatsAvailableYears,
} from "@/features/demandes-admin/queries";
import { StatusFilter } from "@/features/demandes-admin/components/StatusFilter";
import { PeriodFilter } from "@/features/demandes-admin/components/PeriodFilter";
import { StatsDashboard } from "@/features/demandes-admin/components/StatsDashboard";
import Link from "next/link";
import { GraduationCap, Briefcase, ArrowRight } from "lucide-react";
import { STATUS_LABELS } from "@/shared/constants/domain";
import type { RequestStatus } from "@prisma/client";

interface AdminPageProps {
  searchParams: Promise<{ status?: string; year?: string; month?: string }>;
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

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = parseYear(params.year, currentYear);
  const month = parseMonth(params.month);

  const [candidatures, stats, monthlyBreakdown, years] = await Promise.all([
    getCandidatures(params.status),
    getRequestStats(year, month),
    getMonthlyStatsBreakdown(year),
    getStatsAvailableYears(),
  ]);

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

      <div>
        <h2 className="text-xl font-bold mb-4">Liste des candidatures</h2>
        <StatusFilter />

        <div className="overflow-x-auto border border-base-300 rounded-xl bg-base-100 shadow-sm">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200/50">
                <th>Candidat</th>
                <th>Type de Stage</th>
                <th>Date de Soumission</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidatures.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-base-content/50">
                    Aucune candidature trouvée pour ce statut.
                  </td>
                </tr>
              ) : (
                candidatures.map((cand) => (
                  <tr key={cand.id} className="hover">
                    <td>
                      <div className="font-bold">
                        {cand.firstName} {cand.lastName}
                      </div>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
