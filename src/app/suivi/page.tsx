"use client";

import { useActionState } from "react";
import { checkTrackingStatus, SuiviActionState } from "@/features/suivi/actions";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Briefcase, AlertTriangle } from "lucide-react";

const initialState: SuiviActionState = {
  error: undefined,
  success: false,
  candidature: null,
};

export default function SuiviPage() {
  // Utilisation du hook standard Next.js / React pour gérer le retour de la Server Action
  const [state, formAction, isPending] = useActionState(checkTrackingStatus, initialState);

  return (
    <main className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        
        {/* En-tête / Retour d'accueil */}
        <div className="text-center">
          <Link href="/" className="text-sm link link-hover text-primary font-medium inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Retour à l'accueil
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-3 text-base-content">
            Suivre ma Candidature
          </h1>
          <p className="text-sm text-base-content/60 mt-2">
            Entrez le code à 8 caractères reçu lors de la soumission de votre dossier chez Bridges Technologies.
          </p>
        </div>

        {/* Boîte Principale (Formulaire de recherche) */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body p-6">
            <form action={formAction} className="space-y-4">
              <div className="form-control">
                <label className="label font-medium text-xs uppercase tracking-wider text-base-content/70">
                  Code de suivi
                </label>
                <div className="join w-full mt-1">
                  <input
                    type="text"
                    name="trackingCode"
                    placeholder="Ex: A7B2K9M1"
                    maxLength={8}
                    disabled={isPending}
                    className="input input-bordered join-item w-full uppercase font-mono tracking-widest text-center focus:outline-primary"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="btn btn-primary join-item px-6"
                  >
                    {isPending ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      "Rechercher"
                    )}
                  </button>
                </div>
              </div>

              {/* Affichage des erreurs de validation ou de base de données */}
              {state?.error && (
                <div className="alert alert-error text-sm py-2 px-3 mt-2 rounded-lg text-white font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {state.error}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Bloc Résultat : S'affiche uniquement si un dossier valide est trouvé */}
        {state?.success && state.candidature && (
          <div className="card bg-base-100 shadow-xl border border-success/30 animation-fade-in animate-once">
            <div className="card-body p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-base-200 pb-3">
                <h2 className="font-bold text-lg text-base-content">
                  {state.candidature.profile.firstName} {state.candidature.profile.lastName}
                </h2>
                {/* Ton composant partagé réutilisé proprement */}
                <StatusBadge status={state.candidature.status} />
              </div>

              <div className="space-y-2 text-sm text-base-content/80">
                <div className="flex justify-between">
                  <span className="text-base-content/50">Établissement :</span>
                  <span className="font-semibold text-right">{state.candidature.profile.school}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/50">Type de stage :</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    {state.candidature.type === "ACADEMIC" ? (
                      <GraduationCap className="w-4 h-4 text-primary" aria-hidden="true" />
                    ) : (
                      <Briefcase className="w-4 h-4 text-primary" aria-hidden="true" />
                    )}
                    {state.candidature.type === "ACADEMIC" ? "Académique" : "Professionnel"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/50">Durée demandée :</span>
                  <span className="font-semibold">{state.candidature.duration} mois</span>
                </div>
                <div className="flex justify-between border-t border-base-100 pt-2 text-xs text-base-content/40">
                  <span>Déposé le :</span>
                  <span>
                    {new Date(state.candidature.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}