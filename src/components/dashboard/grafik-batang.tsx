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
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-600">Belum Ada Data Periode</p>
        <p className="text-xs text-slate-400 mt-1">
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
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      {/* Header Grafik */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Perbandingan Pendapatan & Beban
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Historis paling banyak 6 periode pembukuan terakhir (kalkulasi database)
          </p>
        </div>

        {/* Legenda dengan Teks dan Ikon Bentuk (Bukan Hanya Warna) */}
        <div className="flex flex-wrap items-center gap-4 text-xs" role="region" aria-label="Legenda Grafik">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span
              aria-hidden="true"
              className="inline-block w-3.5 h-3.5 rounded bg-emerald-600 border border-emerald-700 shadow-xs"
            />
            <span>■ Pendapatan Usaha</span>
          </div>

          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span
              aria-hidden="true"
              className="inline-block w-3.5 h-3.5 rounded bg-amber-600 border border-amber-700 shadow-xs"
            />
            <span>▲ Beban Operasional</span>
          </div>

          <button
            type="button"
            onClick={() => setShowTable((prev) => !prev)}
            className="text-xs text-sky-700 hover:text-sky-900 underline font-medium cursor-pointer"
            aria-expanded={showTable}
            aria-controls="tabel-data-grafik"
          >
            {showTable ? "Sembunyikan Tabel" : "Lihat Format Tabel"}
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
                    stroke="#e2e8f0"
                    strokeDasharray={tick === 0 ? "none" : "3 3"}
                    strokeWidth={tick === 0 ? "1.5" : "1"}
                  />
                  <text
                    x={marginLeft - 8}
                    y={yPos + 4}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono"
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
                  {/* Batang Pendapatan */}
                  <rect
                    x={pendX}
                    y={pendY}
                    width={barWidth}
                    height={pendHeight}
                    rx="3"
                    className="fill-emerald-600 hover:fill-emerald-500 transition-colors cursor-pointer"
                  >
                    <title>{`${item.periodeLabel} - Pendapatan: ${formatRupiah(item.pendapatan)}`}</title>
                  </rect>

                  {/* Label Angka Batang Pendapatan */}
                  <text
                    x={pendX + barWidth / 2}
                    y={pendY - 5}
                    textAnchor="middle"
                    className="text-[10px] font-bold fill-emerald-800 font-mono"
                  >
                    {formatRingkas(item.pendapatan)}
                  </text>

                  {/* Batang Beban */}
                  <rect
                    x={bebanX}
                    y={bebanY}
                    width={barWidth}
                    height={bebanHeight}
                    rx="3"
                    className="fill-amber-600 hover:fill-amber-500 transition-colors cursor-pointer"
                  >
                    <title>{`${item.periodeLabel} - Beban: ${formatRupiah(item.beban)}`}</title>
                  </rect>

                  {/* Label Angka Batang Beban */}
                  <text
                    x={bebanX + barWidth / 2}
                    y={bebanY - 5}
                    textAnchor="middle"
                    className="text-[10px] font-bold fill-amber-800 font-mono"
                  >
                    {formatRingkas(item.beban)}
                  </text>

                  {/* Label Nama Bulan pada Sumbu X */}
                  <text
                    x={groupCenterX}
                    y={marginTop + chartHeight + 20}
                    textAnchor="middle"
                    className="text-[11px] font-semibold fill-slate-700"
                  >
                    {item.periodeLabel}
                  </text>

                  {/* Status Laba / Rugi ringkas di bawah sumbu */}
                  <text
                    x={groupCenterX}
                    y={marginTop + chartHeight + 34}
                    textAnchor="middle"
                    className={`text-[10px] font-medium ${
                      item.labaRugi < 0 ? "fill-rose-600" : "fill-emerald-700"
                    }`}
                  >
                    {item.labaRugi < 0
                      ? `Rugi (${formatRingkas(Math.abs(item.labaRugi))})`
                      : `Laba ${formatRingkas(item.labaRugi)}`}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Tabel Data Alternatif untuk Aksesibilitas Pembaca Layar & Pembaca Data (Selalu ada di DOM) */}
      <div
        id="tabel-data-grafik"
        className={`mt-4 pt-4 border-t border-slate-100 ${showTable ? "block" : "sr-only"}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <caption className="font-semibold text-slate-800 mb-2 text-left">
              Data Pendapatan, Beban, dan Laba (Rugi) 6 Periode Terakhir
            </caption>
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th scope="col" className="px-3 py-2">Bulan Periode</th>
                <th scope="col" className="px-3 py-2 text-right">Pendapatan</th>
                <th scope="col" className="px-3 py-2 text-right">Beban</th>
                <th scope="col" className="px-3 py-2 text-right">Laba / (Rugi) Bersih</th>
                <th scope="col" className="px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => (
                <tr key={row.periodeLabel} className="hover:bg-slate-50">
                  <th scope="row" className="px-3 py-2 font-medium text-slate-900">
                    {row.periodeLabel}
                  </th>
                  <td className="px-3 py-2 text-right font-mono text-emerald-700">
                    {formatRupiah(row.pendapatan)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-amber-700">
                    {formatRupiah(row.beban)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono font-bold ${
                      row.labaRugi < 0 ? "text-rose-700" : "text-emerald-700"
                    }`}
                  >
                    {formatRupiah(row.labaRugi)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {row.labaRugi < 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        <span>⚠️</span>
                        <span>Rugi</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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
