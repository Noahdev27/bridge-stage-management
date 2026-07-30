"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { registerCandidate, type CandidateActionState } from "../actions";
import { useToast } from "@/shared/ui/ToastProvider";

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
          <input
            name="firstName"
            className="input input-bordered"
            placeholder="Prénom"
            required
          />
          <input
            name="lastName"
            className="input input-bordered"
            placeholder="Nom"
            required
          />
        </div>
        <input
          name="email"
          type="email"
          className="input input-bordered"
          placeholder="Email"
          required
        />
        <p className="text-xs text-base-content/50 -mt-1">
          Utilisez l&apos;adresse avec laquelle vous avez postulé : un lien de
          confirmation y sera envoyé.
        </p>
        <input
          name="password"
          type="password"
          className="input input-bordered"
          placeholder="Mot de passe (8 caractères minimum)"
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          required
        />
        <input
          name="confirmPassword"
          type="password"
          className="input input-bordered"
          placeholder="Confirmer le mot de passe"
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          required
        />
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
