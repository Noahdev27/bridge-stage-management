import type { RequestStatus } from "@prisma/client";
import { STATUS_BADGE, STATUS_LABELS } from "@/shared/constants/domain";

/** Affiche un badge DaisyUI coloré pour un statut de demande. */
export function StatusBadge({
  status,
  size = "sm",
}: {
  status: RequestStatus;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={`badge ${STATUS_BADGE[status]} ${
        size === "sm" ? "badge-sm" : "font-semibold px-2.5 py-1"
      }`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
