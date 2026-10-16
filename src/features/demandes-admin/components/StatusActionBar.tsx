"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Settings2, Check, X, Send } from "lucide-react";
import { updateCandidatureStatus } from "../actions";
import { DECISION_COMMENT_MAX } from "../schema";
import { useToast } from "@/shared/ui/ToastProvider";
import type { RequestStatus } from "@prisma/client";

interface StatusActionBarProps {
  requestId: string;
  status: RequestStatus;
  /** Commentaire déjà envoyé au candidat, réaffiché pour correction. */
  decisionComment?: string | null;
}

/** Textes de la modale selon la décision engagée. */
const DECISION_COPY = {
  ACCEPTED: {
    title: "Accepter la candidature",
    intro:
      "Le candidat recevra un email l'informant que son dossier est accepté.",
    label: "Message pour le candidat (facultatif)",
    placeholder:
      "Ex : Félicitations ! Merci de vous présenter le lundi 12 à 8h, muni de votre pièce d'identité.",
    confirm: "Accepter et notifier",
    confirmClass: "btn-success",
  },
  REJECTED: {
    title: "Refuser la candidature",
    intro: "Le candidat recevra un email l'informant que son dossier est refusé.",
    label: "Motif du refus (facultatif)",
    placeholder:
      "Ex : Aucune place disponible en développement pour la période demandée.",
    confirm: "Refuser et notifier",
    confirmClass: "btn-error",
  },
} as const;

type DecisionStatus = keyof typeof DECISION_COPY;

export function StatusActionBar({
  requestId,
  status,
  decisionComment,
}: StatusActionBarProps) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [decision, setDecision] = useState<DecisionStatus | null>(null);
  const [comment, setComment] = useState("");

  // <dialog> natif : piège le focus et gère Échap sans code supplémentaire.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (decision && !dialog.open) dialog.showModal();
    if (!decision && dialog.open) dialog.close();
  }, [decision]);

  const applyStatus = (nextStatus: RequestStatus, nextComment?: string) => {
    startTransition(async () => {
      const result = await updateCandidatureStatus(
        requestId,
        nextStatus,
        nextComment
      );
      if (result.error) {
        showToast({ type: "error", message: result.error });
        return;
      }
      setDecision(null);
      showToast({
        type: "success",
        message: nextComment?.trim()
          ? "Statut mis à jour, message envoyé au candidat."
          : "Statut de la demande mis à jour.",
      });
    });
  };

  const openDecision = (nextStatus: DecisionStatus) => {
    // Repart du dernier message envoyé pour éviter une ressaisie complète.
    setComment(decisionComment ?? "");
    setDecision(nextStatus);
  };

  const copy = decision ? DECISION_COPY[decision] : null;
  const isTooLong = comment.length > DECISION_COMMENT_MAX;

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {status !== "PROCESS" && status !== "ACCEPTED" && status !== "REJECTED" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => applyStatus("PROCESS")}
            className="btn btn-sm btn-info text-white gap-1.5"
          >
            <Settings2 className="w-4 h-4" aria-hidden="true" />
            Traiter
          </button>
        )}
        {status !== "ACCEPTED" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => openDecision("ACCEPTED")}
            className="btn btn-sm btn-success text-white gap-1.5"
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            Accepter
          </button>
        )}
        {status !== "REJECTED" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => openDecision("REJECTED")}
            className="btn btn-sm btn-error text-white gap-1.5"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            Refuser
          </button>
        )}
      </div>

      <dialog
        ref={dialogRef}
        className="modal"
        onClose={() => setDecision(null)}
      >
        <div className="modal-box max-w-lg">
          {copy && decision && (
            <>
              <h3 className="font-bold text-lg">{copy.title}</h3>
              <p className="text-sm text-base-content/60 mt-1">{copy.intro}</p>

              <label className="form-control mt-4">
                <span className="label py-1">
                  <span className="label-text font-medium">{copy.label}</span>
                </span>
                <textarea
                  className={`textarea textarea-bordered w-full h-32 ${
                    isTooLong ? "textarea-error" : ""
                  }`}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={copy.placeholder}
                  disabled={isPending}
                  autoFocus
                />
                <span className="label py-1">
                  <span className="label-text-alt text-base-content/50">
                    Laissez vide pour n&apos;envoyer que le changement de statut.
                  </span>
                  <span
                    className={`label-text-alt tabular-nums ${
                      isTooLong ? "text-error font-semibold" : "text-base-content/50"
                    }`}
                  >
                    {comment.length} / {DECISION_COMMENT_MAX}
                  </span>
                </span>
              </label>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={isPending}
                  onClick={() => setDecision(null)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className={`btn ${copy.confirmClass} text-white gap-1.5`}
                  disabled={isPending || isTooLong}
                  onClick={() => applyStatus(decision, comment)}
                >
                  {isPending ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <Send className="w-4 h-4" aria-hidden="true" />
                  )}
                  {copy.confirm}
                </button>
              </div>
            </>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit" disabled={isPending}>
            Fermer
          </button>
        </form>
      </dialog>
    </>
  );
}
