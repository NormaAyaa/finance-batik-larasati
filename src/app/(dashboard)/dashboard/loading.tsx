import React from "react";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Memuat data dashboard">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-48 bg-slate-200 rounded-md" />
        <div className="h-4 w-96 bg-slate-200 rounded-md" />
      </div>

      {/* 5 Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="w-8 h-8 rounded-lg bg-slate-200" />
            </div>
            <div className="h-7 w-32 bg-slate-200 rounded" />
            <div className="h-3 w-24 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="h-5 w-56 bg-slate-200 rounded" />
            <div className="h-3 w-72 bg-slate-200 rounded" />
          </div>
          <div className="h-4 w-40 bg-slate-200 rounded" />
        </div>
        <div className="h-52 w-full bg-slate-100 rounded-lg flex items-end justify-around p-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((bar) => (
            <div key={bar} className="flex gap-2 items-end h-full">
              <div className="w-6 bg-slate-200 rounded-t h-3/4" />
              <div className="w-6 bg-slate-200 rounded-t h-1/2" />
            </div>
          ))}
        </div>
      </div>

      {/* 2 Bottom Cards / Tables Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="h-5 w-48 bg-slate-200 rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((r) => (
              <div key={r} className="h-10 w-full bg-slate-100 rounded" />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="h-5 w-40 bg-slate-200 rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((r) => (
              <div key={r} className="h-10 w-full bg-slate-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
