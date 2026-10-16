import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  AuthorizationError,
  MANAGER_ROLES,
  requireStaff,
} from "@/shared/auth/guards";
import { getAllOffers } from "@/features/offres/queries";
import { OfferAdminList } from "@/features/offres/components/admin/OfferAdminList";

export default async function AdminOffresPage() {
  let viewer;
  try {
    viewer = await requireStaff();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/admin/login");
    throw error;
  }

  const isManager = MANAGER_ROLES.includes(viewer.role);
  const offers = await getAllOffers();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Offres de stage</h1>
          <p className="text-base-content/60 mt-1">
            Gérez les offres visibles dans l&apos;espace candidat.
          </p>
        </div>
        {isManager && (
          <Link
            href="/admin/offres/nouveau"
            className="btn btn-primary gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Nouvelle offre
          </Link>
        )}
      </div>

      {!isManager && (
        <div className="alert alert-info text-sm">
          <span>
            Vous consultez les offres en lecture seule. Seuls les rôles ADMIN et
            RH peuvent en créer ou modifier.
          </span>
        </div>
      )}

      <OfferAdminList offers={offers} canManage={isManager} />
    </div>
  );
}
