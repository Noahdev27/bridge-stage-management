"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { purgeRejectedApplications } from "../actions";
import { useToast } from "@/shared/ui/ToastProvider";
import { REJECTED_PURGE_MONTHS } from "@/shared/constants/domain";

interface PurgeRejectedPanelProps {
  eligibleCount: number;
}

export function PurgeRejectedPanel({ eligibleCount }: PurgeRejectedPanelProps) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handlePurge = () => {
    const confirmed = window.confirm(
      `Purger ${eligibleCount} dossier(s) rejeté(s) depuis plus de ${REJECTED_PURGE_MONTHS} mois ?\n\nLes documents Supabase seront supprimés et les données personnelles effacées. Cette action est irréversible.`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await purgeRejectedApplications();
      if (result.error) {
        showToast({ type: "error", message: result.error });
        return;
      }

      const count = result.purgedCount ?? 0;
      showToast({
        type: "success",
        message:
          count === 0
            ? "Aucun dossier éligible à la purge."
            : `${count} dossier(s) purgé(s) conformément au RGPD.`,
      });
    });
  };

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body p-4 sm:p-5 flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-secondary">Purge RGPD</h3>
          <p className="text-sm text-base-content/60 mt-1">
            Suppression des documents et des données personnelles des candidatures
            rejetées depuis plus de {REJECTED_PURGE_MONTHS} mois.
          </p>
          <p className="text-sm font-medium mt-2">
            {eligibleCount === 0
              ? "Aucun dossier éligible pour le moment."
              : `${eligibleCount} dossier(s) éligible(s) à la purge.`}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-error btn-sm gap-2 shrink-0"
          disabled={isPending || eligibleCount === 0}
          onClick={handlePurge}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
          {isPending ? "Purge en cours…" : "Purger les dossiers"}
        </button>
      </div>
    </div>
  );
}
