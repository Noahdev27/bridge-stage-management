import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  AuthorizationError,
  MANAGER_ROLES,
  requireStaff,
} from "@/shared/auth/guards";
import { getAllManagers } from "@/features/comptes-rh/queries";
import { RhAdminList } from "@/features/comptes-rh/components/RhAdminList";

export default async function ComptesRhPage() {
  let viewer;
  try {
    viewer = await requireStaff();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/admin/login");
    throw error;
  }

  const isManager = MANAGER_ROLES.includes(viewer.role);
  const managers = await getAllManagers();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comptes RH</h1>
          <p className="text-base-content/60 mt-1">
            Comptes autorisés à traiter les dossiers, gérer les offres et les
            tuteurs.
          </p>
        </div>
        {isManager && (
          <Link
            href="/admin/rh/nouveau"
            className="btn btn-primary gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Nouveau compte RH
          </Link>
        )}
      </div>

      {!isManager && (
        <div className="alert alert-info text-sm">
          <span>
            Vous consultez la liste en lecture seule. Seuls les rôles ADMIN et RH
            peuvent créer ou modifier des comptes RH.
          </span>
        </div>
      )}

      <RhAdminList
        managers={managers}
        canManage={isManager}
        currentUserId={viewer.id}
      />
    </div>
  );
}
