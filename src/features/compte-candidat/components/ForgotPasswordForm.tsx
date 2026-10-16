"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { MailCheck, Send } from "lucide-react";
import { requestPasswordReset, type CandidateActionState } from "../actions";
import { useToast } from "@/shared/ui/ToastProvider";

export function ForgotPasswordForm() {
  const { showToast } = useToast();

  const [state, formAction, isPending] = useActionState<
    CandidateActionState,
    FormData
  >(requestPasswordReset, {});

  useEffect(() => {
    if (state.error) {
      showToast({ type: "error", message: state.error });
    }
  }, [state, showToast]);

  // Confirmation volontairement neutre : ce formulaire public ne doit pas
  // révéler si une adresse est inscrite.
  if (state.success) {
    return (
      <div className="card bg-base-100 border border-base-300 shadow-xl">
        <div className="card-body items-center text-center gap-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/15 text-success">
            <MailCheck className="w-9 h-9" aria-hidden="true" />
          </div>
          <h1 className="card-title text-secondary text-balance">
            Vérifiez votre boîte mail
          </h1>
          <p className="text-sm text-base-content/70">
            Si un compte candidat confirmé existe pour cette adresse, un lien de
            réinitialisation vient d&apos;être envoyé. Il est valable 1 heure.
          </p>
          <Link href="/candidat/login" className="btn btn-primary mt-2 w-full">
            Retour à la connexion
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
          Mot de passe oublié
        </h1>
        <p className="text-sm text-base-content/60">
          Indiquez l&apos;adresse de votre compte : nous vous enverrons un lien
          pour choisir un nouveau mot de passe.
        </p>
        <input
          name="email"
          type="email"
          className="input input-bordered"
          placeholder="Email"
          autoComplete="email"
          required
        />
        <button
          type="submit"
          className="btn btn-primary gap-2"
          disabled={isPending}
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          {isPending ? "Envoi…" : "Envoyer le lien"}
        </button>
        <p className="text-sm text-base-content/60 text-center">
          <Link href="/candidat/login" className="link link-primary">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </form>
  );
}
