import { CandidatureFormSkeleton } from "@/features/candidature/components/CandidatureFormSkeleton";

/**
 * La page dépend de `?offerId`, donc elle est rendue à la demande. Sans
 * frontière de chargement, <Link> ne peut rien précharger d'une route dynamique
 * et le clic sur « Déposer ma candidature » reste sans réaction le temps du
 * rendu serveur. Ce fichier donne à Next un écran préchargeable, affiché
 * instantanément au clic.
 */
export default function Loading() {
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

        <CandidatureFormSkeleton />
      </div>
    </main>
  );
}
