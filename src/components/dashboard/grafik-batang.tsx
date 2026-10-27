"use client";

import React, { useState } from "react";
import { formatRupiah } from "@/lib/utils/formatters";

export interface MonthlyFinancialData {
  periodeLabel: string; // e.g. "Jul 2026"
  pendapatan: number;
  beban: number;
  labaRugi: number;
}

interface GrafikBatangProps {
  data: MonthlyFinancialData[];
}

/**
 * Format angka rupiah ringkas (misal: "Rp 49,4 jt" atau "Rp 0")
 */
function formatRingkas(amount: number): string {
  if (amount === 0) return "Rp 0";
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) {
    const val = (amount / 1_000_000_000).toFixed(1).replace(".", ",");
    return `Rp ${val} M`;
  }
  if (abs >= 1_000_000) {
    const val = (amount / 1_000_000).toFixed(1).replace(".", ",");
    return `Rp ${val} jt`;
  }
  if (abs >= 1_000) {
    const val = (amount / 1_000).toFixed(0);
    return `Rp ${val} rb`;
  }
  return `Rp ${amount}`;
}

/**
 * Menghasilkan kurva Bezier halus (Catmull-Rom Spline) persis seperti Referensi Gambar 1
 */
function getSplinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    const cp1x = points[0].x + (points[1].x - points[0].x) / 3;
    const cp2x = points[0].x + (2 * (points[1].x - points[0].x)) / 3;
    return `M ${points[0].x} ${points[0].y} C ${cp1x.toFixed(1)} ${points[0].y.toFixed(1)}, ${cp2x.toFixed(1)} ${points[1].y.toFixed(1)}, ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
  }

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : points.length - 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export function GrafikBatang({ data }: GrafikBatangProps) {
  // Mode tampilan: "spline" (Model Referensi Gambar 1, default), "bar" (Diagram Batang PRD), atau "table"
  const [viewMode, setViewMode] = useState<"spline" | "bar" | "table">("spline");

  // Titik aktif yang disorot (default bulan terakhir)
  const [activeIndex, setActiveIndex] = useState<number>(() =>
    data && data.length > 0 ? data.length - 1 : 0
  );

  if (!data || data.length === 0) {
    return (
      <div className="sogan-card p-8 text-center border-dashed border-amber-900/30">
        <p className="text-sm font-semibold text-[#fdfaf6]">Belum Ada Data Periode</p>
        <p className="text-xs text-[#a89f91] mt-1">
          Grafik pendapatan dan beban akan tampil secara otomatis setelah ada periode buku aktif.
        </p>
      </div>
    );
  }

  const activeItem = data[activeIndex] || data[data.length - 1];
  const isSurplus = activeItem.labaRugi >= 0;

  // Nilai maksimum untuk skala grafik (minimal 1 juta)
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.pendapatan, d.beban)),
    1_000_000
  );
  const yCeil = Math.ceil((maxVal * 1.2) / 10_000_000) * 10_000_000 || maxVal * 1.25;

  // Dimensi SVG
  const svgWidth = 720;
  const svgHeight = 270;
  const marginTop = 50;
  const marginBottom = 45;
  const marginLeft = 55;
  const marginRight = 45;

  const chartWidth = svgWidth - marginLeft - marginRight;
  const chartHeight = svgHeight - marginTop - marginBottom;

  // Koordinat titik untuk setiap bulan
  const stepX = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth / 2;

  const pointsPendapatan = data.map((d, i) => {
    const x = marginLeft + i * stepX;
    const y = marginTop + chartHeight - (d.pendapatan / yCeil) * chartHeight;
    return { x, y, data: d };
  });

  const pointsBeban = data.map((d, i) => {
    const x = marginLeft + i * stepX;
    const y = marginTop + chartHeight - (d.beban / yCeil) * chartHeight;
    return { x, y, data: d };
  });

  const pathSplinePendapatan = getSplinePath(pointsPendapatan);
  const pathSplineBeban = getSplinePath(pointsBeban);

  // Area glow halus di bawah kurva pendapatan
  const pathAreaPendapatan =
    pointsPendapatan.length > 0
      ? `${pathSplinePendapatan} L ${pointsPendapatan[pointsPendapatan.length - 1].x} ${marginTop + chartHeight} L ${pointsPendapatan[0].x} ${marginTop + chartHeight} Z`
      : "";

  // Hitung persentase tren vs bulan sebelumnya
  const prevItem = activeIndex > 0 ? data[activeIndex - 1] : null;
  const growthPend =
    prevItem && prevItem.pendapatan > 0
      ? (((activeItem.pendapatan - prevItem.pendapatan) / prevItem.pendapatan) * 100).toFixed(1)
      : "+0.0";

  return (
    <div className="sogan-card p-5 sm:p-6 select-none relative overflow-hidden">
      {/* ============================================================ */}
      {/* 1. TOP HEADER: TANGGAL / FILTER & SWITCHER VIEW              */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-900/20">
        <div className="flex items-center gap-2.5">
          {/* Pill Kalender Periode (Sesuai Gambar 1: [📅 YTD / 6 Bulan]) */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#161310] border border-amber-900/40 text-xs font-semibold text-[#fdfaf6] shadow-inner">
            <span aria-hidden="true" className="text-amber-400">📅</span>
            <span>6 Bulan Terakhir</span>
          </div>

          <span className="text-[11px] text-[#a89f91]">
            CV Batik Larasati • Surakarta
          </span>
        </div>

        {/* Toggle Mode: Model Gelombang (Gbr 1) vs Batang vs Tabel */}
        <div className="flex items-center gap-1.5 bg-[#141210] p-1 rounded-xl border border-amber-900/30 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("spline")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              viewMode === "spline"
                ? "bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                : "text-[#a89f91] hover:text-[#fdfaf6]"
            }`}
          >
            Kurva Halus (Gbr 1)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("bar")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              viewMode === "bar"
                ? "bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                : "text-[#a89f91] hover:text-[#fdfaf6]"
            }`}
          >
            Diagram Batang
          </button>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "table" ? "spline" : "table")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              viewMode === "table"
                ? "bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                : "text-[#a89f91] hover:text-[#fdfaf6]"
            }`}
          >
            Tabel Data
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. STATS SUMMARY ROW (PERSIS SEPERTI GAMBAR 1)               */}
      {/* ============================================================ */}
      <div className="pt-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          {/* Angka Besar Total Pendapatan Bulan Terpilih */}
          <div className="flex items-baseline gap-3">
            <span className="text-2xl sm:text-3xl font-black text-[#fdfaf6] tracking-tight">
              {formatRingkas(activeItem.pendapatan)}
            </span>
            <span className="text-xs font-mono text-[#a89f91]">
              ({formatRupiah(activeItem.pendapatan)})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 mt-1">
            <span className="text-xs text-[#a89f91] font-medium">
              Pendapatan {activeItem.periodeLabel}
            </span>

            {/* Pill Pertumbuhan MoM (seperti +3.43% di Gbr 1) */}
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                Number(growthPend) >= 0
                  ? "bg-emerald-950/70 text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-950/70 text-rose-300 border border-rose-500/30"
              }`}
            >
              <span>{Number(growthPend) >= 0 ? "↗ +" : "↘ "}</span>
              <span>{Math.abs(Number(growthPend))}% MoM</span>
            </span>

            {/* Pill Status Operasional (seperti [● On track] di Gbr 1) */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isSurplus
                  ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  : "bg-rose-950/80 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              <span>{isSurplus ? "Surplus Operasional" : "Defisit Operasional"}</span>
            </span>
          </div>
        </div>

        {/* Legenda Kurva (Sesuai Gambar 1: ● This Year (Orange) / ● Last Year (White)) */}
        <div className="flex items-center gap-5 text-xs font-medium">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveIndex(data.length - 1)}>
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
            <span className="text-orange-300 font-semibold">Pendapatan Usaha</span>
          </div>

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveIndex(data.length - 1)}>
            <span className="w-2.5 h-2.5 rounded-full bg-[#fdfaf6] shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
            <span className="text-[#e2e8f0]">Beban Operasional</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. VISUALISASI SVG: MODEL KURVA HALUS (GAMBAR 1)             */}
      {/* ============================================================ */}
      {viewMode === "spline" && (
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[560px]">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto font-sans"
              role="img"
              aria-label="Grafik Gelombang Garis Halus Pendapatan dan Beban"
            >
              <defs>
                {/* Gradasi Oranye Emas Bercahaya untuk Garis Pendapatan */}
                <linearGradient id="splineOrangeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>

                {/* Gradasi Area Pendar Transparan di Bawah Pendapatan */}
                <linearGradient id="areaGlowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.22" />
                  <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>

                {/* Filter Glow Menawan */}
                <filter id="splineGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Garis Grid Horizontal Redup Tipis */}
              {[0, 0.5, 1].map((ratio, i) => {
                const y = marginTop + chartHeight - ratio * chartHeight;
                return (
                  <line
                    key={i}
                    x1={marginLeft}
                    y1={y}
                    x2={svgWidth - marginRight}
                    y2={y}
                    stroke="rgba(245, 158, 11, 0.08)"
                    strokeDasharray={ratio === 0 ? "none" : "3 3"}
                    strokeWidth="1"
                  />
                );
              })}

              {/* Pendar Area Halus di Bawah Kurva Pendapatan */}
              {pathAreaPendapatan && (
                <path d={pathAreaPendapatan} fill="url(#areaGlowGrad)" />
              )}

              {/* ======================================================== */}
              {/* KURVA BEBAN: PUTIH / SILVER GELOMBANG HALUS (Gbr 1)     */}
              {/* ======================================================== */}
              <path
                d={pathSplineBeban}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
              />

              {/* ======================================================== */}
              {/* KURVA PENDAPATAN: ORANYE/EMAS BERCAHAYA (Gbr 1)         */}
              {/* ======================================================== */}
              <path
                d={pathSplinePendapatan}
                fill="none"
                stroke="url(#splineOrangeGrad)"
                strokeWidth="3.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#splineGlow)"
              />

              {/* ======================================================== */}
              {/* INTERAKSI TITIK & POPUP TOOLTIP ORANYE (PERSIS GBR 1)    */}
              {/* ======================================================== */}
              {data.map((item, idx) => {
                const ptPend = pointsPendapatan[idx];
                const ptBeban = pointsBeban[idx];
                const isSelected = idx === activeIndex;

                return (
                  <g
                    key={item.periodeLabel}
                    className="cursor-pointer"
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => setActiveIndex(idx)}
                  >
                    {/* Area Klik Transparan Lebih Luas */}
                    <rect
                      x={ptPend.x - stepX / 2}
                      y={marginTop}
                      width={stepX}
                      height={chartHeight + 35}
                      fill="transparent"
                    />

                    {/* Titik Kurva Beban (Putih) */}
                    <circle
                      cx={ptBeban.x}
                      cy={ptBeban.y}
                      r={isSelected ? "4" : "2.5"}
                      fill="#ffffff"
                      opacity={isSelected ? 1 : 0.6}
                    />

                    {/* Titik Kurva Pendapatan (Oranye) */}
                    {isSelected ? (
                      // Titik Aktif dengan Cincin Konsentris Ganda (seperti di Gbr 1)
                      <g>
                        {/* Lingkaran Luar Berpendar */}
                        <circle
                          cx={ptPend.x}
                          cy={ptPend.y}
                          r="7.5"
                          fill="#0f0d0b"
                          stroke="#f97316"
                          strokeWidth="2.8"
                          className="animate-pulse"
                        />
                        {/* Lingkaran Dalam */}
                        <circle
                          cx={ptPend.x}
                          cy={ptPend.y}
                          r="3"
                          fill="#f97316"
                        />

                        {/* ============================================== */}
                        {/* BADGE TOOLTIP POPUP ORANYE (PERSIS GBR 1)      */}
                        {/* ============================================== */}
                        <g transform={`translate(${ptPend.x}, ${ptPend.y - 34})`}>
                          {/* Kotak Pill Oranye dengan Bayangan */}
                          <rect
                            x="-38"
                            y="-16"
                            width="76"
                            height="24"
                            rx="12"
                            fill="#f97316"
                            className="shadow-xl"
                          />
                          {/* Panah Segitiga Menunjuk ke Titik (Beak) */}
                          <polygon
                            points="-5,8 5,8 0,13"
                            fill="#f97316"
                          />
                          {/* Teks Nominal di Dalam Pill */}
                          <text
                            x="0"
                            y="1"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#ffffff"
                            className="text-[11px] font-black tracking-tight font-mono"
                          >
                            {formatRingkas(item.pendapatan)}
                          </text>
                        </g>
                      </g>
                    ) : (
                      <circle
                        cx={ptPend.x}
                        cy={ptPend.y}
                        r="3"
                        fill="#f97316"
                        opacity="0.8"
                      />
                    )}

                    {/* Label Bulan pada Sumbu X (seperti JAN, FEB, MAR di Gbr 1) */}
                    <text
                      x={ptPend.x}
                      y={marginTop + chartHeight + 25}
                      textAnchor="middle"
                      className={`text-[11px] font-bold uppercase transition ${
                        isSelected ? "fill-amber-300 text-xs" : "fill-[#78716c]"
                      }`}
                    >
                      {item.periodeLabel.split(" ")[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. MODE ALTERNATIF: DIAGRAM BATANG (PRD SEKSI 9)             */}
      {/* ============================================================ */}
      {viewMode === "bar" && (
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[560px]">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto font-sans">
              <defs>
                <linearGradient id="barPendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>
                <linearGradient id="barBebanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
              </defs>

              {/* Batang per Bulan */}
              {data.map((item, index) => {
                const groupWidth = chartWidth / data.length;
                const barW = Math.min(26, (groupWidth - 20) / 2);
                const groupCenter = marginLeft + index * groupWidth + groupWidth / 2;
                const pHeight = (item.pendapatan / yCeil) * chartHeight;
                const bHeight = (item.beban / yCeil) * chartHeight;

                return (
                  <g key={item.periodeLabel} onClick={() => setActiveIndex(index)} className="cursor-pointer">
                    {/* Batang Pendapatan */}
                    <rect
                      x={groupCenter - barW - 3}
                      y={marginTop + chartHeight - pHeight}
                      width={barW}
                      height={pHeight}
                      rx="4"
                      fill="url(#barPendGrad)"
                    />
                    {/* Batang Beban */}
                    <rect
                      x={groupCenter + 3}
                      y={marginTop + chartHeight - bHeight}
                      width={barW}
                      height={bHeight}
                      rx="4"
                      fill="url(#barBebanGrad)"
                    />
                    <text
                      x={groupCenter}
                      y={marginTop + chartHeight + 22}
                      textAnchor="middle"
                      className="text-[11px] font-bold fill-[#fdfaf6]"
                    >
                      {item.periodeLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. MODE ALTERNATIF: TABEL DATA TRANSPARAN                    */}
      {/* ============================================================ */}
      {viewMode === "table" && (
        <div className="mt-4 pt-3 border-t border-amber-900/20 overflow-x-auto">
          <table className="w-full text-xs text-left text-[#fdfaf6]">
            <thead className="bg-[#141210] text-[#a89f91] font-semibold border-b border-amber-900/30">
              <tr>
                <th className="px-3 py-2">Bulan Periode</th>
                <th className="px-3 py-2 text-right">Pendapatan</th>
                <th className="px-3 py-2 text-right">Beban</th>
                <th className="px-3 py-2 text-right">Laba / (Rugi)</th>
                <th className="px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/15">
              {data.map((row) => (
                <tr key={row.periodeLabel} className="hover:bg-[#1a1613]">
                  <td className="px-3 py-2 font-medium">{row.periodeLabel}</td>
                  <td className="px-3 py-2 text-right font-mono text-orange-400 font-bold">
                    {formatRupiah(row.pendapatan)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[#e2e8f0]">
                    {formatRupiah(row.beban)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono font-bold ${
                      row.labaRugi < 0 ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {row.labaRugi < 0
                      ? `(${formatRupiah(Math.abs(row.labaRugi))})`
                      : formatRupiah(row.labaRugi)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.labaRugi >= 0
                          ? "bg-emerald-950/70 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-950/70 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {row.labaRugi >= 0 ? "Laba" : "Rugi"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Ringkasan Bulan Aktif */}
      <div className="mt-4 pt-3 border-t border-amber-900/15 flex flex-wrap items-center justify-between text-xs text-[#a89f91]">
        <div className="flex items-center gap-3">
          <span>
            Bulan dipilih: <strong className="text-amber-300">{activeItem.periodeLabel}</strong>
          </span>
          <span>•</span>
          <span>
            Beban: <strong className="text-[#fdfaf6]">{formatRupiah(activeItem.beban)}</strong>
          </span>
          <span>•</span>
          <span>
            Hasil Bersih:{" "}
            <strong className={activeItem.labaRugi < 0 ? "text-rose-400" : "text-emerald-400"}>
              {activeItem.labaRugi < 0
                ? `(${formatRupiah(Math.abs(activeItem.labaRugi))})`
                : formatRupiah(activeItem.labaRugi)}
            </strong>
          </span>
        </div>

        <span className="text-[11px] text-[#78716c] hidden sm:inline">
          Arahkan kursor atau klik bulan untuk menyorot titik data
        </span>
      </div>
    </div>
  );
}
