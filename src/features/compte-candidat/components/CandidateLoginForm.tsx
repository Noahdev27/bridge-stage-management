"use client";

import { useState } from "react";
import Link from "next/link";
import { loginCandidate } from "../actions";
import { useToast } from "@/shared/ui/ToastProvider";

export function CandidateLoginForm() {
  const { showToast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await loginCandidate(formData);
    setIsPending(false);

    if (result?.error) {
      showToast({ type: "error", message: result.error });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="card bg-base-100 border border-base-300 shadow-xl"
    >
      <div className="card-body gap-3">
        <h1 className="card-title text-secondary">Espace candidat</h1>
        <p className="text-sm text-base-content/60">
          Connectez-vous pour retrouver vos dossiers liés à votre email.
        </p>
        <input
          name="email"
          type="email"
          className="input input-bordered"
          placeholder="Email"
          required
        />
        <input
          name="password"
          type="password"
          className="input input-bordered"
          placeholder="Mot de passe"
          required
        />
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? "Connexion…" : "Se connecter"}
        </button>
        <p className="text-sm text-base-content/60 text-center">
          Pas de compte ?{" "}
          <Link href="/candidat/inscription" className="link link-primary">
            S&apos;inscrire
          </Link>
        </p>
        <p className="text-xs text-center text-base-content/50">
          Ou{" "}
          <Link href="/suivi" className="link">
            suivez avec un code
          </Link>
        </p>
      </div>
    </form>
  );
}
