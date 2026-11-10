"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, KeyRound, Mail, RotateCw, Send } from "lucide-react";
import { FormField } from "@/shared/ui/FormField";
import { PasswordInput } from "@/shared/ui/PasswordInput";
import { useToast } from "@/shared/ui/ToastProvider";
import {
  confirmStaffReset,
  requestStaffResetCode,
  type StaffResetState,
} from "../actions";
import { RESET_CODE_LENGTH, RESET_CODE_TTL_MINUTES } from "../constants";

/**
 * « Mot de passe oublié » du back-office, en deux étapes sur le même écran :
 * l'adresse, puis le code reçu par email et le nouveau mot de passe.
 *
 * L'adresse passe d'une étape à l'autre par l'état du composant, jamais par
 * l'URL : elle finirait sinon dans l'historique et les journaux du serveur.
 */
/** Résultat d'une action, daté pour savoir lequel est le plus récent. */
type Timed = StaffResetState & { at?: number };

function timed(
  action: (prev: StaffResetState, formData: FormData) => Promise<StaffResetState>
) {
  return async (prev: Timed, formData: FormData): Promise<Timed> => ({
    ...(await action(prev, formData)),
    at: Date.now(),
  });
}

const timedRequest = timed(requestStaffResetCode);
const timedConfirm = timed(confirmStaffReset);

export function StaffForgotPasswordForm() {
  const { showToast } = useToast();

  const [requestState, requestAction, isRequesting] = useActionState<Timed, FormData>(
    timedRequest,
    {}
  );
  const [confirmState, confirmAction, isConfirming] = useActionState<Timed, FormData>(
    timedConfirm,
    {}
  );

  // Envoi abandonné par « Changer d'adresse » : on revient à l'étape 1.
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const sentOnce = useRef(false);

  useEffect(() => {
    if (requestState.error) {
      showToast({ type: "error", message: requestState.error });
      return;
    }
    if (!requestState.codeSent) return;
    if (sentOnce.current) {
      showToast({ type: "success", message: "Nouveau code envoyé." });
    }
    sentOnce.current = true;
  }, [requestState, showToast]);

  const email =
    requestState.codeSent && requestState.at !== dismissedAt
      ? (requestState.email ?? null)
      : null;

  if (confirmState.reset) {
    return (
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/15 text-success">
          <CheckCircle2 className="w-9 h-9" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-secondary">Mot de passe modifié</h1>
        <p className="text-sm text-base-content/70">
          Vous pouvez vous connecter avec votre nouveau mot de passe.
        </p>
        <Link href="/admin/login" className="btn btn-primary w-full">
          Se connecter
        </Link>
      </div>
    );
  }

  if (!email) {
    return (
      <form action={requestAction} className="space-y-3">
        <h1 className="text-xl font-bold text-secondary text-center">
          Mot de passe oublié
        </h1>
        <p className="text-sm text-base-content/60 text-center">
          Indiquez l&apos;adresse de votre compte RH : nous y enverrons un code
          à {RESET_CODE_LENGTH} chiffres.
        </p>
        <FormField label="Email">
          {(control) => (
            <div className="input flex items-center gap-2 w-full">
              <Mail className="w-4 h-4 text-base-content/50 shrink-0" aria-hidden="true" />
              <input
                {...control}
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="vous@bridgetech-solutions.com"
                className="grow min-w-0"
              />
            </div>
          )}
        </FormField>
        <button type="submit" className="btn btn-primary w-full gap-2" disabled={isRequesting}>
          <Send className="w-4 h-4" aria-hidden="true" />
          {isRequesting ? "Envoi…" : "Recevoir un code"}
        </button>
      </form>
    );
  }

  // Un nouvel envoi rend caduques les erreurs liées à l'ancien code.
  const current: Timed =
    (confirmState.at ?? 0) > (requestState.at ?? 0) ? confirmState : {};
  const fieldErrors = current.fieldErrors ?? {};

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold text-secondary">Saisissez le code</h1>
        {/* Formulation neutre : l'écran ne doit pas révéler si l'adresse a
            un compte du back-office. */}
        <p className="text-sm text-base-content/60">
          Si un compte RH correspond à{" "}
          <strong className="break-all text-base-content">{email}</strong>, un
          code vient d&apos;y être envoyé. Il est valable {RESET_CODE_TTL_MINUTES}{" "}
          minutes.
        </p>
      </div>

      <form action={confirmAction} className="space-y-3">
        <input type="hidden" name="email" value={email} />

        <FormField label="Code reçu par email" required error={fieldErrors.code}>
          {(control) => (
            <input
              {...control}
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]*"
              maxLength={RESET_CODE_LENGTH + 1}
              placeholder="000000"
              required
              autoFocus
              className={`input w-full text-center font-mono text-2xl tracking-[0.5em] ${
                fieldErrors.code ? "input-error" : ""
              }`}
            />
          )}
        </FormField>

        <FormField label="Nouveau mot de passe" required error={fieldErrors.password}>
          {(control) => (
            <PasswordInput
              {...control}
              name="password"
              placeholder="Au moins 8 caractères"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              invalid={!!fieldErrors.password}
              required
            />
          )}
        </FormField>

        <FormField label="Confirmer" required error={fieldErrors.confirmPassword}>
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

        {current.error && !current.fieldErrors && (
          <div role="alert" className="alert alert-error text-sm py-2">
            <span>{current.error}</span>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary w-full gap-2"
          disabled={isConfirming || !!current.needsNewCode}
        >
          <KeyRound className="w-4 h-4" aria-hidden="true" />
          {isConfirming ? "Vérification…" : "Changer le mot de passe"}
        </button>
      </form>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
        <form action={requestAction}>
          <input type="hidden" name="email" value={email} />
          <button
            type="submit"
            className={`btn btn-sm gap-1.5 ${current.needsNewCode ? "btn-primary" : "btn-ghost"}`}
            disabled={isRequesting}
          >
            <RotateCw className="w-4 h-4" aria-hidden="true" />
            {isRequesting ? "Envoi…" : "Renvoyer un code"}
          </button>
        </form>
        <button
          type="button"
          className="link link-hover text-base-content/60"
          onClick={() => setDismissedAt(requestState.at ?? null)}
        >
          Changer d&apos;adresse
        </button>
      </div>
    </div>
  );
}
