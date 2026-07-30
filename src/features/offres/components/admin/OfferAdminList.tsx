"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
} from "lucide-react";
import type { InternshipOffer } from "@prisma/client";
import { DEPARTMENT_LABELS, TYPE_LABELS } from "@/shared/constants/domain";
import { useToast } from "@/shared/ui/ToastProvider";
import { deleteOffer, togglePublishOffer } from "../../actions";

type OfferWithCount = InternshipOffer & {
  _count: { requests: number };
};

interface OfferAdminListProps {
  offers: OfferWithCount[];
  canManage: boolean;
}

export function OfferAdminList({ offers, canManage }: OfferAdminListProps) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleTogglePublish = (offer: OfferWithCount) => {
    startTransition(async () => {
      const result = await togglePublishOffer(offer.id, !offer.isPublished);
      if (result.error) {
        showToast({ type: "error", message: result.error });
        return;
      }
      showToast({
        type: "success",
        message: offer.isPublished
          ? "Offre dépubliée."
          : "Offre publiée dans l'espace candidat.",
      });
    });
  };

  const handleDelete = (offer: OfferWithCount) => {
    const suffix =
      offer._count.requests > 0
        ? `\n\nCette offre est référencée par ${offer._count.requests} candidature(s). Elle sera dépubliée plutôt que supprimée pour préserver l'historique.`
        : "\n\nCette action est irréversible.";
    const confirmed = window.confirm(
      `Supprimer l'offre « ${offer.title} » ?${suffix}`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteOffer(offer.id);
      if (result.error && !result.success) {
        showToast({ type: "error", message: result.error });
        return;
      }
      if (result.success) {
        showToast({ type: "success", message: "Offre supprimée." });
      }
    });
  };

  if (offers.length === 0) {
    return (
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body p-8 text-center">
          <p className="text-base-content/60">
            Aucune offre pour le moment. Cliquez sur « Nouvelle offre » pour en
            créer une.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-base-300 rounded-xl bg-base-100 shadow-sm">
      <table className="table table-zebra w-full">
        <thead>
          <tr className="bg-base-200/50">
            <th>Titre</th>
            <th>Département</th>
            <th>Type</th>
            <th className="text-center">Durée</th>
            <th className="text-center">Candidatures</th>
            <th className="text-center">Publication</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => (
            <tr key={offer.id} className="hover">
              <td>
                <div className="font-semibold">{offer.title}</div>
                <div className="text-xs text-base-content/50 mt-0.5">
                  Créée le{" "}
                  {new Date(offer.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </td>
              <td>
                <span className="inline-flex items-center gap-1 text-sm">
                  <Building2
                    className="w-3.5 h-3.5 text-base-content/50"
                    aria-hidden="true"
                  />
                  {DEPARTMENT_LABELS[offer.department]}
                </span>
              </td>
              <td>
                <span className="inline-flex items-center gap-1 text-sm">
                  <Briefcase
                    className="w-3.5 h-3.5 text-base-content/50"
                    aria-hidden="true"
                  />
                  {TYPE_LABELS[offer.type]}
                </span>
              </td>
              <td className="text-center text-sm">
                {offer.durationMonths} mois
              </td>
              <td className="text-center">
                <span className="badge badge-ghost">
                  {offer._count.requests}
                </span>
              </td>
              <td className="text-center">
                {offer.isPublished ? (
                  <span className="badge badge-success gap-1">
                    <Eye className="w-3 h-3" aria-hidden="true" />
                    Publiée
                  </span>
                ) : (
                  <span className="badge badge-ghost gap-1">
                    <EyeOff className="w-3 h-3" aria-hidden="true" />
                    Masquée
                  </span>
                )}
              </td>
              <td className="text-right">
                {canManage ? (
                  <div className="inline-flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(offer)}
                      disabled={isPending}
                      className="btn btn-ghost btn-sm btn-square"
                      aria-label={
                        offer.isPublished
                          ? "Dépublier l'offre"
                          : "Publier l'offre"
                      }
                      title={
                        offer.isPublished
                          ? "Dépublier l'offre"
                          : "Publier l'offre"
                      }
                    >
                      {offer.isPublished ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                    <Link
                      href={`/admin/offres/${offer.id}`}
                      className="btn btn-ghost btn-sm btn-square text-primary"
                      aria-label="Modifier l'offre"
                      title="Modifier l'offre"
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(offer)}
                      disabled={isPending}
                      className="btn btn-ghost btn-sm btn-square text-error"
                      aria-label="Supprimer l'offre"
                      title="Supprimer l'offre"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-base-content/40">
                    Lecture seule
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
