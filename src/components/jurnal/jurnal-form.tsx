"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { TipeAkun, StatusPeriode } from "@/types/database";
import { formatRupiah, formatBulanTahun } from "@/lib/utils/formatters";
import { getFriendlyErrorMessage } from "@/lib/utils/errors";

export interface AkunOption {
  id: number;
  kode: string;
  nama: string;
  tipe: TipeAkun;
  saldo_normal: "debit" | "kredit";
  aktif: boolean;
}

export interface PeriodeData {
  id: number;
  tahun: number;
  bulan: number;
  status: StatusPeriode;
}

export interface InitialBarisData {
  urutan: number;
  akun_id: number;
  debit: number;
  kredit: number;
  keterangan?: string | null;
}

export interface InitialJurnalData {
  id: number;
  tanggal: string;
  keterangan: string;
  periode_id: number;
  baris: InitialBarisData[];
}

interface JurnalFormProps {
  mode: "baru" | "ubah";
  initialData?: InitialJurnalData;
  daftarAkun: AkunOption[];
  daftarPeriode: PeriodeData[];
  userId?: string;
}

interface FormRow {
  key: string;
  akun_id: string; // number as string or ""
  debit: string;
  kredit: string;
  keterangan: string;
}

export function JurnalForm({
  mode,
  initialData,
  daftarAkun,
  daftarPeriode,
}: JurnalFormProps) {
  const router = useRouter();

  // Tanggal default: hari ini atau tanggal awal dari data lama
  const todayStr = new Date().toISOString().split("T")[0];
  const [tanggal, setTanggal] = useState<string>(initialData?.tanggal || todayStr);
  const [keterangan, setKeterangan] = useState<string>(initialData?.keterangan || "");

  // Inisialisasi baris jurnal (minimal 2 baris)
  const [rows, setRows] = useState<FormRow[]>(() => {
    if (initialData?.baris && initialData.baris.length >= 2) {
      return initialData.baris.map((b, i) => ({
        key: `row-${i}-${Date.now()}`,
        akun_id: String(b.akun_id),
        debit: b.debit > 0 ? String(b.debit) : "",
        kredit: b.kredit > 0 ? String(b.kredit) : "",
        keterangan: b.keterangan || "",
      }));
    }
    return [
      { key: "row-1", akun_id: "", debit: "", kredit: "", keterangan: "" },
      { key: "row-2", akun_id: "", debit: "", kredit: "", keterangan: "" },
    ];
  });

  const [loadingAction, setLoadingAction] = useState<"draf" | "posting" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ nomor: string; id: number } | null>(null);

  // Deteksi periode otomatis dari tanggal yang dipilih
  const periodeTerpilih = useMemo(() => {
    if (!tanggal) return null;
    const parts = tanggal.split("-");
    if (parts.length < 2) return null;
    const tahun = parseInt(parts[0], 10);
    const bulan = parseInt(parts[1], 10);
    if (isNaN(tahun) || isNaN(bulan)) return null;

    const match = daftarPeriode.find((p) => p.tahun === tahun && p.bulan === bulan);
    return {
      tahun,
      bulan,
      ditemukan: Boolean(match),
      periode: match || null,
      status: match ? match.status : ("tidak_ada" as const),
    };
  }, [tanggal, daftarPeriode]);

  // Hitung total debit, total kredit, dan selisih secara langsung
  const { totalDebit, totalKredit, selisih, isBalanced, rowsValid } = useMemo(() => {
    let tDebit = 0;
    let tKredit = 0;
    let validCount = 0;

    for (const r of rows) {
      const d = parseInt(r.debit || "0", 10) || 0;
      const k = parseInt(r.kredit || "0", 10) || 0;
      tDebit += d;
      tKredit += k;

      if (r.akun_id && ((d > 0 && k === 0) || (d === 0 && k > 0))) {
        validCount++;
      }
    }

    const balanced = tDebit > 0 && tDebit === tKredit;
    const diff = Math.abs(tDebit - tKredit);
    const allRowsValid = validCount >= 2 && validCount === rows.length;

    return {
      totalDebit: tDebit,
      totalKredit: tKredit,
      selisih: diff,
      isBalanced: balanced,
      rowsValid: allRowsValid,
    };
  }, [rows]);

  // Handler update debit: jika debit diisi > 0, kredit otomatis dikosongkan (BR-02: satu sisi)
  const handleDebitChange = (index: number, val: string) => {
    const cleaned = val.replace(/[^0-9]/g, "");
    setRows((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        debit: cleaned,
        kredit: cleaned ? "" : next[index].kredit,
      };
      return next;
    });
  };

  // Handler update kredit: jika kredit diisi > 0, debit otomatis dikosongkan (BR-02: satu sisi)
  const handleKreditChange = (index: number, val: string) => {
    const cleaned = val.replace(/[^0-9]/g, "");
    setRows((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        kredit: cleaned,
        debit: cleaned ? "" : next[index].debit,
      };
      return next;
    });
  };

  const handleAkunChange = (index: number, akunId: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], akun_id: akunId };
      return next;
    });
  };

  const handleRowKeteranganChange = (index: number, ket: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], keterangan: ket };
      return next;
    });
  };

  const handleTambahBaris = () => {
    setRows((prev) => [
      ...prev,
      {
        key: `row-${Date.now()}-${prev.length}`,
        akun_id: "",
        debit: "",
        kredit: "",
        keterangan: "",
      },
    ]);
  };

  const handleHapusBaris = (index: number) => {
    if (rows.length <= 2) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Validasi lokal sebelum kirim (kenyamanan pengguna; validasi mutlak tetap di database)
  const validateForm = () => {
    if (!tanggal) {
      return "Tanggal transaksi wajib diisi.";
    }
    if (!periodeTerpilih || !periodeTerpilih.ditemukan) {
      return "Periode akuntansi untuk tanggal transaksi ini belum dibuat di sistem (BR-05).";
    }
    if (periodeTerpilih.status !== "terbuka") {
      return `Periode akuntansi (${formatBulanTahun(periodeTerpilih.tahun, periodeTerpilih.bulan)}) sudah berstatus ditutup (BR-05).`;
    }
    if (keterangan.trim().length < 5) {
      return "Keterangan jurnal wajib diisi minimal 5 karakter.";
    }
    if (rows.length < 2) {
      return "Jurnal minimal harus memiliki 2 baris akun (BR-02).";
    }
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.akun_id) {
        return `Baris ke-${i + 1}: Akun belum dipilih.`;
      }
      const d = parseInt(r.debit || "0", 10) || 0;
      const k = parseInt(r.kredit || "0", 10) || 0;
      if (d === 0 && k === 0) {
        return `Baris ke-${i + 1}: Nominal debit atau kredit wajib diisi lebih dari 0.`;
      }
      if (d > 0 && k > 0) {
        return `Baris ke-${i + 1}: Satu baris hanya boleh diisi salah satu antara debit atau kredit (BR-02).`;
      }
    }
    return null;
  };

  // Simpan Draf Jurnal (sebagai satu kesatuan transaksi)
  const handleSimpanDraf = async (afterSave?: (jurnalId: number) => Promise<void>) => {
    setErrorMessage(null);
    const clientErr = validateForm();
    if (clientErr) {
      setErrorMessage(clientErr);
      return;
    }

    setLoadingAction("draf");
    const supabase = createClient();

    try {
      const targetId = mode === "ubah" && initialData ? initialData.id : null;
      const barisPayload = rows.map((r) => ({
        akun_id: parseInt(r.akun_id, 10),
        debit: parseInt(r.debit || "0", 10) || 0,
        kredit: parseInt(r.kredit || "0", 10) || 0,
        keterangan: r.keterangan.trim() || null,
      }));

      // Panggil RPC simpan_jurnal_draf (atomik di dalam database, identitas pembuat murni auth.uid())
      const { data: savedJurnal, error: rpcErr } = await supabase.rpc("simpan_jurnal_draf", {
        p_jurnal_id: targetId,
        p_tanggal: tanggal,
        p_keterangan: keterangan.trim(),
        p_baris: barisPayload,
      });

      if (rpcErr) throw rpcErr;
      if (!savedJurnal) throw new Error("Gagal menyimpan draf jurnal.");

      const resultId = savedJurnal.id;

      if (afterSave) {
        await afterSave(resultId);
      } else {
        router.push(`/jurnal/${resultId}`);
        router.refresh();
      }
    } catch (err: unknown) {
      console.error("Gagal menyimpan draf jurnal:", err);
      setErrorMessage(getFriendlyErrorMessage(err));
      setLoadingAction(null);
    }
  };

  // Posting Jurnal via RPC posting_jurnal(p_jurnal_id)
  const handlePostingJurnal = async () => {
    setErrorMessage(null);
    const clientErr = validateForm();
    if (clientErr) {
      setErrorMessage(clientErr);
      return;
    }

    if (!isBalanced) {
      setErrorMessage(
        "Jurnal tidak dapat diposting: Total Debit harus sama persis dengan Total Kredit (BR-02)."
      );
      return;
    }

    setLoadingAction("posting");

    // Simpan draf terlebih dahulu jika belum tersimpan, lalu jalankan posting_jurnal
    await handleSimpanDraf(async (jurnalId: number) => {
      const supabase = createClient();
      const { data: resultJurnal, error: rpcErr } = await supabase.rpc("posting_jurnal", {
        p_jurnal_id: jurnalId,
      });

      if (rpcErr) {
        throw rpcErr;
      }

      setSuccessInfo({
        nomor: resultJurnal?.nomor || "Nomor JU",
        id: jurnalId,
      });
      setLoadingAction(null);
    });
  };

  // Modal Sukses Posting
  if (successInfo) {
    return (
      <div className="sogan-card border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 via-[#0e0c0a] to-[#0e0c0a] p-8 text-center space-y-5 max-w-lg mx-auto my-8 shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950/80 text-emerald-300 text-3xl font-black border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
          ✓
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#fdfaf6]">Jurnal Berhasil Diposting!</h2>
          <p className="text-sm sm:text-base text-[#a89f91] mt-1.5">
            Transaksi telah resmi diposting ke buku besar dengan nomor dokumen:
          </p>
          <div className="mt-4 inline-block rounded-xl bg-[#141210] border border-amber-500/40 px-5 py-2.5 font-mono text-xl sm:text-2xl font-black text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            {successInfo.nomor}
          </div>
        </div>
        <div className="pt-3 flex flex-wrap justify-center gap-3">
          <Link
            href={`/jurnal/${successInfo.id}`}
            className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 px-5 py-2.5 text-sm sm:text-base font-bold text-black shadow-[0_0_12px_rgba(245,158,11,0.25)] transition"
          >
            Lihat Detail Jurnal →
          </Link>
          <Link
            href="/jurnal"
            className="rounded-xl border border-amber-900/40 bg-[#161310] px-5 py-2.5 text-sm sm:text-base font-semibold text-amber-300 hover:bg-[#1e1a16] transition"
          >
            Kembali ke Daftar
          </Link>
        </div>
      </div>
    );
  }

  const isBusy = loadingAction !== null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      className="space-y-6"
    >
      {/* Alert Error */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="sogan-card border-rose-500/40 bg-gradient-to-r from-rose-950/30 to-[#0f0d0b] p-5 text-sm sm:text-base text-rose-300 flex items-start gap-3 shadow-lg"
        >
          <span className="text-lg leading-none font-bold text-rose-400">✕</span>
          <div className="flex-1">
            <strong className="block font-bold text-[#fdfaf6]">Gagal memproses transaksi:</strong>
            <span className="mt-0.5 block leading-relaxed">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-200 font-bold ml-2 text-sm"
            aria-label="Tutup pesan galat"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bagian Header Form: Tanggal, Periode, Keterangan */}
      <div className="sogan-card p-6 sm:p-7 space-y-5">
        <h2 className="text-base sm:text-lg font-bold text-[#fdfaf6] border-b border-amber-900/20 pb-3 flex items-center gap-2">
          <span aria-hidden="true">📋</span> Informasi Utama Jurnal
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Tanggal Transaksi */}
          <div className="space-y-2">
            <label htmlFor="input-tanggal" className="block text-sm sm:text-base font-bold text-[#fdfaf6]">
              Tanggal Transaksi <span className="text-rose-400">*</span>
            </label>
            <input
              id="input-tanggal"
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              disabled={isBusy}
              required
              className="w-full rounded-xl border border-amber-900/40 bg-[#141210] px-4 py-3 text-sm sm:text-base text-[#fdfaf6] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:opacity-50 [color-scheme:dark]"
            />
          </div>

          {/* Periode Terdeteksi Otomatis */}
          <div className="space-y-2">
            <label htmlFor="display-periode" className="block text-sm sm:text-base font-bold text-[#fdfaf6]">
              Periode Akuntansi (Otomatis dari Tanggal)
            </label>
            <div
              id="display-periode"
              className="flex items-center justify-between rounded-xl border border-amber-900/40 bg-[#141210] px-4 py-3 text-sm sm:text-base"
            >
              <span className="font-semibold text-amber-300">
                {periodeTerpilih
                  ? formatBulanTahun(periodeTerpilih.tahun, periodeTerpilih.bulan)
                  : "Pilih tanggal"}
              </span>

              {periodeTerpilih && (
                <div>
                  {periodeTerpilih.status === "terbuka" && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 px-3 py-1 text-xs sm:text-sm font-bold text-emerald-300"
                      title="Periode akuntansi terbuka untuk posting jurnal"
                    >
                      <span aria-hidden="true">✓</span> Terbuka
                    </span>
                  )}
                  {periodeTerpilih.status === "ditutup" && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-rose-950/70 border border-rose-500/40 px-3 py-1 text-xs sm:text-sm font-bold text-rose-300"
                      title="Periode telah ditutup (BR-05)"
                    >
                      <span aria-hidden="true">✕</span> Ditutup
                    </span>
                  )}
                  {periodeTerpilih.status === "tidak_ada" && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-amber-950/70 border border-amber-500/40 px-3 py-1 text-xs sm:text-sm font-bold text-amber-300"
                      title="Periode belum dibuat di sistem"
                    >
                      <span aria-hidden="true">⚠</span> Belum Dibuat
                    </span>
                  )}
                </div>
              )}
            </div>

            {periodeTerpilih && periodeTerpilih.status === "ditutup" && (
              <p className="text-xs sm:text-sm text-rose-400 mt-1 font-medium">
                ⚠ Tanggal ini berada di periode yang telah ditutup. Jurnal tidak dapat disimpan (BR-05).
              </p>
            )}
            {periodeTerpilih && periodeTerpilih.status === "tidak_ada" && (
              <p className="text-xs sm:text-sm text-amber-400 mt-1">
                ⚠ Periode akuntansi belum dibuat oleh Akuntan pada menu Akun & Periode.
              </p>
            )}
          </div>
        </div>

        {/* Keterangan Transaksi */}
        <div className="space-y-2">
          <label htmlFor="input-keterangan" className="block text-sm sm:text-base font-bold text-[#fdfaf6]">
            Keterangan Transaksi <span className="text-rose-400">*</span>
            <span className="text-xs font-normal text-[#a89f91] ml-2">
              (minimal 5 karakter)
            </span>
          </label>
          <textarea
            id="input-keterangan"
            rows={3}
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            disabled={isBusy}
            placeholder="Contoh: Pembelian perlengkapan kantor tunai..."
            required
            className="w-full rounded-xl border border-amber-900/40 bg-[#141210] px-4 py-3 text-sm sm:text-base text-[#fdfaf6] placeholder-[#78716c] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 leading-relaxed disabled:opacity-50"
          />
        </div>
      </div>

      {/* Bagian Rincian Baris Jurnal */}
      <div className="sogan-card p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-amber-900/20 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#fdfaf6]">Baris Akun Jurnal (BR-02)</h2>
            <p className="text-xs sm:text-sm text-[#a89f91] mt-0.5">
              Pilih akun aktif. Setiap baris hanya boleh diisi debit atau kredit (tidak keduanya).
            </p>
          </div>
          <button
            type="button"
            onClick={handleTambahBaris}
            disabled={isBusy}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-900/40 bg-[#161310] hover:bg-[#1e1a16] px-4 py-2 text-sm sm:text-base font-bold text-amber-300 transition shadow-sm disabled:opacity-50 shrink-0"
            id="btn-tambah-baris"
          >
            <span aria-hidden="true" className="font-black">+</span>
            <span>Tambah Baris</span>
          </button>
        </div>

        {/* Tabel Baris Jurnal */}
        <div className="space-y-3.5">
          {rows.map((row, index) => {
            const rowNumber = index + 1;
            const isDebitFilled = Boolean(row.debit && parseInt(row.debit, 10) > 0);
            const isKreditFilled = Boolean(row.kredit && parseInt(row.kredit, 10) > 0);

            return (
              <div
                key={row.key}
                className="rounded-xl border border-amber-900/30 bg-[#141210] p-4 sm:p-5 space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm sm:text-base font-bold text-amber-300 font-mono">
                    Baris #{rowNumber}
                  </span>
                  {rows.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleHapusBaris(index)}
                      disabled={isBusy}
                      className="text-xs sm:text-sm text-rose-400 hover:text-rose-300 font-bold transition flex items-center gap-1"
                      title="Hapus baris akun ini"
                      aria-label={`Hapus baris ke-${rowNumber}`}
                    >
                      <span aria-hidden="true">✕</span> Hapus Baris
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Pilihan Akun (Hanya Akun Aktif) */}
                  <div className="md:col-span-5 space-y-1.5">
                    <label
                      htmlFor={`akun-${index}`}
                      className="block text-xs sm:text-sm font-bold text-[#fdfaf6]"
                    >
                      Akun <span className="text-rose-400">*</span>
                    </label>
                    <select
                      id={`akun-${index}`}
                      value={row.akun_id}
                      onChange={(e) => handleAkunChange(index, e.target.value)}
                      disabled={isBusy}
                      required
                      className="w-full rounded-xl border border-amber-900/40 bg-[#0e0c0a] px-3.5 py-2.5 text-sm sm:text-base text-[#fdfaf6] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:opacity-50"
                    >
                      <option value="" className="bg-[#0e0c0a] text-[#fdfaf6]">-- Pilih Akun Aktif --</option>
                      {daftarAkun.map((a) => (
                        <option key={a.id} value={String(a.id)} className="bg-[#0e0c0a] text-[#fdfaf6]">
                          [{a.kode}] {a.nama} ({a.tipe.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nominal Debit */}
                  <div className="md:col-span-3 space-y-1.5">
                    <label
                      htmlFor={`debit-${index}`}
                      className="block text-xs sm:text-sm font-bold text-[#fdfaf6]"
                    >
                      Debit (Rp)
                    </label>
                    <input
                      id={`debit-${index}`}
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={row.debit}
                      onChange={(e) => handleDebitChange(index, e.target.value)}
                      disabled={isBusy || isKreditFilled}
                      className="w-full rounded-xl border border-amber-900/40 bg-[#0e0c0a] px-3.5 py-2.5 text-sm sm:text-base font-mono font-bold text-amber-300 placeholder-[#78716c] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:opacity-40 disabled:bg-[#161310]"
                    />
                    {isKreditFilled && (
                      <span className="text-xs text-[#a89f91] block">
                        Terkunci (sisi kredit terisi)
                      </span>
                    )}
                  </div>

                  {/* Nominal Kredit */}
                  <div className="md:col-span-3 space-y-1.5">
                    <label
                      htmlFor={`kredit-${index}`}
                      className="block text-xs sm:text-sm font-bold text-[#fdfaf6]"
                    >
                      Kredit (Rp)
                    </label>
                    <input
                      id={`kredit-${index}`}
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={row.kredit}
                      onChange={(e) => handleKreditChange(index, e.target.value)}
                      disabled={isBusy || isDebitFilled}
                      className="w-full rounded-xl border border-amber-900/40 bg-[#0e0c0a] px-3.5 py-2.5 text-sm sm:text-base font-mono font-bold text-amber-300 placeholder-[#78716c] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:opacity-40 disabled:bg-[#161310]"
                    />
                    {isDebitFilled && (
                      <span className="text-xs text-[#a89f91] block">
                        Terkunci (sisi debit terisi)
                      </span>
                    )}
                  </div>

                  {/* Keterangan Baris Opsional */}
                  <div className="md:col-span-12 space-y-1">
                    <label
                      htmlFor={`ket-baris-${index}`}
                      className="block text-xs font-medium text-[#a89f91]"
                    >
                      Keterangan Baris (Opsional)
                    </label>
                    <input
                      id={`ket-baris-${index}`}
                      type="text"
                      placeholder="Keterangan spesifik pos akun ini (opsional)..."
                      value={row.keterangan}
                      onChange={(e) => handleRowKeteranganChange(index, e.target.value)}
                      disabled={isBusy}
                      className="w-full rounded-xl border border-amber-900/30 bg-[#0e0c0a] px-3.5 py-2 text-sm text-[#fdfaf6] placeholder-[#78716c] focus:outline-none focus:border-amber-400 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ringkasan Total Debit, Kredit, & Status Keseimbangan (BR-02) */}
        <div className="rounded-xl border border-amber-900/30 bg-[#141210] p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
            <div className="rounded-xl bg-[#0e0c0a] p-4 border border-amber-900/25">
              <span className="text-xs uppercase font-bold text-[#a89f91] block">
                Total Debit
              </span>
              <span className="text-lg sm:text-xl font-mono font-black text-amber-300 tabular-nums mt-0.5 block">
                {formatRupiah(totalDebit)}
              </span>
            </div>

            <div className="rounded-xl bg-[#0e0c0a] p-4 border border-amber-900/25">
              <span className="text-xs uppercase font-bold text-[#a89f91] block">
                Total Kredit
              </span>
              <span className="text-lg sm:text-xl font-mono font-black text-amber-300 tabular-nums mt-0.5 block">
                {formatRupiah(totalKredit)}
              </span>
            </div>

            <div className="rounded-xl bg-[#0e0c0a] p-4 border border-amber-900/25">
              <span className="text-xs uppercase font-bold text-[#a89f91] block">
                Selisih Debit - Kredit
              </span>
              <span
                className={`text-lg sm:text-xl font-mono font-black tabular-nums mt-0.5 block ${
                  selisih === 0 && totalDebit > 0 ? "text-emerald-400" : "text-orange-400"
                }`}
              >
                {formatRupiah(selisih)}
              </span>
            </div>
          </div>

          {/* Banner Validasi Keseimbangan */}
          {isBalanced ? (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 text-sm sm:text-base text-emerald-300 flex items-center gap-2">
              <span className="font-bold text-emerald-400 text-lg">✓</span>
              <span>
                <strong>Jurnal Seimbang (BR-02).</strong> Total Debit ({formatRupiah(totalDebit)}) sama dengan Total Kredit ({formatRupiah(totalKredit)}).
              </span>
            </div>
          ) : (
            <div className="rounded-xl border border-orange-500/40 bg-orange-950/30 px-4 py-3 text-sm sm:text-base text-orange-300 flex items-start gap-2.5">
              <span className="font-bold text-orange-400 text-lg">⚠</span>
              <div className="leading-relaxed">
                <strong>Jurnal Belum Seimbang:</strong> Selisih sebesar {formatRupiah(selisih)}.
                Sesuai aturan akuntansi (BR-02), Total Debit harus sama persis dengan Total Kredit sebelum jurnal dapat diposting.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tombol Aksi Formulir */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-3 border-t border-amber-900/20">
        <Link
          href="/jurnal"
          className="w-full sm:w-auto text-center px-5 py-2.5 rounded-xl border border-amber-900/40 bg-[#161310] text-sm sm:text-base font-semibold text-[#a89f91] hover:text-[#fdfaf6] hover:bg-[#1e1a16] transition"
        >
          ← Batal & Kembali
        </Link>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Tombol Simpan Draf */}
          <button
            type="button"
            onClick={() => handleSimpanDraf()}
            disabled={isBusy}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-amber-900/40 bg-[#161310] px-5 py-2.5 text-sm sm:text-base font-bold text-amber-300 hover:bg-[#1e1a16] transition shadow-sm disabled:opacity-50"
            id="btn-simpan-draf"
          >
            {loadingAction === "draf" ? (
              <>
                <span className="animate-spin text-sm">⏳</span>
                <span>Menyimpan Draf...</span>
              </>
            ) : (
              <>
                <span aria-hidden="true" className="font-bold">✎</span>
                <span>Simpan Sebagai Draf</span>
              </>
            )}
          </button>

          {/* Tombol Posting Jurnal: Dinonaktifkan bila belum seimbang atau periode tertutup */}
          <button
            type="button"
            onClick={handlePostingJurnal}
            disabled={
              isBusy ||
              !isBalanced ||
              !rowsValid ||
              !periodeTerpilih ||
              periodeTerpilih.status !== "terbuka"
            }
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 px-6 py-2.5 text-sm sm:text-base font-bold text-black shadow-[0_0_15px_rgba(16,185,129,0.3)] transition disabled:opacity-40 disabled:cursor-not-allowed"
            id="btn-posting-jurnal"
            title={
              !isBalanced
                ? "Jurnal belum seimbang (BR-02). Total debit harus sama dengan total kredit."
                : periodeTerpilih?.status !== "terbuka"
                ? "Periode akuntansi berstatus ditutup (BR-05)."
                : "Posting jurnal ke buku besar"
            }
          >
            {loadingAction === "posting" ? (
              <>
                <span className="animate-spin text-sm">⏳</span>
                <span>Memposting...</span>
              </>
            ) : (
              <>
                <span aria-hidden="true" className="font-black text-base">✓</span>
                <span>Posting Jurnal (BR-02)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

