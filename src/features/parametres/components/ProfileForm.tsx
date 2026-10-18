"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, UserCircle } from "lucide-react";
import { useToast } from "@/shared/ui/ToastProvider";
import { updateProfileName, type ParametresActionState } from "../actions";
import { ROLE_LABELS } from "@/shared/constants/domain";
import type { Role } from "@prisma/client";

interface ProfileFormProps {
  email: string;
  role: Role;
  currentName: string | null;
}

export function ProfileForm({ email, role, currentName }: ProfileFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [state, formAction, isPending] = useActionState<
    ParametresActionState,
    FormData
  >(updateProfileName, {});

  useEffect(() => {
    if (!state.success) return;
    showToast({ type: "success", message: "Profil mis à jour." });
    router.refresh();
  }, [state, router, showToast]);

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body p-5 gap-4">
        <div className="flex items-center gap-2 border-b border-base-200 pb-3">
          <UserCircle className="w-5 h-5 text-primary" aria-hidden="true" />
          <h2 className="card-title text-lg">Mon profil</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-base-content">Email</span>
            </span>
            <input
              type="email"
              value={email}
              disabled
              className="input w-full bg-base-200 text-base-content/60 font-mono"
            />
            <span className="text-xs text-base-content/50 mt-1">
              Identifiant de connexion, non modifiable ici.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-base-content">Rôle</span>
            </span>
            <input
              type="text"
              value={ROLE_LABELS[role]}
              disabled
              className="input w-full bg-base-200 text-base-content/60"
            />
          </div>
        </div>

        <form action={formAction} className="space-y-3 pt-2">
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-base-content">
                Nom affiché <span className="text-error">*</span>
              </span>
            </span>
            <input
              type="text"
              name="name"
              defaultValue={currentName ?? ""}
              placeholder="Ex : Marie Ndongo"
              className={`input w-full ${
                fieldErrors.name ? "input-error" : ""
              }`}
              maxLength={100}
              required
            />
            {fieldErrors.name && (
              <span className="text-xs text-error mt-1">
                {fieldErrors.name}
              </span>
            )}
          </label>

          {state.error && (
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
            {isPending ? "Enregistrement…" : "Enregistrer le nom"}
          </button>
        </form>
      </div>
    </div>
  );
}
