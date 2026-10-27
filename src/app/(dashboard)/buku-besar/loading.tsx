export default function BukuBesarLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-32 rounded-full bg-amber-950/50" />
        <div className="h-8 w-56 rounded-xl bg-[#141210] border border-amber-900/20" />
        <div className="h-4 w-96 rounded-lg bg-[#141210]" />
      </div>

      {/* Filter skeleton */}
      <div className="sogan-card rounded-2xl border border-amber-900/20 bg-[#0e0c0a] p-6 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 space-y-2">
            <div className="h-4 w-36 rounded bg-[#1a1714]" />
            <div className="h-12 w-full rounded-xl bg-[#141210] border border-amber-900/20" />
          </div>
          <div className="md:col-span-3 space-y-2">
            <div className="h-4 w-28 rounded bg-[#1a1714]" />
            <div className="h-12 w-full rounded-xl bg-[#141210] border border-amber-900/20" />
          </div>
          <div className="md:col-span-3 space-y-2">
            <div className="h-4 w-28 rounded bg-[#1a1714]" />
            <div className="h-12 w-full rounded-xl bg-[#141210] border border-amber-900/20" />
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-amber-900/20">
          <div className="h-8 w-64 rounded-xl bg-[#141210]" />
          <div className="h-10 w-48 rounded-xl bg-amber-950/40 border border-amber-500/30" />
        </div>
      </div>

      {/* Ringkasan Cards skeleton */}
      <div className="space-y-4">
        <div className="h-20 w-full rounded-2xl border border-amber-900/20 bg-[#0e0c0a] p-5 shadow-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border border-amber-900/20 bg-[#0e0c0a] p-5 shadow-lg space-y-3">
              <div className="h-4 w-24 rounded bg-[#1a1714]" />
              <div className="h-8 w-40 rounded-lg bg-[#141210]" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabel skeleton */}
      <div className="sogan-card rounded-2xl border border-amber-900/20 bg-[#0e0c0a] p-5 shadow-xl space-y-3">
        <div className="h-10 w-full rounded-xl bg-[#141210]" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 w-full rounded-xl bg-[#141210]/60 border border-amber-900/10" />
        ))}
      </div>
    </div>
  );
}
