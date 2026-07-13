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

export function CandidatureFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "ALL";
  const currentType = searchParams.get("type") || "";
  const currentFrom = searchParams.get("from") || "";
  const currentTo = searchParams.get("to") || "";

  const [from, setFrom] = useState(currentFrom);
  const [to, setTo] = useState(currentTo);

  const pushParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    router.push(`/admin?${params.toString()}`);
  };

  const handleStatusChange = (status: string) => {
    pushParams({ status: status === "ALL" ? null : status });
  };

  const handleTypeChange = (type: string) => {
    pushParams({ type: type || null });
  };

  const handleDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    pushParams({
      from: from || null,
      to: to || null,
    });
  };

  const handleReset = () => {
    setFrom("");
    setTo("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("status");
    params.delete("type");
    params.delete("from");
    params.delete("to");
    router.push(`/admin?${params.toString()}`);
  };

  const hasActiveFilters =
    currentStatus !== "ALL" ||
    !!currentType ||
    !!currentFrom ||
    !!currentTo;

  return (
    <div className="space-y-4 mb-6">
      <div className="tabs tabs-boxed inline-flex bg-base-200 p-1">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => handleStatusChange(filter.value)}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="form-control">
              <span className="label py-1">
                <span className="label-text font-semibold">Type de stage</span>
              </span>
              <select
                className="select select-bordered select-sm w-full"
                value={currentType}
                onChange={(e) => handleTypeChange(e.target.value)}
                aria-label="Filtrer par type de stage"
              >
                {TYPE_FILTERS.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <form
              onSubmit={handleDateSubmit}
              className="md:col-span-2 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end"
            >
              <label className="form-control">
                <span className="label py-1">
                  <span className="label-text font-semibold">Soumis du</span>
                </span>
                <input
                  type="date"
                  className="input input-bordered input-sm w-full"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  aria-label="Date de début de soumission"
                />
              </label>

              <label className="form-control">
                <span className="label py-1">
                  <span className="label-text font-semibold">Soumis au</span>
                </span>
                <input
                  type="date"
                  className="input input-bordered input-sm w-full"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  aria-label="Date de fin de soumission"
                />
              </label>

              <button type="submit" className="btn btn-primary btn-sm">
                Appliquer
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-ghost btn-sm gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  Réinitialiser
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
