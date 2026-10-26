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
 * Format angka rupiah ringkas untuk label batang di SVG (misal: "Rp 49,4 jt" atau "Rp 0")
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

export function GrafikBatang({ data }: GrafikBatangProps) {
  const [showTable, setShowTable] = useState(false);

  // Jika data kosong
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

  // Hitung nilai maksimum untuk skala Y (minimal 1 juta untuk pembagi)
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.pendapatan, d.beban)),
    1_000_000
  );
  // Bulatkan maxVal ke atas agar ada ruang nafas di atas batang
  const yCeil = Math.ceil((maxVal * 1.15) / 10_000_000) * 10_000_000 || maxVal * 1.2;

  // Dimensi SVG
  const svgWidth = 720;
  const svgHeight = 280;
  const marginTop = 35;
  const marginBottom = 45;
  const marginLeft = 75;
  const marginRight = 25;

  const chartWidth = svgWidth - marginLeft - marginRight;
  const chartHeight = svgHeight - marginTop - marginBottom;

  // Hitung lebar grup per bulan
  const groupWidth = chartWidth / data.length;
  const barWidth = Math.min(28, Math.max(16, (groupWidth - 24) / 2));
  const barGap = 6;

  // Garis horizontal Y grid
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="sogan-card p-5 sm:p-6 select-none">
      {/* Header Grafik */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-900/20">
        <div>
          <h3 className="text-base font-bold text-[#fdfaf6] tracking-tight">
            Perbandingan Pendapatan & Beban
          </h3>
          <p className="text-xs text-[#a89f91] mt-0.5">
            Historis 6 periode pembukuan terakhir (kalkulasi baris jurnal terposting)
          </p>
        </div>

        {/* Legenda Dual-Tone Emas & Bronze */}
        <div className="flex flex-wrap items-center gap-4 text-xs" role="region" aria-label="Legenda Grafik">
          <div className="flex items-center gap-1.5 font-medium text-[#fdfaf6]">
            <span
              aria-hidden="true"
              className="inline-block w-3 h-3 rounded bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)] border border-amber-400/40"
            />
            <span className="text-amber-200">Pendapatan</span>
          </div>

          <div className="flex items-center gap-1.5 font-medium text-[#fdfaf6]">
            <span
              aria-hidden="true"
              className="inline-block w-3 h-3 rounded bg-gradient-to-t from-orange-800 to-orange-500 shadow-[0_0_8px_rgba(234,88,12,0.4)] border border-orange-500/40"
            />
            <span className="text-orange-200">Beban</span>
          </div>

          <button
            type="button"
            onClick={() => setShowTable((prev) => !prev)}
            className="text-xs text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer transition"
            aria-expanded={showTable}
            aria-controls="tabel-data-grafik"
          >
            {showTable ? "Sembunyikan Tabel" : "Lihat Tabel"}
          </button>
        </div>
      </div>

      {/* Kontainer Grafik SVG */}
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[560px]">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto font-sans"
            role="img"
            aria-labelledby="chart-title chart-desc"
          >
            <title id="chart-title">Grafik Batang Pendapatan dan Beban per Bulan</title>
            <desc id="chart-desc">
              Grafik komparasi pendapatan versus beban untuk {data.length} periode terakhir.
            </desc>

            {/* Definisi Gradasi dan Efek Pendar Sogan */}
            <defs>
              <linearGradient id="gradPendapatan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="gradBeban" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#9a3412" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Grid Lines Horizontal & Label Y */}
            {yTicks.map((tick, i) => {
              const yVal = yCeil * tick;
              const yPos = marginTop + chartHeight - tick * chartHeight;
              return (
                <g key={i}>
                  <line
                    x1={marginLeft}
                    y1={yPos}
                    x2={svgWidth - marginRight}
                    y2={yPos}
                    stroke="rgba(245, 158, 11, 0.12)"
                    strokeDasharray={tick === 0 ? "none" : "3 3"}
                    strokeWidth={tick === 0 ? "1.5" : "1"}
                  />
                  <text
                    x={marginLeft - 8}
                    y={yPos + 4}
                    textAnchor="end"
                    className="text-[10px] fill-[#78716c] font-mono"
                  >
                    {formatRingkas(yVal)}
                  </text>
                </g>
              );
            })}

            {/* Kelompok Batang per Bulan */}
            {data.map((item, index) => {
              const groupCenterX = marginLeft + index * groupWidth + groupWidth / 2;
              const pendX = groupCenterX - barWidth - barGap / 2;
              const bebanX = groupCenterX + barGap / 2;

              // Tinggi batang (proporsional thd yCeil)
              const pendHeight = Math.max(2, (item.pendapatan / yCeil) * chartHeight);
              const bebanHeight = Math.max(2, (item.beban / yCeil) * chartHeight);

              const pendY = marginTop + chartHeight - pendHeight;
              const bebanY = marginTop + chartHeight - bebanHeight;

              return (
                <g key={item.periodeLabel} tabIndex={0} role="group" aria-label={`Periode ${item.periodeLabel}`}>
                  {/* Batang Pendapatan (Amber Gold Glow) */}
                  <rect
                    x={pendX}
                    y={pendY}
                    width={barWidth}
                    height={pendHeight}
                    rx="4"
                    fill="url(#gradPendapatan)"
                    className="hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <title>{`${item.periodeLabel} - Pendapatan: ${formatRupiah(item.pendapatan)}`}</title>
                  </rect>

                  {/* Label Angka Batang Pendapatan */}
                  <text
                    x={pendX + barWidth / 2}
                    y={pendY - 5}
                    textAnchor="middle"
                    className="text-[10px] font-bold fill-amber-300 font-mono"
                  >
                    {formatRingkas(item.pendapatan)}
                  </text>

                  {/* Batang Beban (Bronze Terracotta Glow) */}
                  <rect
                    x={bebanX}
                    y={bebanY}
                    width={barWidth}
                    height={bebanHeight}
                    rx="4"
                    fill="url(#gradBeban)"
                    className="hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <title>{`${item.periodeLabel} - Beban: ${formatRupiah(item.beban)}`}</title>
                  </rect>

                  {/* Label Angka Batang Beban */}
                  <text
                    x={bebanX + barWidth / 2}
                    y={bebanY - 5}
                    textAnchor="middle"
                    className="text-[10px] font-bold fill-orange-300 font-mono"
                  >
                    {formatRingkas(item.beban)}
                  </text>

                  {/* Label Nama Bulan pada Sumbu X */}
                  <text
                    x={groupCenterX}
                    y={marginTop + chartHeight + 18}
                    textAnchor="middle"
                    className="text-[11px] font-semibold fill-[#fdfaf6]"
                  >
                    {item.periodeLabel}
                  </text>

                  {/* Status Laba / Rugi ringkas di bawah sumbu */}
                  <text
                    x={groupCenterX}
                    y={marginTop + chartHeight + 32}
                    textAnchor="middle"
                    className={`text-[10px] font-medium ${
                      item.labaRugi < 0 ? "fill-rose-400" : "fill-emerald-400"
                    }`}
                  >
                    {item.labaRugi < 0
                      ? `(${formatRingkas(Math.abs(item.labaRugi))})`
                      : `+${formatRingkas(item.labaRugi)}`}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Tabel Data Alternatif untuk Aksesibilitas */}
      <div
        id="tabel-data-grafik"
        className={`mt-4 pt-4 border-t border-amber-900/20 ${showTable ? "block" : "sr-only"}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-[#fdfaf6]">
            <caption className="font-semibold text-[#fdfaf6] mb-2 text-left">
              Data Pendapatan, Beban, dan Laba (Rugi) 6 Periode Terakhir
            </caption>
            <thead className="bg-[#141210] text-[#a89f91] font-semibold border-b border-amber-900/30">
              <tr>
                <th scope="col" className="px-3 py-2">Bulan Periode</th>
                <th scope="col" className="px-3 py-2 text-right">Pendapatan</th>
                <th scope="col" className="px-3 py-2 text-right">Beban</th>
                <th scope="col" className="px-3 py-2 text-right">Laba / (Rugi) Bersih</th>
                <th scope="col" className="px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/15">
              {data.map((row) => (
                <tr key={row.periodeLabel} className="hover:bg-[#1a1613]">
                  <th scope="row" className="px-3 py-2 font-medium text-[#fdfaf6]">
                    {row.periodeLabel}
                  </th>
                  <td className="px-3 py-2 text-right font-mono text-amber-300">
                    {formatRupiah(row.pendapatan)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-orange-300">
                    {formatRupiah(row.beban)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono font-bold ${
                      row.labaRugi < 0 ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {row.labaRugi < 0 ? `(${formatRupiah(Math.abs(row.labaRugi))})` : formatRupiah(row.labaRugi)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {row.labaRugi < 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/40">
                        <span>⚠</span>
                        <span>Rugi</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                        <span>✓</span>
                        <span>Laba</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
