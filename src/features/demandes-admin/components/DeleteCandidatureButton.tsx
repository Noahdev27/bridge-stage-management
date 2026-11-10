"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmAction } from "@/shared/ui/ConfirmAction";
import { useToast } from "@/shared/ui/ToastProvider";
import { deleteCandidature } from "../actions";

/** Suppression définitive d'un dossier, depuis sa page de détail. */
export function DeleteCandidatureButton({
  requestId,
  candidateName,
  hasAttestation,
}: {
  requestId: string;
  candidateName: string;
  hasAttestation: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();

  return (
    <ConfirmAction
      trigger={
        <>
          <Trash2 className="w-4 h-4" aria-hidden="true" />
          Supprimer le dossier
        </>
      }
      triggerClassName="btn btn-outline btn-error btn-sm gap-1.5"
      title="Supprimer ce dossier ?"
      description={
        <>
          <p>
            Le dossier de <strong>{candidateName}</strong>, ses documents et son
            évaluation seront définitivement effacés. Cette action est
            irréversible.
          </p>
          {hasAttestation && (
            <p className="text-error">
              Une attestation a été délivrée pour ce dossier : elle ne pourra
              plus être vérifiée ni retéléchargée.
            </p>
          )}
          <p>Le candidat n&apos;est pas prévenu.</p>
        </>
      }
      confirmLabel="Supprimer définitivement"
      onConfirm={async () => {
        const result = await deleteCandidature(requestId);
        if (result.success) {
          showToast({ type: "success", message: "Dossier supprimé." });
          router.replace("/admin");
        }
        return result;
      }}
    />
  );
}
