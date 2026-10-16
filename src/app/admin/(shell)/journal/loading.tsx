export default function JournalLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="skeleton h-9 w-64 rounded-lg" />
        <div className="skeleton h-4 w-96 max-w-full rounded-lg" />
      </div>

      <div className="skeleton h-28 w-full rounded-xl" />

      <div className="overflow-hidden border border-base-300 rounded-xl bg-base-100">
        <div className="skeleton h-10 w-full rounded-none" />
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 px-4 py-3 border-t border-base-200"
          >
            <div className="skeleton h-4 w-36 rounded-lg" />
            <div className="skeleton h-4 w-48 rounded-lg" />
            <div className="skeleton h-5 w-28 rounded-full" />
            <div className="skeleton h-4 w-64 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
