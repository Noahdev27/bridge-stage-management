import { auth } from "@/shared/auth/auth";
import { redirect } from "next/navigation";
// Étape A : Correction de l'import vers le chemin réel constaté
import { getCandidatures } from "@/features/demandes-admin/queries";
import { StatusFilter } from "@/features/demandes-admin/components/StatusFilter";
import Link from "next/link";

interface AdminPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  // 1. Protection Auth / Rôle
  const session = await auth();
  if (!session) {
    redirect("/admin/login");
  }

  // 2. Récupération du paramètre de filtre (on attend la promesse des searchParams sous Next 15+)
  const { status } = await searchParams;
  const candidatures = await getCandidatures(status);

  // Fonction utilitaire pour donner un style DaisyUI sympa aux badges de statut
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return "badge-warning";
      case "PROCESS": return "badge-info";
      case "ACCEPTED": return "badge-success text-white";
      case "REJECTED": return "badge-error text-white";
      default: return "badge-ghost";
    }
  };

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Espace Recrutement RH</h1>
          <p className="text-base-content/60 mt-1">Suivi et traitement des demandes de stage Bridges Technologies.</p>
        </div>
        <div className="text-sm text-base-content/50 bg-base-200 px-3 py-1.5 rounded-lg font-mono">
          Connecté : {session.user?.email}
        </div>
      </div>

      {/* Barre de filtrage par onglets */}
      <StatusFilter />

      {/* Tableau des candidatures */}
      <div className="overflow-x-auto border border-base-300 rounded-xl bg-base-100 shadow-sm">
        <table className="table table-zebra w-full">
          <thead>
            <tr className="bg-base-200/50">
              <th>Candidat</th>
              <th>Type de Stage</th>
              <th>Date de Soumission</th>
              <th>Statut</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {candidatures.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-base-content/50">
                  Aucune candidature trouvée pour ce statut.
                </td>
              </tr>
            ) : (
              candidatures.map((cand) => (
                <tr key={cand.id} className="hover">
                  <td>
                    <div className="font-bold">{cand.firstName} {cand.lastName}</div>
                  </td>
                  <td>
                    <span className="font-medium">
                      {cand.internshipType === "ACADEMIC" ? "🎓 Académique" : "💼 Professionnel"}
                    </span>
                  </td>
                  <td className="text-sm text-base-content/70">
                    {new Date(cand.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(cand.status)} font-semibold px-2.5 py-1`}>
                      {cand.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <Link 
                      href={`/admin/${cand.id}`} 
                      className="btn btn-sm btn-ghost text-primary hover:bg-primary/10"
                    >
                      Voir le dossier →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}