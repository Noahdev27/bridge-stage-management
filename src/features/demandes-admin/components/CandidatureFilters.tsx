"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Filter, RotateCcw } from "lucide-react";
import { InternshipType } from "@prisma/client";

const STATUS_FILTERS = [
  { label: "Tous", value: "ALL" },
  { label: "En attente", value: "PENDING" },
  { label: "En cours", value: "PROCESS" },
  { label: "Acceptés", value: "ACCEPTED" },
  { label: "Refusés", value: "REJECTED" },
];

const TYPE_FILTERS = [
  { label: "Tous les types", value: "" },
  { label: "Académique", value: InternshipType.ACADEMIC },
  { label: "Professionnel", value: InternshipType.PROFESSIONAL },
];

type TutorOption = { id: string; name: string | null; email: string };

export function CandidatureFilters({ tutors = [] }: { tutors?: TutorOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "ALL";
  const currentType = searchParams.get("type") || "";
  const currentFrom = searchParams.get("from") || "";
  const currentTo = searchParams.get("to") || "";
  const currentTutorId = searchParams.get("tutorId") || "";
  const currentReport = searchParams.get("reportRequired") || "";

  const [from, setFrom] = useState(currentFrom);
  const [to, setTo] = useState(currentTo);

  const pushParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    router.push(`/admin?${params.toString()}`);
  };

  const handleReset = () => {
    setFrom("");
    setTo("");
    const params = new URLSearchParams(searchParams.toString());
    ["status", "type", "from", "to", "tutorId", "reportRequired"].forEach((k) =>
      params.delete(k)
    );
    router.push(`/admin?${params.toString()}`);
  };

  const hasActiveFilters =
    currentStatus !== "ALL" ||
    !!currentType ||
    !!currentFrom ||
    !!currentTo ||
    !!currentTutorId ||
    !!currentReport;

  return (
    <div className="space-y-4 mb-6">
      <div className="tabs tabs-boxed inline-flex bg-base-200 p-1">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() =>
              pushParams({ status: filter.value === "ALL" ? null : filter.value })
            }
            className={`tab tab-sm md:tab-md transition-all ${
              currentStatus === filter.value
                ? "tab-active bg-primary text-primary-content font-semibold"
                : "hover:bg-base-300"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body p-4 gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-base-content/70">
            <Filter className="w-4 h-4 text-primary" aria-hidden="true" />
            Filtres avancés
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <label className="form-control">
              <span className="label py-1">
                <span className="label-text font-semibold">Type de stage</span>
              </span>
              <select
                className="select select-bordered select-sm w-full"
                value={currentType}
                onChange={(e) => pushParams({ type: e.target.value || null })}
              >
                {TYPE_FILTERS.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="label py-1">
                <span className="label-text font-semibold">Tuteur</span>
              </span>
              <select
                className="select select-bordered select-sm w-full"
                value={currentTutorId}
                onChange={(e) => pushParams({ tutorId: e.target.value || null })}
              >
                <option value="">Tous les tuteurs</option>
                {tutors.map((tutor) => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.name || tutor.email}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="label py-1">
                <span className="label-text font-semibold">Rapport à produire</span>
              </span>
              <select
                className="select select-bordered select-sm w-full"
                value={currentReport}
                onChange={(e) =>
                  pushParams({ reportRequired: e.target.value || null })
                }
              >
                <option value="">Tous</option>
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </label>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                pushParams({ from: from || null, to: to || null });
              }}
              className="grid grid-cols-2 gap-2 items-end xl:col-span-1 md:col-span-2"
            >
              <label className="form-control">
                <span className="label py-1">
                  <span className="label-text font-semibold">Du</span>
                </span>
                <input
                  type="date"
                  className="input input-bordered input-sm w-full"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </label>
              <label className="form-control">
                <span className="label py-1">
                  <span className="label-text font-semibold">Au</span>
                </span>
                <input
                  type="date"
                  className="input input-bordered input-sm w-full"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </label>
              <button type="submit" className="btn btn-primary btn-sm col-span-2">
                Appliquer les dates
              </button>
            </form>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-ghost btn-sm gap-1 self-start"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Réinitialiser
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
