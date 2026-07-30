"use client";

import { useActionState, useEffect, useRef } from "react";
import { KeyRound, Save } from "lucide-react";
import { useToast } from "@/shared/ui/ToastProvider";
import { changePassword, type ParametresActionState } from "../actions";

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const { showToast } = useToast();

  const [state, formAction, isPending] = useActionState<
    ParametresActionState,
    FormData
  >(changePassword, {});

  useEffect(() => {
    if (!state.success) return;
    showToast({ type: "success", message: "Mot de passe modifié avec succès." });
    formRef.current?.reset();
  }, [state, showToast]);

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body p-5 gap-4">
        <div className="flex items-center gap-2 border-b border-base-200 pb-3">
          <KeyRound className="w-5 h-5 text-primary" aria-hidden="true" />
          <h2 className="card-title text-lg">Changer mon mot de passe</h2>
        </div>

        <form action={formAction} ref={formRef} className="space-y-3">
          <label className="form-control">
            <span className="label py-1">
              <span className="label-text font-semibold">
                Mot de passe actuel <span className="text-error">*</span>
              </span>
            </span>
            <input
              type="password"
              name="currentPassword"
              className={`input input-bordered ${
                fieldErrors.currentPassword ? "input-error" : ""
              }`}
              autoComplete="current-password"
              required
            />
            {fieldErrors.currentPassword && (
              <span className="label-text-alt text-error mt-1">
                {fieldErrors.currentPassword}
              </span>
            )}
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="form-control">
              <span className="label py-1">
                <span className="label-text font-semibold">
                  Nouveau mot de passe <span className="text-error">*</span>
                </span>
              </span>
              <input
                type="password"
                name="newPassword"
                placeholder="Au moins 8 caractères"
                className={`input input-bordered ${
                  fieldErrors.newPassword ? "input-error" : ""
                }`}
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                required
              />
              {fieldErrors.newPassword && (
                <span className="label-text-alt text-error mt-1">
                  {fieldErrors.newPassword}
                </span>
              )}
            </label>

            <label className="form-control">
              <span className="label py-1">
                <span className="label-text font-semibold">
                  Confirmer <span className="text-error">*</span>
                </span>
              </span>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Retaper le nouveau mot de passe"
                className={`input input-bordered ${
                  fieldErrors.confirmPassword ? "input-error" : ""
                }`}
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                required
              />
              {fieldErrors.confirmPassword && (
                <span className="label-text-alt text-error mt-1">
                  {fieldErrors.confirmPassword}
                </span>
              )}
            </label>
          </div>

          {state.error && !state.fieldErrors && (
            <div className="alert alert-error text-sm py-2">
              <span>{state.error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="btn btn-primary btn-sm gap-2"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            {isPending ? "Enregistrement…" : "Changer le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}
