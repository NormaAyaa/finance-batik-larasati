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
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-4 max-w-lg mx-auto my-8 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-2xl font-bold">
          ✓
        </div>
        <div>
          <h2 className="text-base font-bold text-emerald-950">Jurnal Berhasil Diposting!</h2>
          <p className="text-xs text-emerald-800 mt-1">
            Transaksi telah resmi diposting ke buku besar dengan nomor dokumen:
          </p>
          <div className="mt-3 inline-block rounded-lg bg-white border border-emerald-300 px-4 py-2 font-mono text-base font-bold text-emerald-900 shadow-inner">
            {successInfo.nomor}
          </div>
        </div>
        <div className="pt-2 flex justify-center gap-2">
          <Link
            href={`/jurnal/${successInfo.id}`}
            className="rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 transition"
          >
            Lihat Detail Jurnal →
          </Link>
          <Link
            href="/jurnal"
            className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition"
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
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-2 shadow-sm"
        >
          <span className="text-base leading-none font-bold text-red-600">✕</span>
          <div className="flex-1">
            <strong className="block font-semibold">Gagal memproses transaksi:</strong>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-900 font-bold ml-2"
            aria-label="Tutup pesan galat"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bagian Header Form: Tanggal, Periode, Keterangan */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          Informasi Utama Jurnal
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tanggal Transaksi */}
          <div>
            <label htmlFor="input-tanggal" className="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal Transaksi <span className="text-red-500">*</span>
            </label>
            <input
              id="input-tanggal"
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              disabled={isBusy}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700 disabled:bg-slate-50"
            />
          </div>

          {/* Periode Terdeteksi Otomatis */}
          <div>
            <label htmlFor="display-periode" className="block text-xs font-semibold text-slate-700 mb-1">
              Periode Akuntansi (Otomatis dari Tanggal)
            </label>
            <div
              id="display-periode"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
            >
              <span className="font-medium text-slate-700">
                {periodeTerpilih
                  ? formatBulanTahun(periodeTerpilih.tahun, periodeTerpilih.bulan)
                  : "Pilih tanggal"}
              </span>

              {periodeTerpilih && (
                <div>
                  {periodeTerpilih.status === "terbuka" && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800"
                      title="Periode akuntansi terbuka untuk posting jurnal"
                    >
                      <span aria-hidden="true">✓</span> Terbuka
                    </span>
                  )}
                  {periodeTerpilih.status === "ditutup" && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-800"
                      title="Periode telah ditutup (BR-05)"
                    >
                      <span aria-hidden="true">✕</span> Ditutup
                    </span>
                  )}
                  {periodeTerpilih.status === "tidak_ada" && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900"
                      title="Periode belum dibuat di sistem"
                    >
                      <span aria-hidden="true">⚠</span> Belum Dibuat
                    </span>
                  )}
                </div>
              )}
            </div>

            {periodeTerpilih && periodeTerpilih.status === "ditutup" && (
              <p className="text-[11px] text-red-600 mt-1 font-medium">
                ⚠ Tanggal ini berada di periode yang telah ditutup. Jurnal tidak dapat disimpan (BR-05).
              </p>
            )}
            {periodeTerpilih && periodeTerpilih.status === "tidak_ada" && (
              <p className="text-[11px] text-amber-700 mt-1">
                ⚠ Periode akuntansi belum dibuat oleh Akuntan pada menu Akun & Periode.
              </p>
            )}
          </div>
        </div>

        {/* Keterangan Transaksi */}
        <div>
          <label htmlFor="input-keterangan" className="block text-xs font-semibold text-slate-700 mb-1">
            Keterangan Transaksi <span className="text-red-500">*</span>
            <span className="text-[11px] font-normal text-slate-500 ml-1">
              (minimal 5 karakter)
            </span>
          </label>
          <textarea
            id="input-keterangan"
            rows={2}
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            disabled={isBusy}
            placeholder="Contoh: Pembelian perlengkapan kantor tunai..."
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700 disabled:bg-slate-50"
          />
        </div>
      </div>

      {/* Bagian Rincian Baris Jurnal */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Baris Akun Jurnal (BR-02)</h2>
            <p className="text-[11px] text-slate-500">
              Pilih akun aktif. Setiap baris hanya boleh diisi debit atau kredit (tidak keduanya).
            </p>
          </div>
          <button
            type="button"
            onClick={handleTambahBaris}
            disabled={isBusy}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-800 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition disabled:opacity-50"
            id="btn-tambah-baris"
          >
            <span aria-hidden="true" className="font-bold">+</span>
            <span>Tambah Baris</span>
          </button>
        </div>

        {/* Tabel Baris Jurnal */}
        <div className="space-y-3">
          {rows.map((row, index) => {
            const rowNumber = index + 1;
            const isDebitFilled = Boolean(row.debit && parseInt(row.debit, 10) > 0);
            const isKreditFilled = Boolean(row.kredit && parseInt(row.kredit, 10) > 0);

            return (
              <div
                key={row.key}
                className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Baris #{rowNumber}
                  </span>
                  {rows.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleHapusBaris(index)}
                      disabled={isBusy}
                      className="text-xs text-red-600 hover:text-red-800 font-semibold transition"
                      title="Hapus baris akun ini"
                      aria-label={`Hapus baris ke-${rowNumber}`}
                    >
                      ✕ Hapus Baris
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Pilihan Akun (Hanya Akun Aktif) */}
                  <div className="md:col-span-5">
                    <label
                      htmlFor={`akun-${index}`}
                      className="block text-[11px] font-semibold text-slate-600 mb-1"
                    >
                      Akun <span className="text-red-500">*</span>
                    </label>
                    <select
                      id={`akun-${index}`}
                      value={row.akun_id}
                      onChange={(e) => handleAkunChange(index, e.target.value)}
                      disabled={isBusy}
                      required
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 bg-white focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700 disabled:bg-slate-100"
                    >
                      <option value="">-- Pilih Akun Aktif --</option>
                      {daftarAkun.map((a) => (
                        <option key={a.id} value={String(a.id)}>
                          [{a.kode}] {a.nama} ({a.tipe.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nominal Debit */}
                  <div className="md:col-span-3">
                    <label
                      htmlFor={`debit-${index}`}
                      className="block text-[11px] font-semibold text-slate-600 mb-1"
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
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                    {isKreditFilled && (
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Terkunci (sisi kredit terisi)
                      </span>
                    )}
                  </div>

                  {/* Nominal Kredit */}
                  <div className="md:col-span-3">
                    <label
                      htmlFor={`kredit-${index}`}
                      className="block text-[11px] font-semibold text-slate-600 mb-1"
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
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                    {isDebitFilled && (
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Terkunci (sisi debit terisi)
                      </span>
                    )}
                  </div>

                  {/* Keterangan Baris Opsional */}
                  <div className="md:col-span-12">
                    <label
                      htmlFor={`ket-baris-${index}`}
                      className="block text-[10px] font-medium text-slate-500 mb-0.5"
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
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-700 placeholder-slate-400 bg-white focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700 disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ringkasan Total Debit, Kredit, & Status Keseimbangan (BR-02) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left">
            <div className="rounded-lg bg-white p-3 border border-slate-200">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                Total Debit
              </span>
              <span className="text-base font-mono font-bold text-slate-900">
                {formatRupiah(totalDebit)}
              </span>
            </div>

            <div className="rounded-lg bg-white p-3 border border-slate-200">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                Total Kredit
              </span>
              <span className="text-base font-mono font-bold text-slate-900">
                {formatRupiah(totalKredit)}
              </span>
            </div>

            <div className="rounded-lg bg-white p-3 border border-slate-200">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                Selisih Debit - Kredit
              </span>
              <span
                className={`text-base font-mono font-bold ${
                  selisih === 0 && totalDebit > 0 ? "text-emerald-700" : "text-amber-800"
                }`}
              >
                {formatRupiah(selisih)}
              </span>
            </div>
          </div>

          {/* Banner Validasi Keseimbangan */}
          {isBalanced ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs text-emerald-800 flex items-center gap-2">
              <span className="font-bold text-emerald-700">✓</span>
              <span>
                <strong>Jurnal Seimbang (BR-02).</strong> Total Debit ({formatRupiah(totalDebit)}) sama dengan Total Kredit ({formatRupiah(totalKredit)}).
              </span>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs text-amber-900 flex items-start gap-2">
              <span className="font-bold text-amber-800 text-sm">⚠</span>
              <div>
                <strong>Jurnal Belum Seimbang:</strong> Selisih sebesar {formatRupiah(selisih)}.
                Sesuai aturan akuntansi (BR-02), Total Debit harus sama persis dengan Total Kredit sebelum jurnal dapat diposting.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tombol Aksi Formulir */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        <Link
          href="/jurnal"
          className="w-full sm:w-auto text-center px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
        >
          ← Batal & Kembali
        </Link>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          {/* Tombol Simpan Draf */}
          <button
            type="button"
            onClick={() => handleSimpanDraf()}
            disabled={isBusy}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
            id="btn-simpan-draf"
          >
            {loadingAction === "draf" ? (
              <>
                <span className="animate-spin text-xs">⏳</span>
                <span>Menyimpan Draf...</span>
              </>
            ) : (
              <>
                <span aria-hidden="true">✎</span>
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
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
                <span className="animate-spin text-xs">⏳</span>
                <span>Memposting...</span>
              </>
            ) : (
              <>
                <span aria-hidden="true" className="font-bold">✓</span>
                <span>Posting Jurnal (BR-02)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
