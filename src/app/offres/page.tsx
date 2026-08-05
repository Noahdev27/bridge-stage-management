import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPublishedOffers } from "@/features/offres/queries";
import { OffersBrowser } from "@/features/offres/components/OffersBrowser";
import { OffersBrowserSkeleton } from "@/features/offres/components/OffersBrowserSkeleton";
import type { Department } from "@prisma/client";
import { DEPARTMENT_LABELS } from "@/shared/constants/domain";

interface OffresPageProps {
  searchParams: Promise<{ department?: string }>;
}

/**
 * `searchParams` + requête base isolés ici : la coque de la page reste
 * prérendue et préchargeable par <Link>, seule la liste attend la base.
 */
async function OffersList({ searchParams }: OffresPageProps) {
  const { department: raw } = await searchParams;
  const department =
    raw && raw in DEPARTMENT_LABELS ? (raw as Department) : undefined;
  const offers = await getPublishedOffers(department);

  return <OffersBrowser offers={offers} />;
}

export default function OffresPage({ searchParams }: OffresPageProps) {
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
        <Suspense fallback={<OffersBrowserSkeleton />}>
          <OffersList searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
