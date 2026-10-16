import { Suspense } from "react";
import { CandidatureForm } from "@/features/candidature/components/CandidatureForm";
import { CandidatureFormSkeleton } from "@/features/candidature/components/CandidatureFormSkeleton";

export const metadata = {
  title: "Candidature - Bridge Stage Management",
  description: "Postulez pour un stage académique ou professionnel",
};

/**
 * Lecture de `?offerId` isolée dans son propre composant : tout ce qui dépend
 * de `searchParams` rend la page dynamique. En le cantonnant sous Suspense, le
 * reste de la page est prérendu statiquement, donc préchargeable par <Link> —
 * le clic sur « Déposer ma candidature » affiche la page sans aller-retour.
 */
async function CandidatureFormLoader({
  searchParams,
}: {
  searchParams: Promise<{ offerId?: string }>;
}) {
  const { offerId } = await searchParams;
  return <CandidatureForm offerId={offerId} />;
}

export default function CandidaturePage({
  searchParams,
}: {
  searchParams: Promise<{ offerId?: string }>;
}) {
  return (
    <main className="min-h-screen bg-base-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-3">Postulez pour un stage</h1>
          <p className="text-base-content/60 text-lg">
            Que vous cherchiez un stage académique ou professionnel, c&apos;est
            ici que tout commence. Remplissez le formulaire ci-dessous, étape par
            étape.
          </p>
        </div>

        <Suspense fallback={<CandidatureFormSkeleton />}>
          <CandidatureFormLoader searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
