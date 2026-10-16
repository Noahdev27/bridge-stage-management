"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/shared/ui/ToastProvider";
import { createTutor, type TutorActionState } from "../actions";

export function TutorCreateForm() {
  const router = useRouter();
  const { showToast } = useToast();

  const [state, formAction, isPending] = useActionState<
    TutorActionState,
    FormData
  >(createTutor, {});

  useEffect(() => {
    if (!state.success) return;
    showToast({ type: "success", message: "Tuteur créé avec succès." });
    router.push("/admin/tuteurs");
    router.refresh();
  }, [state, router, showToast]);

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
          Nouveau tuteur
        </h1>
        <p className="text-base-content/60 mt-1">
          Créez un compte tuteur qui pourra se connecter à l&apos;espace RH pour
          consulter ses dossiers affectés.
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
                Nom complet <span className="text-error">*</span>
              </span>
            </span>
            <input
              type="text"
              name="name"
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

          <label className="form-control">
            <span className="label py-1">
              <span className="label-text font-semibold">
                Email <span className="text-error">*</span>
              </span>
            </span>
            <input
              type="email"
              name="email"
              placeholder="tuteur@bridge.cm"
              className={`input input-bordered ${
                fieldErrors.email ? "input-error" : ""
              }`}
              maxLength={255}
              required
            />
            {fieldErrors.email && (
              <span className="label-text-alt text-error mt-1">
                {fieldErrors.email}
              </span>
            )}
          </label>

          <label className="form-control">
            <span className="label py-1">
              <span className="label-text font-semibold">
                Mot de passe initial <span className="text-error">*</span>
              </span>
            </span>
            <input
              type="password"
              name="password"
              placeholder="Au moins 8 caractères"
              className={`input input-bordered ${
                fieldErrors.password ? "input-error" : ""
              }`}
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              required
            />
            {fieldErrors.password ? (
              <span className="label-text-alt text-error mt-1">
                {fieldErrors.password}
              </span>
            ) : (
              <span className="label-text-alt text-base-content/50 mt-1">
                À communiquer au tuteur. Il pourra le changer depuis son espace
                Paramètres.
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
              {isPending ? "Création…" : "Créer le tuteur"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
