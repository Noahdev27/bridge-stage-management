/**
 * Silhouette de la liste d'offres, affichée pendant la requête base.
 * Reprend la grille de `OffersBrowser` pour éviter un saut de mise en page.
 */
export function OffersBrowserSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="max-w-sm space-y-2">
        <div className="skeleton h-4 w-28" />
        <div className="skeleton h-12 w-full" />
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i}>
            <div className="card bg-base-100 border border-base-300 h-full">
              <div className="card-body gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="skeleton h-6 w-2/3" />
                  <div className="skeleton h-5 w-20 shrink-0" />
                </div>
                <div className="space-y-2">
                  <div className="skeleton h-3 w-full" />
                  <div className="skeleton h-3 w-11/12" />
                  <div className="skeleton h-3 w-4/6" />
                </div>
                <div className="flex gap-3">
                  <div className="skeleton h-3 w-28" />
                  <div className="skeleton h-3 w-24" />
                </div>
                <div className="flex justify-end mt-auto">
                  <div className="skeleton h-8 w-24" />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
