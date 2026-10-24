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
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Mutasi Rekening Bank
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Nilai Tambah (PRD 11)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
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
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              <span>📥</span> Unggah CSV Mutasi
            </button>
          </div>
        )}
      </div>

      {/* Pesan Umpan Balik (Feedback Alert) */}
      {feedback && (
        <div
          role="status"
          className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{feedback.type === "success" ? "✓" : "⚠"}</span>
            <span className="font-medium">{feedback.text}</span>
            {feedback.jurnalId && (
              <Link
                href={`/jurnal/${feedback.jurnalId}`}
                className="font-bold underline text-blue-700 hover:text-blue-900 ml-2"
              >
                Lihat Draf Jurnal #{feedback.jurnalId} →
              </Link>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold ml-4"
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
