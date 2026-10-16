import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Filter, ScrollText } from "lucide-react";
import { AuthorizationError, requireStaff } from "@/shared/auth/guards";
import {
  AUDIT_CATEGORY_LABELS,
  AUDIT_ACTIONS,
  auditActionLabel,
  type AuditAction,
  type AuditCategory,
} from "@/shared/audit/catalog";
import { ROLE_LABELS } from "@/shared/constants/domain";
import {
  AUDIT_PAGE_SIZE,
  getAuditActors,
  getAuditLogs,
  parseAuditFilters,
  resolveRequestNames,
  type AuditFilters,
} from "@/features/journal/queries";

interface JournalPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

// Le serveur tourne en UTC : sans fuseau explicite, chaque heure affichée
// serait décalée d'une heure pour une équipe basée à Douala.
const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Douala",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const CATEGORY_BADGE: Record<AuditCategory, string> = {
  dossiers: "badge-info",
  attestations: "badge-success",
  comptes: "badge-secondary",
  offres: "badge-accent",
  securite: "badge-neutral",
};

function actionBadge(code: string): string {
  if (code === "auth.login_failed") return "badge-error";
  if (code === "request.purged") return "badge-warning";
  const known = AUDIT_ACTIONS[code as AuditAction];
  return known ? CATEGORY_BADGE[known.category] : "badge-ghost";
}

function pageHref(filters: AuditFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.actor) params.set("actor", filters.actor);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/journal?${query}` : "/admin/journal";
}

export default async function JournalPage({ searchParams }: JournalPageProps) {
  let viewer;
  try {
    viewer = await requireStaff();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/admin/login");
    throw error;
  }

  // Le journal expose l'activité de toute l'équipe, connexions comprises :
  // il est réservé aux administrateurs.
  if (viewer.role !== "ADMIN") redirect("/admin");

  const filters = parseAuditFilters(await searchParams);
  const [{ entries, total }, actors] = await Promise.all([
    getAuditLogs(filters),
    getAuditActors(),
  ]);

  const requestNames = await resolveRequestNames(
    entries
      .filter((e) => e.targetType === "request" && e.targetId)
      .map((e) => e.targetId as string)
  );

  const pageCount = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));
  const hasFilters = !!filters.category || !!filters.actor;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight inline-flex items-center gap-3">
          <ScrollText className="w-7 h-7 text-primary" aria-hidden="true" />
          Journal d&apos;audit
        </h1>
        <p className="text-base-content/60 mt-1">
          Actions effectuées dans le back-office : qui a fait quoi, et quand.
          Les entrées ne peuvent être ni modifiées ni supprimées.
        </p>
      </div>

      {/* Formulaire GET : les filtres vivent dans l'URL, partageable et
          compatible avec la pagination, sans JavaScript côté client. */}
      <form
        method="get"
        className="card bg-base-100 border border-base-300"
      >
        <div className="card-body p-4 gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-base-content/70">
            <Filter className="w-4 h-4 text-primary" aria-hidden="true" />
            Filtres
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <label className="form-control">
              <span className="label py-1">
                <span className="label-text font-semibold">Catégorie</span>
              </span>
              <select
                name="category"
                defaultValue={filters.category ?? ""}
                className="select select-bordered select-sm w-full"
              >
                <option value="">Toutes</option>
                {(Object.keys(AUDIT_CATEGORY_LABELS) as AuditCategory[]).map(
                  (category) => (
                    <option key={category} value={category}>
                      {AUDIT_CATEGORY_LABELS[category]}
                    </option>
                  )
                )}
              </select>
            </label>
            <label className="form-control">
              <span className="label py-1">
                <span className="label-text font-semibold">Auteur</span>
              </span>
              <select
                name="actor"
                defaultValue={filters.actor ?? ""}
                className="select select-bordered select-sm w-full"
              >
                <option value="">Tous</option>
                {actors.map((actor) => (
                  <option key={actor} value={actor}>
                    {actor}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
              <button type="submit" className="btn btn-primary btn-sm flex-1 lg:flex-none">
                Appliquer
              </button>
              {hasFilters && (
                <Link href="/admin/journal" className="btn btn-ghost btn-sm">
                  Réinitialiser
                </Link>
              )}
            </div>
          </div>
        </div>
      </form>

      <div className="overflow-x-auto border border-base-300 rounded-xl bg-base-100 shadow-sm">
        <table className="table table-sm w-full">
          <thead>
            <tr className="bg-base-200/50">
              <th className="whitespace-nowrap">Date</th>
              <th>Auteur</th>
              <th>Action</th>
              <th>Détail</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-base-content/50">
                  {hasFilters
                    ? "Aucune entrée pour ces critères."
                    : "Aucune action enregistrée pour le moment."}
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const isFailedLogin = entry.action === "auth.login_failed";
                const candidateName =
                  entry.targetType === "request" && entry.targetId
                    ? requestNames.get(entry.targetId)
                    : undefined;

                return (
                  <tr key={entry.id} className={isFailedLogin ? "bg-error/5" : ""}>
                    <td className="whitespace-nowrap tabular-nums text-base-content/70">
                      {dateFormatter.format(entry.createdAt)}
                    </td>
                    <td className="min-w-48">
                      {/* Sur un échec de connexion, l'email est celui du compte
                          visé : l'auteur réel de la tentative est inconnu. */}
                      {isFailedLogin ? (
                        <>
                          <span className="block text-base-content/50 italic">
                            Inconnu
                          </span>
                          <span className="block text-xs text-base-content/60 break-all">
                            compte visé : {entry.actorEmail}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="block font-medium break-all">
                            {entry.actorEmail}
                          </span>
                          {entry.actorRole && entry.actorRole in ROLE_LABELS && (
                            <span className="block text-xs text-base-content/50">
                              {ROLE_LABELS[entry.actorRole as keyof typeof ROLE_LABELS]}
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge badge-sm whitespace-nowrap ${actionBadge(entry.action)}`}
                      >
                        {auditActionLabel(entry.action)}
                      </span>
                    </td>
                    <td className="min-w-64">
                      <span className="block">{entry.summary}</span>
                      {entry.targetType === "request" && entry.targetId && (
                        candidateName ? (
                          <Link
                            href={`/admin/${entry.targetId}`}
                            className="text-xs link link-primary"
                          >
                            Dossier de {candidateName}
                          </Link>
                        ) : (
                          <span className="text-xs text-base-content/40">
                            Dossier supprimé
                          </span>
                        )
                      )}
                      {entry.targetType === "offer" &&
                        entry.targetId &&
                        entry.action !== "offer.deleted" && (
                          <Link
                            href={`/admin/offres/${entry.targetId}`}
                            className="text-xs link link-primary"
                          >
                            Voir l&apos;offre
                          </Link>
                        )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-base-content/60">
        <span>
          {total} entrée{total > 1 ? "s" : ""}
          {pageCount > 1 && ` — page ${filters.page} sur ${pageCount}`}
        </span>
        {pageCount > 1 && (
          <div className="join">
            {filters.page > 1 ? (
              <Link href={pageHref(filters, filters.page - 1)} className="join-item btn btn-sm gap-1">
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                Plus récentes
              </Link>
            ) : (
              <span className="join-item btn btn-sm btn-disabled gap-1">
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                Plus récentes
              </span>
            )}
            {filters.page < pageCount ? (
              <Link href={pageHref(filters, filters.page + 1)} className="join-item btn btn-sm gap-1">
                Plus anciennes
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            ) : (
              <span className="join-item btn btn-sm btn-disabled gap-1">
                Plus anciennes
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
