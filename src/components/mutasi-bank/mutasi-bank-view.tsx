"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type {
  MutasiBankWithRelations,
  AkunKasBankOption,
  AkunOption,
} from "@/lib/mutasi-bank/types";
import { DaftarMutasiTabel } from "./daftar-mutasi-tabel";
import { UnggahCsvModal } from "./unggah-csv-modal";
import { BuatJurnalModal } from "./buat-jurnal-modal";

interface MutasiBankViewProps {
  initialMutasi: MutasiBankWithRelations[];
  akunKasBankList: AkunKasBankOption[];
  allAkunList: AkunOption[];
  currentRole: string;
}

export function MutasiBankView({
  initialMutasi,
  akunKasBankList,
  allAkunList,
  currentRole,
}: MutasiBankViewProps) {
  const router = useRouter();
  const [mutasiList, setMutasiList] = useState<MutasiBankWithRelations[]>(initialMutasi);
  const [isUnggahOpen, setIsUnggahOpen] = useState(false);
  const [selectedForJurnal, setSelectedForJurnal] =
    useState<MutasiBankWithRelations | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
    jurnalId?: number;
  } | null>(null);

  const isAkuntan = currentRole === "akuntan";

  // Ambil data terbaru dari Supabase client
  const refreshMutasiList = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("mutasi_bank")
        .select(
          `
          *,
          akun_bank:akun!mutasi_bank_akun_bank_id_fkey(id, kode, nama),
          jurnal:jurnal!mutasi_bank_jurnal_id_fkey(id, nomor, status, tanggal, keterangan)
        `
        )
        .order("tanggal", { ascending: false })
        .order("id", { ascending: false });

      if (error) throw error;
      if (data) {
        setMutasiList(data as unknown as MutasiBankWithRelations[]);
      }
    } catch (err) {
      console.error("Gagal menyegarkan data mutasi bank:", err);
      // Fallback router refresh
      router.refresh();
    }
  };

  // Handler setelah berhasil mengimpor baris baru
  const handleUnggahSuccess = async (savedCountOrMessage: number | string) => {
    setIsUnggahOpen(false);
    const feedbackText =
      typeof savedCountOrMessage === "string"
        ? savedCountOrMessage
        : `Berhasil mengimpor ${savedCountOrMessage} baris mutasi bank baru ke sistem.`;
    setFeedback({
      type: "success",
      text: feedbackText,
    });
    await refreshMutasiList();
  };

  // Handler setelah draf jurnal berhasil dibuat dari mutasi
  const handleJurnalSuccess = async (jurnalId: number) => {
    setSelectedForJurnal(null);
    setFeedback({
      type: "success",
      text: "Draf jurnal umum berhasil dibuat dan dikaitkan ke mutasi bank.",
      jurnalId,
    });
    await refreshMutasiList();
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-amber-900/20 pb-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              Integrasi Rekening Koran & CSV
            </span>
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/40 shadow-sm">
              Nilai Tambah (PRD 11)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#fdfaf6] tracking-tight">
            Mutasi Rekening Bank
          </h1>
          <p className="text-sm sm:text-base text-[#a89f91] max-w-3xl leading-relaxed">
            Impor riwayat transaksi rekening koran CSV (maks. 1 MB & 2.000 baris), validasi pencegahan duplikasi data transaksi, dan pembuatan draf jurnal umum secara atomik.
          </p>
        </div>

        {/* Tombol Unggah CSV (HANYA untuk Akuntan; Direktur Hanya Membaca) */}
        {isAkuntan && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFeedback(null);
                setIsUnggahOpen(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm sm:text-base font-bold text-[#070605] bg-gradient-to-r from-amber-600 to-amber-700 rounded-xl hover:from-amber-500 hover:to-amber-600 transition shadow-lg shadow-amber-950/50 active:scale-95"
            >
              <span aria-hidden="true">📥</span>
              <span>Unggah CSV Mutasi</span>
            </button>
          </div>
        )}
      </div>

      {/* Pesan Umpan Balik (Feedback Alert) */}
      {feedback && (
        <div
          role="status"
          className={`sogan-card p-4 sm:p-5 rounded-2xl border flex items-center justify-between text-sm sm:text-base animate-in fade-in duration-200 shadow-xl ${
            feedback.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
              : "bg-rose-950/40 border-rose-500/40 text-rose-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold">{feedback.type === "success" ? "✓" : "⚠"}</span>
            <span className="font-semibold">{feedback.text}</span>
            {feedback.jurnalId && (
              <Link
                href={`/jurnal/${feedback.jurnalId}`}
                className="font-bold underline text-amber-300 hover:text-amber-200 ml-2 text-sm"
              >
                Lihat Draf Jurnal #{feedback.jurnalId} →
              </Link>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[#8a7e72] hover:text-[#fdfaf6] text-base font-bold ml-4 p-1 rounded-lg transition"
            aria-label="Tutup pesan"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabel & Daftar Mutasi Bank */}
      <DaftarMutasiTabel
        mutasiList={mutasiList}
        akunKasBankList={akunKasBankList}
        isAkuntan={isAkuntan}
        onPilihBuatJurnal={(m) => {
          setFeedback(null);
          setSelectedForJurnal(m);
        }}
      />

      {/* Modal Unggah CSV (Hanya di-render jika Akuntan dan modal dibuka) */}
      {isAkuntan && isUnggahOpen && (
        <UnggahCsvModal
          isOpen={isUnggahOpen}
          akunKasBankList={akunKasBankList}
          onClose={() => setIsUnggahOpen(false)}
          onSuccess={handleUnggahSuccess}
        />
      )}

      {/* Modal Buat Draf Jurnal (Hanya bisa dibuka jika Akuntan) */}
      {isAkuntan && (
        <BuatJurnalModal
          isOpen={selectedForJurnal !== null}
          mutasi={selectedForJurnal}
          akunList={allAkunList}
          onClose={() => setSelectedForJurnal(null)}
          onSuccess={handleJurnalSuccess}
        />
      )}
    </div>
  );
}
