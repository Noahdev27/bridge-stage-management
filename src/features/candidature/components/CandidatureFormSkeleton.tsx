export function CandidatureFormSkeleton() {
  return (
    <div
      className="max-w-2xl mx-auto space-y-8 animate-pulse"
      aria-busy="true"
      aria-label="Envoi de la candidature en cours"
    >
      <div className="space-y-4">
        <div className="flex justify-between gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton h-2 flex-1 rounded-full" />
          ))}
        </div>
        <div className="flex justify-between">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton h-3 w-12 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="skeleton h-8 w-64 rounded-lg" />
        <div className="skeleton h-4 w-full max-w-sm rounded-lg" />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="skeleton h-12 w-full rounded-lg" />
          <div className="skeleton h-12 w-full rounded-lg" />
        </div>
        <div className="skeleton h-12 w-full rounded-lg" />
        <div className="skeleton h-12 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="skeleton h-12 w-full rounded-lg" />
          <div className="skeleton h-12 w-full rounded-lg" />
        </div>
        <div className="skeleton h-24 w-full rounded-box" />
      </div>

      <div className="flex gap-4">
        <div className="skeleton h-12 flex-1 rounded-lg" />
        <div className="skeleton h-12 flex-1 rounded-lg" />
      </div>
    </div>
  );
}
