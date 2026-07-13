"use client";

import { useTransition } from "react";
import { Settings2, Check, X } from "lucide-react";
import { updateCandidatureStatus } from "../actions";
import { useToast } from "@/shared/ui/ToastProvider";
import type { RequestStatus } from "@prisma/client";

interface StatusActionBarProps {
  requestId: string;
  status: RequestStatus;
}

export function StatusActionBar({ requestId, status }: StatusActionBarProps) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleStatusChange = (nextStatus: RequestStatus) => {
    startTransition(async () => {
      const result = await updateCandidatureStatus(requestId, nextStatus);
      if (result.error) {
        showToast({ type: "error", message: result.error });
        return;
      }
      showToast({ type: "success", message: "Statut de la demande mis à jour." });
    });
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {status !== "PROCESS" && status !== "ACCEPTED" && status !== "REJECTED" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleStatusChange("PROCESS")}
          className="btn btn-sm btn-info text-white gap-1.5"
        >
          <Settings2 className="w-4 h-4" aria-hidden="true" />
          Traiter
        </button>
      )}
      {status !== "ACCEPTED" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleStatusChange("ACCEPTED")}
          className="btn btn-sm btn-success text-white gap-1.5"
        >
          <Check className="w-4 h-4" aria-hidden="true" />
          Accepter
        </button>
      )}
      {status !== "REJECTED" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleStatusChange("REJECTED")}
          className="btn btn-sm btn-error text-white gap-1.5"
        >
          <X className="w-4 h-4" aria-hidden="true" />
          Refuser
        </button>
      )}
    </div>
  );
}
