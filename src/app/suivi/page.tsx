"use client";

import type { ComponentType } from "react";
import { useActionState } from "react";
import { checkTrackingStatus, SuiviActionState } from "@/features/suivi/actions";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  School,
  Clock,
  CalendarClock,
  CalendarDays,
  KeyRound,
  Search,
} from "lucide-react";

const initialState: SuiviActionState = {
  error: undefined,
  success: false,
  candidature: null,
};

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Ligne « libellé → valeur » avec icône (cohérent avec le récap du formulaire). */
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Icon className="w-4 h-4 text-primary/70 shrink-0" aria-hidden="true" />
      <span className="text-sm text-base-content/60">{label}</span>
      <span className="ml-auto text-sm font-medium text-base-content text-right">
        {value}
      </span>
    </div>
  );
}

export default function SuiviPage() {
  const [state, formAction, isPending] = useActionState(
    checkTrackingStatus,
    initialState
  );

  const c = state?.candidature;
  const isAcademic = c?.type === "ACADEMIC";
  const isProcessing = c?.status !== "PENDING";
  const isAccepted = c?.status === "ACCEPTED";
  const isRejected = c?.status === "REJECTED";
  const decisionLabel = isAccepted
    ? "Acceptée"
    : isRejected
      ? "Refusée"
      : "Décision";
  const decisionStep = isAccepted
    ? "step-success"
    : isRejected
      ? "step-error"
      : "";

  return (
    <main className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* En-tête */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm link link-hover text-primary font-medium inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Retour à l'accueil
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-3 text-secondary">
            Suivre ma candidature
          </h1>
          <p className="text-sm text-base-content/60 mt-2">
            Entrez le code à 8 caractères reçu lors de la soumission de votre
            dossier chez Bridge Technologies Solutions.
          </p>
        </div>

        {/* Formulaire de recherche */}
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
                    placeholder="Ex : A7B2K9M1"
                    maxLength={8}
                    disabled={isPending}
                    className="input input-bordered join-item w-full uppercase font-mono tracking-widest text-center focus:outline-primary"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="btn btn-primary join-item px-6 gap-2"
                  >
                    {isPending ? (
                      <span
                        className="loading loading-spinner loading-sm"
                        aria-label="Recherche en cours"
                      ></span>
                    ) : (
                      <>
                        <Search className="w-4 h-4" aria-hidden="true" />
                        Rechercher
                      </>
                    )}
                  </button>
                </div>
              </div>

              {state?.error && (
                <div
                  role="alert"
                  className="alert alert-error text-sm py-2 px-3 mt-2 rounded-lg text-white font-medium"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {state.error}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Résultat */}
        {state?.success && c && (
          <div className="card bg-base-100 shadow-xl border border-success/30">
            <div className="card-body p-6 space-y-5">
              {/* En-tête : nom + code + badge */}
              <div className="flex items-start justify-between gap-3 border-b border-base-200 pb-4">
                <div className="min-w-0">
                  <h2 className="font-bold text-lg text-base-content truncate">
                    {c.profile.firstName} {c.profile.lastName}
                  </h2>
                  <p className="flex items-center gap-1.5 text-xs text-base-content/50 font-mono mt-0.5">
                    <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                    {c.trackingCode}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </div>

              {/* Frise de progression */}
              <ul className="steps steps-horizontal w-full text-xs">
                <li className="step step-primary">Reçue</li>
                <li className={`step ${isProcessing ? "step-primary" : ""}`}>
                  En traitement
                </li>
                <li className={`step ${decisionStep}`}>{decisionLabel}</li>
              </ul>

              {/* Détails */}
              <div className="divide-y divide-base-200">
                <InfoRow
                  icon={School}
                  label="Établissement"
                  value={c.profile.school}
                />
                <InfoRow
                  icon={isAcademic ? GraduationCap : Briefcase}
                  label="Type de stage"
                  value={isAcademic ? "Académique" : "Professionnel"}
                />
                <InfoRow
                  icon={Clock}
                  label="Durée"
                  value={`${c.duration} mois`}
                />
                <InfoRow
                  icon={CalendarClock}
                  label="Date de début souhaitée"
                  value={formatDate(c.startDate)}
                />
                <InfoRow
                  icon={CalendarDays}
                  label="Déposée le"
                  value={formatDate(c.createdAt)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
