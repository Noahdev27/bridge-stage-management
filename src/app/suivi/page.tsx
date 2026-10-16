"use client";

import type { ComponentType } from "react";
import { useActionState, useEffect } from "react";
import { checkTrackingStatus, SuiviActionState } from "@/features/suivi/actions";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { formatTrackingCode } from "@/shared/tracking/tracking-code";
import { SuiviResultSkeleton } from "@/shared/ui/SuiviResultSkeleton";
import { ResendTrackingCodeForm } from "@/features/suivi/components/ResendTrackingCodeForm";
import { useToast } from "@/shared/ui/ToastProvider";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  Briefcase,
  School,
  Clock,
  CalendarClock,
  CalendarDays,
  KeyRound,
  MessageSquareText,
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
  const { showToast } = useToast();

  useEffect(() => {
    if (state?.error && !isPending) {
      showToast({ type: "error", message: state.error });
    }
  }, [state?.error, isPending, showToast]);

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
            Retour à l&apos;accueil
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-3 text-secondary">
            Suivre ma candidature
          </h1>
          <p className="text-sm text-base-content/60 mt-2">
            Entrez le code reçu lors de la soumission de votre dossier chez
            Bridge Technologies Solutions. Les tirets et la casse n&apos;ont pas
            d&apos;importance.
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
                    placeholder="Ex : K3QP-7WZM-2BRS-9XTH"
                    // 16 caractères + 3 tirets si le code est collé formaté.
                    maxLength={19}
                    disabled={isPending}
                    className="input input-bordered join-item w-full uppercase font-mono tracking-wider text-center focus:outline-primary"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="btn btn-primary join-item px-6 gap-2"
                  >
                    <Search className="w-4 h-4" aria-hidden="true" />
                    {isPending ? "Recherche…" : "Rechercher"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <ResendTrackingCodeForm />

        {isPending && <SuiviResultSkeleton />}

        {!isPending && state?.success && c && (
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
                    {formatTrackingCode(c.trackingCode)}
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

              {/* Message de la décision. Il a déjà été envoyé par email, mais un
                  email se perd ou part en indésirables : le suivi par code reste
                  accessible sans compte, c'est le repli le plus sûr.
                  La RH ne le renseigne qu'avec une décision finale. */}
              {c.decisionComment && (
                <div
                  className={`rounded-box border p-4 ${
                    isRejected
                      ? "border-error/30 bg-error/5"
                      : "border-success/30 bg-success/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquareText
                      className={`w-4 h-4 shrink-0 ${
                        isRejected ? "text-error" : "text-success"
                      }`}
                      aria-hidden="true"
                    />
                    <h3 className="text-sm font-semibold text-base-content">
                      {isRejected
                        ? "Motif du refus"
                        : "Message de l'équipe RH"}
                    </h3>
                  </div>
                  {/* whitespace-pre-line — la RH saisit un texte multi-lignes. */}
                  <p className="text-sm text-base-content/70 whitespace-pre-line mt-2">
                    {c.decisionComment}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
