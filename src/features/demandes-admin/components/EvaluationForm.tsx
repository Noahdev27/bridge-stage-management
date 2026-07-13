"use client";

import { useActionState, useState } from "react";
import { Star, MessageSquareText } from "lucide-react";
import {
  saveRequestEvaluation,
  type AdminActionState,
} from "../actions";

interface EvaluationFormProps {
  requestId: string;
  initialRating?: number | null;
  initialComment?: string | null;
  lastUpdatedAt?: Date | null;
  authorLabel?: string | null;
}

export function EvaluationForm({
  requestId,
  initialRating,
  initialComment,
  lastUpdatedAt,
  authorLabel,
}: EvaluationFormProps) {
  const [rating, setRating] = useState(initialRating ?? 0);
  const [comment, setComment] = useState(initialComment ?? "");

  const boundAction = saveRequestEvaluation.bind(null, requestId);
  const [state, formAction, isPending] = useActionState<
    AdminActionState,
    FormData
  >(boundAction, {});

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body p-5 gap-4">
        <div className="flex items-center gap-2 border-b border-base-200 pb-3">
          <MessageSquareText
            className="w-5 h-5 text-primary"
            aria-hidden="true"
          />
          <h2 className="card-title text-lg">Évaluation interne</h2>
        </div>

        <p className="text-xs text-base-content/50">
          Visible uniquement par l'équipe RH. N'altère pas le statut de la
          demande.
        </p>

        <form action={formAction} className="space-y-4">
          <div>
            <span className="label-text font-semibold block mb-2">
              Note du dossier <span className="text-error">*</span>
            </span>
            <div
              className="flex gap-1"
              role="radiogroup"
              aria-label="Note du dossier sur 5"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} sur 5`}
                  onClick={() => setRating(value)}
                  className="btn btn-ghost btn-sm btn-square"
                >
                  <Star
                    className={`w-5 h-5 ${
                      rating >= value
                        ? "fill-warning text-warning"
                        : "text-base-content/30"
                    }`}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
            <input type="hidden" name="rating" value={rating || ""} />
          </div>

          <label className="form-control">
            <span className="label py-1">
              <span className="label-text font-semibold">
                Commentaire interne
              </span>
            </span>
            <textarea
              name="comment"
              className="textarea textarea-bordered min-h-28"
              placeholder="Observations, points forts, réserves…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
            />
          </label>

          {lastUpdatedAt && (
            <p className="text-xs text-base-content/50">
              Dernière mise à jour le{" "}
              {new Date(lastUpdatedAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {authorLabel ? ` par ${authorLabel}` : ""}
            </p>
          )}

          {state.error && (
            <div className="alert alert-error text-sm py-2">
              <span>{state.error}</span>
            </div>
          )}

          {state.success && !isPending && (
            <div className="alert alert-success text-sm py-2">
              <span>Évaluation enregistrée.</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-sm w-full"
            disabled={isPending || rating < 1}
          >
            {isPending ? "Enregistrement…" : "Enregistrer l'évaluation"}
          </button>
        </form>
      </div>
    </div>
  );
}
