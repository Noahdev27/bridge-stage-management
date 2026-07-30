"use client";

import { useActionState, useEffect, useState } from "react";
import { MailCheck, MailQuestion, Send } from "lucide-react";
import { resendVerification, type CandidateActionState } from "../actions";
import { useToast } from "@/shared/ui/ToastProvider";

export function ResendVerificationForm() {
  const [isOpen, setIsOpen] = useState(false);
  const { showToast } = useToast();

  const [state, formAction, isPending] = useActionState<
    CandidateActionState,
    FormData
  >(resendVerification, {});

  useEffect(() => {
    if (state.error) {
      showToast({ type: "error", message: state.error });
    }
  }, [state, showToast]);

  // Confirmation volontairement neutre : ce formulaire public ne doit pas
  // révéler si une adresse est inscrite.
  if (state.success) {
    return (
      <div className="rounded-box border border-success/30 bg-success/10 p-4 flex gap-3">
        <MailCheck
          className="w-5 h-5 text-success shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <p className="text-sm text-base-content/80">
          Si un compte non confirmé existe pour cette adresse, un nouveau lien de
          vérification vient d&apos;être envoyé. Il est valable 24 heures.
        </p>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn btn-ghost btn-sm w-full gap-2 text-base-content/70"
      >
        <MailQuestion className="w-4 h-4" aria-hidden="true" />
        Renvoyer l&apos;email de vérification
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-box border border-base-300 bg-base-200/50 p-4 space-y-2"
    >
      <p className="text-xs text-base-content/70">
        Indiquez l&apos;adresse de votre compte : nous renverrons le lien de
        confirmation.
      </p>
      <input
        name="email"
        type="email"
        className="input input-bordered input-sm w-full"
        placeholder="Email"
        required
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="btn btn-ghost btn-sm flex-1"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="btn btn-primary btn-sm flex-1 gap-1.5"
        >
          <Send className="w-3.5 h-3.5" aria-hidden="true" />
          {isPending ? "Envoi…" : "Envoyer"}
        </button>
      </div>
    </form>
  );
}
