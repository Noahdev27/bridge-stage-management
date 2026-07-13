export function SuiviResultSkeleton() {
  return (
    <div
      className="card bg-base-100 shadow-xl border border-base-300 animate-pulse"
      aria-busy="true"
      aria-label="Chargement du dossier"
    >
      <div className="card-body p-6 space-y-5">
        <div className="flex items-start justify-between gap-3 border-b border-base-200 pb-4">
          <div className="space-y-2 flex-1">
            <div className="skeleton h-6 w-48 rounded-lg" />
            <div className="skeleton h-4 w-28 rounded-lg" />
          </div>
          <div className="skeleton h-7 w-24 rounded-full" />
        </div>

        <div className="flex justify-between gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="skeleton h-4 flex-1 rounded-lg" />
          ))}
        </div>

        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 py-1">
              <div className="skeleton h-4 w-4 rounded-full shrink-0" />
              <div className="skeleton h-4 w-28 rounded-lg" />
              <div className="skeleton h-4 w-32 rounded-lg ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
