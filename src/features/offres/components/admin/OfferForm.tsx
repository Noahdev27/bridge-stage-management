"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import type { Department, InternshipOffer, InternshipType } from "@prisma/client";
import { DEPARTMENT_LABELS, TYPE_LABELS } from "@/shared/constants/domain";
import { useToast } from "@/shared/ui/ToastProvider";
import {
  createOffer,
  updateOffer,
  type OfferActionState,
} from "../../actions";

const DEPARTMENTS = Object.keys(DEPARTMENT_LABELS) as Department[];
const TYPES = Object.keys(TYPE_LABELS) as InternshipType[];

interface OfferFormProps {
  mode: "create" | "edit";
  offer?: InternshipOffer;
}

export function OfferForm({ mode, offer }: OfferFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const action =
    mode === "edit" && offer
      ? updateOffer.bind(null, offer.id)
      : createOffer;

  const [state, formAction, isPending] = useActionState<
    OfferActionState,
    FormData
  >(action, {});

  useEffect(() => {
    if (!state.success) return;
    showToast({
      type: "success",
      message:
        mode === "create"
          ? "Offre créée avec succès."
          : "Offre mise à jour avec succès.",
    });
    if (mode === "create") {
      router.push("/admin/offres");
      router.refresh();
    }
    // `state` change de référence à chaque soumission réussie, ce qui garantit
    // que le toast s'affiche même sur des sauvegardes successives.
  }, [state, mode, router, showToast]);

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/offres"
          className="text-sm link link-hover text-primary inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Retour aux offres
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mt-3">
          {mode === "create" ? "Nouvelle offre de stage" : "Modifier l'offre"}
        </h1>
        <p className="text-base-content/60 mt-1">
          {mode === "create"
            ? "Publiez une opportunité visible dans l'espace public des offres."
            : "Modifiez les informations de cette offre."}
        </p>
      </div>

      <form
        action={formAction}
        className="card bg-base-100 border border-base-300 shadow-sm"
      >
        <div className="card-body p-5 gap-4">
          <label className="form-control">
            <span className="label py-1">
              <span className="label-text font-semibold">
                Titre <span className="text-error">*</span>
              </span>
            </span>
            <input
              type="text"
              name="title"
              defaultValue={offer?.title ?? ""}
              placeholder="Ex : Stage développeur back-end Node.js"
              className={`input input-bordered ${
                fieldErrors.title ? "input-error" : ""
              }`}
              maxLength={150}
              required
            />
            {fieldErrors.title && (
              <span className="label-text-alt text-error mt-1">
                {fieldErrors.title}
              </span>
            )}
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="form-control">
              <span className="label py-1">
                <span className="label-text font-semibold">
                  Département <span className="text-error">*</span>
                </span>
              </span>
              <select
                name="department"
                defaultValue={offer?.department ?? ""}
                className={`select select-bordered ${
                  fieldErrors.department ? "select-error" : ""
                }`}
                required
              >
                <option value="" disabled>
                  Sélectionnez un département
                </option>
                {DEPARTMENTS.map((dep) => (
                  <option key={dep} value={dep}>
                    {DEPARTMENT_LABELS[dep]}
                  </option>
                ))}
              </select>
              {fieldErrors.department && (
                <span className="label-text-alt text-error mt-1">
                  {fieldErrors.department}
                </span>
              )}
            </label>

            <label className="form-control">
              <span className="label py-1">
                <span className="label-text font-semibold">
                  Type de stage <span className="text-error">*</span>
                </span>
              </span>
              <select
                name="type"
                defaultValue={offer?.type ?? ""}
                className={`select select-bordered ${
                  fieldErrors.type ? "select-error" : ""
                }`}
                required
              >
                <option value="" disabled>
                  Sélectionnez un type
                </option>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              {fieldErrors.type && (
                <span className="label-text-alt text-error mt-1">
                  {fieldErrors.type}
                </span>
              )}
            </label>
          </div>

          <label className="form-control">
            <span className="label py-1">
              <span className="label-text font-semibold">
                Durée minimale (mois) <span className="text-error">*</span>
              </span>
            </span>
            <input
              type="number"
              name="durationMonths"
              defaultValue={offer?.durationMonths ?? ""}
              min={1}
              max={24}
              step={1}
              placeholder="Ex : 3"
              className={`input input-bordered ${
                fieldErrors.durationMonths ? "input-error" : ""
              }`}
              required
            />
            {fieldErrors.durationMonths && (
              <span className="label-text-alt text-error mt-1">
                {fieldErrors.durationMonths}
              </span>
            )}
          </label>

          <label className="form-control">
            <span className="label py-1">
              <span className="label-text font-semibold">
                Description <span className="text-error">*</span>
              </span>
            </span>
            <textarea
              name="description"
              defaultValue={offer?.description ?? ""}
              placeholder="Missions, compétences attendues, environnement…"
              className={`textarea textarea-bordered min-h-40 ${
                fieldErrors.description ? "textarea-error" : ""
              }`}
              maxLength={4000}
              required
            />
            {fieldErrors.description && (
              <span className="label-text-alt text-error mt-1">
                {fieldErrors.description}
              </span>
            )}
          </label>

          <label className="label cursor-pointer justify-start gap-3 py-2">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={offer?.isPublished ?? true}
              className="checkbox checkbox-primary"
            />
            <span className="label-text font-medium">
              Publier immédiatement l&apos;offre (visible dans l&apos;espace
              candidat)
            </span>
          </label>

          {state.error && (
            <div className="alert alert-error text-sm py-2">
              <span>{state.error}</span>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-base-200">
            <Link
              href="/admin/offres"
              className="btn btn-ghost btn-sm sm:btn-md sm:flex-1"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary btn-sm sm:btn-md sm:flex-1 gap-2"
            >
              <Save className="w-4 h-4" aria-hidden="true" />
              {isPending
                ? "Enregistrement…"
                : mode === "create"
                ? "Créer l'offre"
                : "Enregistrer les modifications"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
