export default function ParametresLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="skeleton h-9 w-40 rounded-lg" />
        <div className="skeleton h-4 w-80 rounded-lg" />
      </div>

      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body p-5 gap-4">
          <div className="skeleton h-6 w-32 rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="skeleton h-14 w-full rounded-lg" />
            <div className="skeleton h-14 w-full rounded-lg" />
          </div>
          <div className="skeleton h-14 w-full rounded-lg" />
          <div className="skeleton h-9 w-40 rounded-lg" />
        </div>
      </div>

      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body p-5 gap-4">
          <div className="skeleton h-6 w-56 rounded-lg" />
          <div className="skeleton h-14 w-full rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="skeleton h-14 w-full rounded-lg" />
            <div className="skeleton h-14 w-full rounded-lg" />
          </div>
          <div className="skeleton h-9 w-48 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
