"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerCandidate, type CandidateActionState } from "../actions";
import { useToast } from "@/shared/ui/ToastProvider";

export function RegisterForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [state, formAction, isPending] = useActionState<
    CandidateActionState,
    FormData
  >(registerCandidate, {});

  useEffect(() => {
    if (state.success) {
      showToast({
        type: "success",
        message: "Compte créé. Vous pouvez vous connecter.",
      });
      router.push("/candidat/login");
    }
    if (state.error) {
      showToast({ type: "error", message: state.error });
    }
  }, [state, router, showToast]);

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
        <input
          name="password"
          type="password"
          className="input input-bordered"
          placeholder="Mot de passe"
          required
        />
        <input
          name="confirmPassword"
          type="password"
          className="input input-bordered"
          placeholder="Confirmer le mot de passe"
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
