import { auth, signOut } from "@/shared/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getCandidateRequests,
  isCandidateEmailVerified,
} from "@/features/compte-candidat/actions";
import { STATUS_LABELS, TYPE_LABELS } from "@/shared/constants/domain";
import { formatTrackingCode } from "@/shared/tracking/tracking-code";
import { LogOut, Search, MailWarning, MessageSquareText } from "lucide-react";

export default async function EspaceCandidatPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CANDIDATE") {
    redirect("/candidat/login");
  }

  // Une session ouverte avant la mise en place de la vérification reste valide
  // (le JWT survit au déploiement) : on renvoie ce cas vers la connexion plutôt
  // que d'afficher un espace vide et incompréhensible.
  const isVerified = await isCandidateEmailVerified();

  if (!isVerified) {
    async function signOutUnverified() {
      "use server";
      await signOut({ redirectTo: "/candidat/login" });
    }

    return (
      <main className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card bg-base-100 border border-base-300 shadow-xl max-w-md w-full">
          <div className="card-body items-center text-center gap-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning/15 text-warning">
              <MailWarning className="w-9 h-9" aria-hidden="true" />
            </div>
            <h1 className="card-title text-secondary text-balance">
              Adresse email non confirmée
            </h1>
            <p className="text-sm text-base-content/70">
              Votre espace s&apos;ouvrira dès que vous aurez cliqué sur le lien
              de confirmation envoyé à{" "}
              {/* Une adresse longue déborderait de la carte sur mobile : elle
                  doit pouvoir se couper n'importe où. */}
              <strong className="break-all">{session.user.email}</strong>.
            </p>
            <form action={signOutUnverified} className="w-full">
              <button type="submit" className="btn btn-primary w-full">
                Retour à la connexion
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  const requests = await getCandidateRequests();

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <main className="min-h-screen bg-base-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5 sm:space-y-6">
        {/* En-tête empilé sur mobile : côte à côte, une adresse email longue
            écraserait le bouton de déconnexion. */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary">
              Mon espace
            </h1>
            <p className="text-sm sm:text-base text-base-content/60 mt-1 break-all">
              {session.user.email}
            </p>
          </div>
          <form action={logout} className="shrink-0">
            <button
              type="submit"
              className="btn btn-outline btn-sm gap-2 w-full sm:w-auto"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Déconnexion
            </button>
          </form>
        </div>

        {/* Deux colonnes sur mobile pour garder des cibles tactiles larges
            sans faire déborder la ligne. */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <Link href="/offres" className="btn btn-primary btn-sm">
            Voir les offres
          </Link>
          <Link href="/candidature" className="btn btn-outline btn-sm">
            Nouvelle candidature
          </Link>
          <Link
            href="/suivi"
            className="btn btn-ghost btn-sm gap-1 col-span-2 sm:col-span-1"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
            Suivi par code
          </Link>
        </div>

        <section className="card bg-base-100 border border-base-300">
          <div className="card-body p-4 sm:p-6">
            <h2 className="card-title text-lg">Mes demandes</h2>
            {requests.length === 0 ? (
              <p className="text-sm text-base-content/60">
                Aucune candidature associée à cet email pour le moment.
              </p>
            ) : (
              <ul className="divide-y divide-base-200">
                {requests.map((req) => (
                  <li key={req.id} className="py-3 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">{TYPE_LABELS[req.type]}</p>
                        {/* Le code de suivi fait 19 caractères en chasse fixe :
                            il doit pouvoir passer à la ligne sur petit écran. */}
                        <p className="text-sm font-mono text-base-content/70 break-all">
                          {formatTrackingCode(req.trackingCode)}
                        </p>
                        <p className="text-sm text-base-content/60">
                          Déposée le{" "}
                          {new Date(req.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <span className="badge badge-outline self-start sm:self-auto shrink-0">
                        {STATUS_LABELS[req.status]}
                      </span>
                    </div>

                    {/* Même message que sur `/suivi` et dans l'email de
                        décision : le candidat connecté ne doit pas avoir à
                        retrouver son code pour lire le motif qui le concerne.
                        La RH ne le renseigne qu'avec une décision finale. */}
                    {req.decisionComment && (
                      <div
                        className={`rounded-box border p-3 ${
                          req.status === "REJECTED"
                            ? "border-error/30 bg-error/5"
                            : "border-success/30 bg-success/5"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquareText
                            className={`w-4 h-4 shrink-0 ${
                              req.status === "REJECTED"
                                ? "text-error"
                                : "text-success"
                            }`}
                            aria-hidden="true"
                          />
                          <h3 className="text-sm font-semibold">
                            {req.status === "REJECTED"
                              ? "Motif du refus"
                              : "Message de l'équipe RH"}
                          </h3>
                        </div>
                        {/* whitespace-pre-line — texte libre multi-lignes. */}
                        <p className="text-sm text-base-content/70 whitespace-pre-line mt-1.5">
                          {req.decisionComment}
                        </p>
                      </div>
                    )}
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
