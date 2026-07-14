import { CandidatureForm } from "@/features/candidature/components/CandidatureForm";

export const metadata = {
  title: "Candidature - Bridge Stage Management",
  description: "Postulez pour un stage académique ou professionnel",
};

export default async function CandidaturePage({
  searchParams,
}: {
  searchParams: Promise<{ offerId?: string }>;
}) {
  const { offerId } = await searchParams;

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

        <CandidatureForm offerId={offerId} />
      </div>
    </main>
  );
}
