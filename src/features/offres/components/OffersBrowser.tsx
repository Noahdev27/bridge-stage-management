"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DEPARTMENT_LABELS, TYPE_LABELS } from "@/shared/constants/domain";
import type { Department, InternshipOffer, InternshipType } from "@prisma/client";
import Link from "next/link";
import { Briefcase, Building2 } from "lucide-react";

const DEPARTMENTS = Object.keys(DEPARTMENT_LABELS) as Department[];

export function OffersBrowser({ offers }: { offers: InternshipOffer[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("department") || "";

  const handleDepartment = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) params.delete("department");
    else params.set("department", value);
    router.push(`/offres?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <label className="form-control max-w-sm">
        <span className="label py-1">
          <span className="label-text font-semibold">Département</span>
        </span>
        <select
          className="select select-bordered"
          value={current}
          onChange={(e) => handleDepartment(e.target.value)}
          aria-label="Filtrer par département"
        >
          <option value="">Tous les départements</option>
          {DEPARTMENTS.map((dep) => (
            <option key={dep} value={dep}>
              {DEPARTMENT_LABELS[dep]}
            </option>
          ))}
        </select>
      </label>

      {offers.length === 0 ? (
        <p className="text-base-content/60 text-center py-12">
          Aucune offre publiée pour ce filtre.
        </p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((offer) => (
            <li key={offer.id}>
              <article className="card bg-base-100 border border-base-300 h-full">
                <div className="card-body gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="card-title text-lg text-secondary">
                      {offer.title}
                    </h2>
                    <span className="badge badge-primary badge-sm">
                      {TYPE_LABELS[offer.type as InternshipType]}
                    </span>
                  </div>
                  <p className="text-sm text-base-content/70 line-clamp-3">
                    {offer.description}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-base-content/60">
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                      {DEPARTMENT_LABELS[offer.department]}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
                      {offer.durationMonths} mois min.
                    </span>
                  </div>
                  <div className="card-actions justify-end mt-auto">
                    <Link
                      href={`/candidature?offerId=${offer.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      Postuler
                    </Link>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
