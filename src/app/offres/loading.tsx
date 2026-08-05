import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OffersBrowserSkeleton } from "@/features/offres/components/OffersBrowserSkeleton";

/**
 * Écran préchargeable de la liste d'offres : la page interroge la base et
 * dépend de `?department`, donc elle est rendue à la demande. Cette frontière
 * rend le clic sur « Voir les offres » immédiat, la liste arrivant ensuite en
 * streaming.
 */
export default function Loading() {
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
        <OffersBrowserSkeleton />
      </div>
    </main>
  );
}
