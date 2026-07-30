"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2, Mail } from "lucide-react";
import { useToast } from "@/shared/ui/ToastProvider";
import { deleteTutor } from "../actions";

type TutorRow = {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  _count: { tutoredRequests: number };
};

interface TutorAdminListProps {
  tutors: TutorRow[];
  canManage: boolean;
  currentUserId?: string;
}

export function TutorAdminList({
  tutors,
  canManage,
  currentUserId,
}: TutorAdminListProps) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleDelete = (tutor: TutorRow) => {
    const suffix =
      tutor._count.tutoredRequests > 0
        ? `\n\nCe tuteur est affecté à ${tutor._count.tutoredRequests} candidature(s). Ces dossiers seront libérés (aucun tuteur affecté) mais conservés.`
        : "\n\nCette action est irréversible.";
    const confirmed = window.confirm(
      `Supprimer le tuteur « ${tutor.name || tutor.email} » ?${suffix}`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteTutor(tutor.id);
      if (result.error) {
        showToast({ type: "error", message: result.error });
        return;
      }
      showToast({ type: "success", message: "Tuteur supprimé." });
    });
  };

  if (tutors.length === 0) {
    return (
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body p-8 text-center">
          <p className="text-base-content/60">
            {canManage
              ? "Aucun tuteur pour le moment. Cliquez sur « Nouveau tuteur » pour en créer un."
              : "Aucun tuteur pour le moment."}
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
            <th>Nom</th>
            <th>Email</th>
            <th className="text-center">Dossiers affectés</th>
            <th>Créé le</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tutors.map((tutor) => {
            const isSelf = tutor.id === currentUserId;
            return (
              <tr key={tutor.id} className="hover">
                <td>
                  <div className="font-semibold">
                    {tutor.name || <em>Sans nom</em>}
                    {isSelf && (
                      <span className="badge badge-ghost badge-sm ml-2">
                        Vous
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span className="inline-flex items-center gap-1.5 text-sm font-mono">
                    <Mail
                      className="w-3.5 h-3.5 text-base-content/50"
                      aria-hidden="true"
                    />
                    {tutor.email}
                  </span>
                </td>
                <td className="text-center">
                  <span className="badge badge-ghost">
                    {tutor._count.tutoredRequests}
                  </span>
                </td>
                <td className="text-sm text-base-content/70">
                  {new Date(tutor.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="text-right">
                  {canManage ? (
                    <div className="inline-flex gap-1">
                      <Link
                        href={`/admin/tuteurs/${tutor.id}`}
                        className="btn btn-ghost btn-sm btn-square text-primary"
                        aria-label="Modifier le tuteur"
                        title="Modifier le tuteur"
                      >
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(tutor)}
                        disabled={isPending || isSelf}
                        className="btn btn-ghost btn-sm btn-square text-error"
                        aria-label="Supprimer le tuteur"
                        title={
                          isSelf
                            ? "Vous ne pouvez pas supprimer votre propre compte"
                            : "Supprimer le tuteur"
                        }
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
