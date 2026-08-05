"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { resetPassword, type CandidateActionState } from "../actions";
import { useToast } from "@/shared/ui/ToastProvider";

export function ResetPasswordForm({ token }: { token: string }) {
  const { showToast } = useToast();

  const [state, formAction, isPending] = useActionState<
    CandidateActionState,
    FormData
  >(resetPassword, {});

  useEffect(() => {
    if (state.error) {
      showToast({ type: "error", message: state.error });
    }
  }, [state, showToast]);

  if (state.success) {
    return (
      <div className="card bg-base-100 border border-base-300 shadow-xl">
        <div className="card-body items-center text-center gap-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/15 text-success">
            <CircleCheck className="w-9 h-9" aria-hidden="true" />
          </div>
          <h1 className="card-title text-secondary text-balance">
            Mot de passe modifié
          </h1>
          <p className="text-sm text-base-content/70">
            Vous pouvez maintenant vous connecter avec votre nouveau mot de
            passe.
          </p>
          <Link href="/candidat/login" className="btn btn-primary mt-2 w-full">
            Aller à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="card bg-base-100 border border-base-300 shadow-xl"
    >
      <div className="card-body gap-3">
        <h1 className="card-title text-secondary text-balance">
          Nouveau mot de passe
        </h1>
        <p className="text-sm text-base-content/60">
          Choisissez un mot de passe d&apos;au moins 8 caractères.
        </p>

        {/* Le jeton voyage avec le formulaire : la page est publique et ne
            dispose d'aucune session pour le retrouver à la soumission. */}
        <input type="hidden" name="token" value={token} />

        <input
          name="password"
          type="password"
          className="input input-bordered"
          placeholder="Nouveau mot de passe"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <input
          name="confirmPassword"
          type="password"
          className="input input-bordered"
          placeholder="Confirmez le mot de passe"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
