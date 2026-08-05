import Link from "next/link";
import { ArrowLeft, CircleX } from "lucide-react";
import { isPasswordResetTokenUsable } from "@/features/compte-candidat/password-reset";
import { ResetPasswordForm } from "@/features/compte-candidat/components/ResetPasswordForm";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams;

  // Le jeton est vérifié sans être consommé : afficher un message clair vaut
  // mieux qu'un formulaire qui échouerait à la soumission.
  const isUsable = await isPasswordResetTokenUsable(token ?? "");

  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Link
          href="/"
          className="text-sm link link-primary inline-flex gap-1 items-center"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Accueil
        </Link>

        {isUsable ? (
          <ResetPasswordForm token={token ?? ""} />
        ) : (
          <div className="card bg-base-100 border border-base-300 shadow-xl">
            <div className="card-body items-center text-center gap-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/15 text-error">
                <CircleX className="w-9 h-9" aria-hidden="true" />
              </div>
              <h1 className="card-title text-secondary text-balance">
                Lien invalide ou expiré
              </h1>
              <p className="text-sm text-base-content/70">
                Ce lien est incorrect, a déjà été utilisé, ou a dépassé sa durée
                de validité d&apos;une heure. Demandez-en un nouveau pour
                choisir votre mot de passe.
              </p>
              <Link
                href="/candidat/mot-de-passe-oublie"
                className="btn btn-primary mt-2 w-full"
              >
                Demander un nouveau lien
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
