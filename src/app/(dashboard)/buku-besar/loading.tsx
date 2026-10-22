export default function BukuBesarLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-6 w-36 rounded-md bg-slate-200" />
        <div className="mt-2 h-3.5 w-72 rounded-md bg-slate-100" />
      </div>

      {/* Filter skeleton */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 space-y-2">
            <div className="h-3.5 w-28 rounded bg-slate-200" />
            <div className="h-10 w-full rounded-lg bg-slate-100" />
          </div>
          <div className="md:col-span-3 space-y-2">
            <div className="h-3.5 w-24 rounded bg-slate-200" />
            <div className="h-10 w-full rounded-lg bg-slate-100" />
          </div>
          <div className="md:col-span-3 space-y-2">
            <div className="h-3.5 w-24 rounded bg-slate-200" />
            <div className="h-10 w-full rounded-lg bg-slate-100" />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="h-6 w-48 rounded bg-slate-100" />
          <div className="h-8 w-36 rounded-lg bg-slate-200" />
        </div>
      </div>

      {/* Ringkasan Cards skeleton */}
      <div className="space-y-4">
        <div className="h-14 w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="h-3 w-20 rounded bg-slate-200 mb-2" />
              <div className="h-6 w-32 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabel skeleton */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="h-8 w-full rounded bg-slate-100" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-full rounded bg-slate-50" />
        ))}
      </div>
    </div>
  );
}
