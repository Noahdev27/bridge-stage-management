import { auth, signOut } from "@/shared/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCandidateRequests } from "@/features/compte-candidat/actions";
import { STATUS_LABELS, TYPE_LABELS } from "@/shared/constants/domain";
import { LogOut, Search } from "lucide-react";

export default async function EspaceCandidatPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CANDIDATE") {
    redirect("/candidat/login");
  }

  const requests = await getCandidateRequests();

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <main className="min-h-screen bg-base-200">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Mon espace</h1>
            <p className="text-base-content/60 mt-1">{session.user.email}</p>
          </div>
          <form action={logout}>
            <button type="submit" className="btn btn-outline btn-sm gap-2">
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Déconnexion
            </button>
          </form>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/offres" className="btn btn-primary btn-sm">
            Voir les offres
          </Link>
          <Link href="/candidature" className="btn btn-outline btn-sm">
            Nouvelle candidature
          </Link>
          <Link href="/suivi" className="btn btn-ghost btn-sm gap-1">
            <Search className="w-4 h-4" aria-hidden="true" />
            Suivi par code
          </Link>
        </div>

        <section className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-lg">Mes demandes</h2>
            {requests.length === 0 ? (
              <p className="text-sm text-base-content/60">
                Aucune candidature associée à cet email pour le moment.
              </p>
            ) : (
              <ul className="divide-y divide-base-200">
                {requests.map((req) => (
                  <li
                    key={req.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  >
                    <div>
                      <p className="font-semibold">
                        {TYPE_LABELS[req.type]} — {req.trackingCode}
                      </p>
                      <p className="text-sm text-base-content/60">
                        Déposée le{" "}
                        {new Date(req.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <span className="badge badge-outline">
                      {STATUS_LABELS[req.status]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
