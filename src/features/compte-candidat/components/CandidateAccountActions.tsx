"use client";

import { Trash2, UserX } from "lucide-react";
import { ConfirmAction } from "@/shared/ui/ConfirmAction";
import { deleteCandidateAccount, withdrawCandidature } from "../actions";

/** Retrait d'une candidature encore en attente ou en traitement. */
export function WithdrawCandidatureButton({ requestId }: { requestId: string }) {
  return (
    <ConfirmAction
      trigger={
        <>
          <Trash2 className="w-4 h-4" aria-hidden="true" />
          Retirer ma candidature
        </>
      }
      triggerClassName="btn btn-ghost btn-sm gap-1.5 text-error w-full sm:w-auto"
      title="Retirer cette candidature ?"
      description={
        <>
          <p>
            Votre dossier et tous ses documents seront définitivement supprimés.
            L&apos;équipe RH ne pourra plus l&apos;étudier.
          </p>
          <p>Pour postuler à nouveau, il faudra déposer un nouveau dossier.</p>
        </>
      }
      confirmLabel="Retirer définitivement"
      onConfirm={() => withdrawCandidature(requestId)}
      successMessage="Candidature retirée."
    />
  );
}

/** Suppression du compte candidat par son titulaire. */
export function DeleteAccountSection() {
  return (
    <section className="card bg-base-100 border border-error/30">
      <div className="card-body p-4 sm:p-6 gap-3">
        <h2 className="card-title text-lg">Supprimer mon compte</h2>
        <p className="text-sm text-base-content/70">
          Votre compte et vos candidatures encore en attente seront supprimés.
          Les dossiers ayant déjà reçu une décision restent gérés par
          l&apos;équipe RH (un dossier refusé est effacé automatiquement au bout
          de 6 mois).
        </p>
        <div>
          <ConfirmAction
            trigger={
              <>
                <UserX className="w-4 h-4" aria-hidden="true" />
                Supprimer mon compte
              </>
            }
            triggerClassName="btn btn-outline btn-error btn-sm gap-1.5"
            title="Supprimer votre compte ?"
            description={
              <p>
                Cette action est définitive. Vous serez déconnecté et vos
                candidatures en attente seront retirées.
              </p>
            }
            confirmLabel="Supprimer mon compte"
            onConfirm={deleteCandidateAccount}
          />
        </div>
      </div>
    </section>
  );
}
