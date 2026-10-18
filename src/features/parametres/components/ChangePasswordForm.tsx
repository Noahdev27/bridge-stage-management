"use client";

import { useActionState, useEffect, useRef } from "react";
import { KeyRound, Save } from "lucide-react";
import { useToast } from "@/shared/ui/ToastProvider";
import { FormField } from "@/shared/ui/FormField";
import { PasswordInput } from "@/shared/ui/PasswordInput";
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
          <FormField
            label="Mot de passe actuel"
            required
            error={fieldErrors.currentPassword}
          >
            {(control) => (
              <PasswordInput
                {...control}
                name="currentPassword"
                autoComplete="current-password"
                invalid={!!fieldErrors.currentPassword}
                required
              />
            )}
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField
              label="Nouveau mot de passe"
              required
              error={fieldErrors.newPassword}
            >
              {(control) => (
                <PasswordInput
                  {...control}
                  name="newPassword"
                  placeholder="Au moins 8 caractères"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  invalid={!!fieldErrors.newPassword}
                  required
                />
              )}
            </FormField>

            <FormField
              label="Confirmer"
              required
              error={fieldErrors.confirmPassword}
            >
              {(control) => (
                <PasswordInput
                  {...control}
                  name="confirmPassword"
                  placeholder="Retaper le nouveau mot de passe"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  invalid={!!fieldErrors.confirmPassword}
                  required
                />
              )}
            </FormField>
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
