import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPublishedOffers } from "@/features/offres/queries";
import { OffersBrowser } from "@/features/offres/components/OffersBrowser";
import type { Department } from "@prisma/client";
import { DEPARTMENT_LABELS } from "@/shared/constants/domain";

interface OffresPageProps {
  searchParams: Promise<{ department?: string }>;
}

export default async function OffresPage({ searchParams }: OffresPageProps) {
  const { department: raw } = await searchParams;
  const department =
    raw && raw in DEPARTMENT_LABELS ? (raw as Department) : undefined;
  const offers = await getPublishedOffers(department);

  return (
    <main className="min-h-screen bg-base-200">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <div>
          <Link
            href="/"
            className="text-sm link link-hover text-primary inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Accueil
          </Link>
          <h1 className="text-3xl font-bold text-secondary mt-3">
            Offres de stage
          </h1>
          <p className="text-base-content/60 mt-1">
            Consultez les besoins ouverts par département chez Bridge.
          </p>
        </div>
        <Suspense fallback={<div className="skeleton h-40 w-full rounded-box" />}>
          <OffersBrowser offers={offers} />
        </Suspense>
      </div>
    </main>
  );
}
