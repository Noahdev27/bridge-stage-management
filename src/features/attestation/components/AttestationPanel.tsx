"use client";

import { useActionState, useState } from "react";
import { FileCheck2, Printer, ExternalLink } from "lucide-react";
import { saveInternshipPeriod, type AttestationActionState } from "../actions";

interface AttestationPanelProps {
  requestId: string;
  /** Le dossier doit être accepté pour être attesté. */
  isAccepted: boolean;
  startDate: string;
  endDate: string | null;
  reference: string | null;
  issuedAt: Date | null;
}

export function AttestationPanel({
  requestId,
  isAccepted,
  startDate,
  endDate,
  reference,
  issuedAt,
}: AttestationPanelProps) {
  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(endDate ?? "");

  const boundAction = saveInternshipPeriod.bind(null, requestId);
  const [state, formAction, isPending] = useActionState<
    AttestationActionState,
    FormData
  >(boundAction, {});

  // La période enregistrée est la seule source valable du document : tant que la
  // saisie n'est pas sauvegardée, on ne propose pas de générer l'attestation.
  const savedPeriod = endDate !== null;
  const hasUnsavedEdits = start !== startDate || end !== (endDate ?? "");
  const canIssue = isAccepted && savedPeriod && !hasUnsavedEdits;

  const href = `/api/attestation/${requestId}`;

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body p-5 gap-4">
        <div className="flex items-center gap-2 border-b border-base-200 pb-3">
          <FileCheck2 className="w-5 h-5 text-primary" aria-hidden="true" />
          <h2 className="card-title text-lg">Attestation de stage</h2>
        </div>

        {!isAccepted ? (
          <p className="text-sm text-base-content/60">
            Disponible une fois la candidature acceptée.
          </p>
        ) : (
          <>
            <p className="text-xs text-base-content/50">
              Confirmez la période réellement effectuée : la demande ne contient
              que les dates <em>souhaitées</em> par le candidat.
            </p>

            <form action={formAction} className="space-y-3">
              <label className="form-control">
                <span className="label py-1">
                  <span className="label-text font-semibold">Début du stage</span>
                </span>
                <input
                  type="date"
                  name="startDate"
                  required
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="input input-bordered input-sm w-full"
                />
              </label>

              <label className="form-control">
                <span className="label py-1">
                  <span className="label-text font-semibold">
                    Fin du stage <span className="text-error">*</span>
                  </span>
                </span>
                <input
                  type="date"
                  name="endDate"
                  required
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="input input-bordered input-sm w-full"
                />
              </label>

              {state.error && (
                <div className="alert alert-error text-sm py-2">
                  <span>{state.error}</span>
                </div>
              )}

              {state.success && !isPending && !hasUnsavedEdits && (
                <div className="alert alert-success text-sm py-2">
                  <span>Période enregistrée.</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-sm w-full"
                disabled={isPending || !end}
              >
                {isPending ? "Enregistrement…" : "Enregistrer la période"}
              </button>
            </form>

            <div className="border-t border-base-200 pt-3 space-y-2">
              {reference && (
                <p className="text-xs text-base-content/50">
                  Référence <span className="font-mono">{reference}</span>
                  {issuedAt
                    ? ` — délivrée le ${new Date(issuedAt).toLocaleDateString("fr-FR")}`
                    : ""}
                </p>
              )}

              {hasUnsavedEdits && (
                <p className="text-xs text-warning">
                  Enregistrez la période pour générer le document à jour.
                </p>
              )}

              <div className="flex gap-2">
                <a
                  href={`${href}?print=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn btn-sm btn-outline flex-1 gap-1.5 ${
                    canIssue ? "" : "btn-disabled pointer-events-none opacity-50"
                  }`}
                  aria-disabled={!canIssue}
                >
                  <Printer className="w-4 h-4" aria-hidden="true" />
                  Imprimer / PDF
                </a>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn btn-sm btn-ghost gap-1.5 ${
                    canIssue ? "" : "btn-disabled pointer-events-none opacity-50"
                  }`}
                  aria-disabled={!canIssue}
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  Aperçu
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
