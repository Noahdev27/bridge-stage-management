"use client";

import { useTransition } from "react";
import Link from "next/link";
import type { Role } from "@prisma/client";
import { Pencil, Trash2, Mail, ShieldCheck } from "lucide-react";
import { useToast } from "@/shared/ui/ToastProvider";
import { ROLE_LABELS } from "@/shared/constants/domain";
import { deleteRh } from "../actions";

type ManagerRow = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: Date;
  _count: { evaluations: number };
};

interface RhAdminListProps {
  managers: ManagerRow[];
  canManage: boolean;
  currentUserId?: string;
}

export function RhAdminList({
  managers,
  canManage,
  currentUserId,
}: RhAdminListProps) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleDelete = (manager: ManagerRow) => {
    const suffix =
      manager._count.evaluations > 0
        ? `\n\nCe compte a rédigé ${manager._count.evaluations} évaluation(s). Elles seront conservées, mais ne seront plus signées.`
        : "\n\nCette action est irréversible.";
    const confirmed = window.confirm(
      `Supprimer le compte RH « ${manager.name || manager.email} » ?${suffix}`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteRh(manager.id);
      if (result.error) {
        showToast({ type: "error", message: result.error });
        return;
      }
      showToast({ type: "success", message: "Compte RH supprimé." });
    });
  };

  if (managers.length === 0) {
    return (
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body p-8 text-center">
          <p className="text-base-content/60">
            {canManage
              ? "Aucun compte gestionnaire. Cliquez sur « Nouveau compte RH » pour en créer un."
              : "Aucun compte gestionnaire."}
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
            <th>Rôle</th>
            <th className="text-center">Évaluations</th>
            <th>Créé le</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {managers.map((manager) => {
            const isSelf = manager.id === currentUserId;
            const isAdmin = manager.role === "ADMIN";
            return (
              <tr key={manager.id} className="hover">
                <td>
                  <div className="font-semibold">
                    {manager.name || <em>Sans nom</em>}
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
                    {manager.email}
                  </span>
                </td>
                <td>
                  <span
                    className={`badge badge-sm gap-1 ${
                      isAdmin ? "badge-secondary" : "badge-ghost"
                    }`}
                  >
                    {isAdmin && (
                      <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                    )}
                    {ROLE_LABELS[manager.role]}
                  </span>
                </td>
                <td className="text-center">
                  <span className="badge badge-ghost">
                    {manager._count.evaluations}
                  </span>
                </td>
                <td className="text-sm text-base-content/70">
                  {new Date(manager.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="text-right">
                  {/* Un compte ADMIN n'est ni modifiable ni supprimable depuis
                      cet écran : il encadre les RH, qui ne doivent pas pouvoir
                      le retirer. */}
                  {canManage && !isAdmin ? (
                    <div className="inline-flex gap-1">
                      <Link
                        href={`/admin/rh/${manager.id}`}
                        className="btn btn-ghost btn-sm btn-square text-primary"
                        aria-label="Modifier le compte RH"
                        title="Modifier le compte RH"
                      >
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(manager)}
                        disabled={isPending || isSelf}
                        className="btn btn-ghost btn-sm btn-square text-error"
                        aria-label="Supprimer le compte RH"
                        title={
                          isSelf
                            ? "Vous ne pouvez pas supprimer votre propre compte"
                            : "Supprimer le compte RH"
                        }
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-base-content/40">
                      {isAdmin ? "Non modifiable" : "Lecture seule"}
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
