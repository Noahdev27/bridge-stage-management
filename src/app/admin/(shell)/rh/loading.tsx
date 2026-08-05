export default function ComptesRhLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <div className="skeleton h-9 w-48 rounded-lg" />
          <div className="skeleton h-4 w-96 max-w-full rounded-lg" />
        </div>
        <div className="skeleton h-10 w-48 rounded-lg" />
      </div>

      <div className="overflow-hidden border border-base-300 rounded-xl bg-base-100">
        <div className="skeleton h-12 w-full rounded-none" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 px-4 py-4 border-t border-base-200"
          >
            <div className="skeleton h-5 w-40 rounded-lg" />
            <div className="skeleton h-5 w-56 rounded-lg" />
            <div className="skeleton h-6 w-20 rounded-full" />
            <div className="skeleton h-6 w-12 rounded-full" />
            <div className="skeleton h-5 w-24 rounded-lg" />
            <div className="skeleton h-8 w-24 rounded-lg ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
