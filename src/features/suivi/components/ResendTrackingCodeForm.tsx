"use client";

import { useActionState, useEffect, useState } from "react";
import { MailCheck, KeyRound, Send } from "lucide-react";
import { useToast } from "@/shared/ui/ToastProvider";
import { resendTrackingCode, type ResendCodeActionState } from "../actions";

/**
 * « J'ai perdu mon code » : l'écran de confirmation n'affiche plus le code de
 * suivi, l'email de soumission en est le seul porteur. Sans ce recours, un
 * candidat sans compte qui perd cet email n'a plus accès à son dossier.
 */
export function ResendTrackingCodeForm() {
  const [isOpen, setIsOpen] = useState(false);
  const { showToast } = useToast();

  const [state, formAction, isPending] = useActionState<
    ResendCodeActionState,
    FormData
  >(resendTrackingCode, {});

  useEffect(() => {
    if (state.error) {
      showToast({ type: "error", message: state.error });
    }
  }, [state, showToast]);

  // Confirmation volontairement neutre : ce formulaire public ne doit pas
  // révéler si une adresse a candidaté.
  if (state.success) {
    return (
      <div className="rounded-box border border-success/30 bg-success/10 p-4 flex gap-3">
        <MailCheck
          className="w-5 h-5 text-success shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <p className="text-sm text-base-content/80 text-left">
          Si une candidature existe pour cette adresse, son code de suivi vient
          d&apos;y être envoyé. Pensez à vérifier vos courriers indésirables.
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
        <KeyRound className="w-4 h-4" aria-hidden="true" />
        J&apos;ai perdu mon code de suivi
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-box border border-base-300 bg-base-100 p-4 space-y-2"
    >
      <p className="text-xs text-base-content/70 text-left">
        Indiquez l&apos;adresse utilisée lors du dépôt : nous y renverrons votre
        code de suivi.
      </p>
      <input
        name="email"
        type="email"
        className="input input-bordered input-sm w-full"
        placeholder="Email"
        autoComplete="email"
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
