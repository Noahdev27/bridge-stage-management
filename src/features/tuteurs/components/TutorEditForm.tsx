"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/shared/ui/ToastProvider";
import { updateTutorName, type TutorActionState } from "../actions";

type TutorDetails = {
  id: string;
  name: string | null;
  email: string;
  _count: { tutoredRequests: number };
};

interface TutorEditFormProps {
  tutor: TutorDetails;
}

export function TutorEditForm({ tutor }: TutorEditFormProps) {
  const { showToast } = useToast();
  const boundAction = updateTutorName.bind(null, tutor.id);
  const [state, formAction, isPending] = useActionState<
    TutorActionState,
    FormData
  >(boundAction, {});

  useEffect(() => {
    if (!state.success) return;
    showToast({ type: "success", message: "Tuteur mis à jour." });
  }, [state, showToast]);

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/tuteurs"
          className="text-sm link link-hover text-primary inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Retour aux tuteurs
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mt-3">
          Modifier le tuteur
        </h1>
        <p className="text-base-content/60 mt-1">
          L&apos;email sert d&apos;identifiant de connexion et ne peut pas être
          changé ici. {tutor._count.tutoredRequests} dossier(s) actuellement
          affecté(s).
        </p>
      </div>

      <form
        action={formAction}
        className="card bg-base-100 border border-base-300 shadow-sm"
      >
        <div className="card-body p-5 gap-4">
          <label className="form-control">
            <span className="label py-1">
              <span className="label-text font-semibold">Email</span>
            </span>
            <input
              type="email"
              value={tutor.email}
              disabled
              className="input input-bordered bg-base-200 text-base-content/60 font-mono"
            />
          </label>

          <label className="form-control">
            <span className="label py-1">
              <span className="label-text font-semibold">
                Nom complet <span className="text-error">*</span>
              </span>
            </span>
            <input
              type="text"
              name="name"
              defaultValue={tutor.name ?? ""}
              placeholder="Ex : Jean Ngoumou"
              className={`input input-bordered ${
                fieldErrors.name ? "input-error" : ""
              }`}
              maxLength={100}
              required
            />
            {fieldErrors.name && (
              <span className="label-text-alt text-error mt-1">
                {fieldErrors.name}
              </span>
            )}
          </label>

          {state.error && (
            <div className="alert alert-error text-sm py-2">
              <span>{state.error}</span>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-base-200">
            <Link
              href="/admin/tuteurs"
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
              {isPending ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
