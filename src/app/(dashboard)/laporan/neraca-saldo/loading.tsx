export default function LoadingNeracaSaldo() {
  return (
    <div className="space-y-6 max-w-5xl animate-pulse">
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

      {/* Table skeleton */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 h-96"></div>
    </div>
  );
}
