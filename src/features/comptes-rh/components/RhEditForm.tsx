"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/shared/ui/ToastProvider";
import { updateRhName, type RhActionState } from "../actions";

type RhDetails = {
  id: string;
  name: string | null;
  email: string;
  _count: { evaluations: number };
};

interface RhEditFormProps {
  rh: RhDetails;
}

export function RhEditForm({ rh }: RhEditFormProps) {
  const { showToast } = useToast();
  const boundAction = updateRhName.bind(null, rh.id);
  const [state, formAction, isPending] = useActionState<RhActionState, FormData>(
    boundAction,
    {}
  );

  useEffect(() => {
    if (!state.success) return;
    showToast({ type: "success", message: "Compte RH mis à jour." });
  }, [state, showToast]);

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/rh"
          className="text-sm link link-hover text-primary inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Retour aux comptes RH
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mt-3">
          Modifier le compte RH
        </h1>
        <p className="text-base-content/60 mt-1">
          L&apos;email sert d&apos;identifiant de connexion et ne peut pas être
          changé ici. Le mot de passe se change depuis l&apos;espace Paramètres
          du titulaire.
        </p>
      </div>

      <form
        action={formAction}
        className="card bg-base-100 border border-base-300 shadow-sm"
      >
        <div className="card-body p-5 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-base-content">Email</span>
            </span>
            <input
              type="email"
              value={rh.email}
              disabled
              className="input w-full bg-base-200 text-base-content/60 font-mono"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-base-content">
                Nom complet <span className="text-error">*</span>
              </span>
            </span>
            <input
              type="text"
              name="name"
              defaultValue={rh.name ?? ""}
              placeholder="Ex : Marie Fotso"
              className={`input w-full ${
                fieldErrors.name ? "input-error" : ""
              }`}
              maxLength={100}
              required
            />
            {fieldErrors.name && (
              <span className="text-xs text-error mt-1">
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
              href="/admin/rh"
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
