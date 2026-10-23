export default function LoadingNeraca() {
  return (
    <div className="space-y-6 max-w-6xl animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-48 bg-slate-200 rounded"></div>
        <div className="h-7 w-64 bg-slate-200 rounded"></div>
        <div className="h-4 w-80 bg-slate-200 rounded"></div>
      </div>

      {/* Filter skeleton */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 h-24"></div>

      {/* Balance banner skeleton */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 h-16"></div>

      {/* Grid 2 Column skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 h-80"></div>
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 h-40"></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 h-40"></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 h-20"></div>
        </div>
      </div>
    </div>
  );
}
