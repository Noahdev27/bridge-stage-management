"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { registerCandidate, type CandidateActionState } from "../actions";
import { useToast } from "@/shared/ui/ToastProvider";
import { FormField } from "@/shared/ui/FormField";
import { PasswordInput } from "@/shared/ui/PasswordInput";

export function RegisterForm() {
  const { showToast } = useToast();
  const [state, formAction, isPending] = useActionState<
    CandidateActionState,
    FormData
  >(registerCandidate, {});

  useEffect(() => {
    if (state.error) {
      showToast({ type: "error", message: state.error });
    }
  }, [state, showToast]);

  // Pas de redirection vers la connexion : le compte n'est pas encore utilisable
  // tant que l'adresse n'est pas confirmée.
  if (state.verificationSent) {
    return (
      <div className="card bg-base-100 border border-base-300 shadow-xl">
        <div className="card-body items-center text-center gap-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/15 text-success">
            <MailCheck className="w-9 h-9" aria-hidden="true" />
          </div>
          <h1 className="card-title text-secondary">Vérifiez votre email</h1>
          <p className="text-sm text-base-content/70">
            Un lien de confirmation vient de vous être envoyé. Ouvrez-le pour
            activer votre espace candidat — le compte reste inactif jusque-là.
          </p>
          <p className="text-xs text-base-content/50">
            Le lien est valable 24 heures. Pensez à regarder vos courriers
            indésirables.
          </p>
          <Link href="/candidat/login" className="btn btn-outline btn-sm mt-2">
            Aller à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="card bg-base-100 border border-base-300 shadow-xl">
      <div className="card-body gap-3">
        <h1 className="card-title text-secondary">Créer un compte candidat</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Prénom">
            {(control) => (
              <input
                {...control}
                name="firstName"
                autoComplete="given-name"
                className="input w-full"
                required
              />
            )}
          </FormField>
          <FormField label="Nom">
            {(control) => (
              <input
                {...control}
                name="lastName"
                autoComplete="family-name"
                className="input w-full"
                required
              />
            )}
          </FormField>
        </div>
        <FormField
          label="Email"
          hint="Utilisez l'adresse avec laquelle vous avez postulé : un lien de confirmation y sera envoyé."
        >
          {(control) => (
            <input
              {...control}
              name="email"
              type="email"
              autoComplete="email"
              className="input w-full"
              placeholder="vous@exemple.com"
              required
            />
          )}
        </FormField>
        <FormField label="Mot de passe" hint="8 caractères minimum.">
          {(control) => (
            <PasswordInput
              {...control}
              name="password"
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              required
            />
          )}
        </FormField>
        <FormField label="Confirmer le mot de passe">
          {(control) => (
            <PasswordInput
              {...control}
              name="confirmPassword"
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              required
            />
          )}
        </FormField>
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? "Création…" : "Créer mon compte"}
        </button>
        <p className="text-sm text-base-content/60 text-center">
          Déjà inscrit ?{" "}
          <Link href="/candidat/login" className="link link-primary">
            Se connecter
          </Link>
        </p>
      </div>
    </form>
  );
}
