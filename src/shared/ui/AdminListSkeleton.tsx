export function AdminListSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="skeleton h-9 w-72 rounded-lg" />
        <div className="skeleton h-4 w-96 max-w-full rounded-lg" />
      </div>

      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body p-5 gap-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="skeleton h-16 w-full sm:w-40 rounded-lg" />
            <div className="skeleton h-16 w-full sm:w-48 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="skeleton h-24 w-full rounded-box"
              />
            ))}
          </div>
          <div className="skeleton h-48 w-full rounded-box" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="skeleton h-7 w-56 rounded-lg" />
        <div className="skeleton h-32 w-full rounded-box" />
        <div className="overflow-hidden border border-base-300 rounded-xl bg-base-100">
          <div className="skeleton h-12 w-full rounded-none" />
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 px-4 py-4 border-t border-base-200"
            >
              <div className="skeleton h-5 w-36 rounded-lg" />
              <div className="skeleton h-5 w-28 rounded-lg" />
              <div className="skeleton h-5 w-24 rounded-lg" />
              <div className="skeleton h-6 w-20 rounded-full" />
              <div className="skeleton h-8 w-28 rounded-lg ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
