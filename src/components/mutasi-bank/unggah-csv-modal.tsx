"use client";

import { useState, useRef, useTransition } from "react";
import { getFriendlyErrorMessage } from "@/lib/utils/errors";
import { formatRupiah, formatDate } from "@/lib/utils/formatters";
import {
  parseMutasiBankCsv,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/mutasi-bank/csv-parser";
import type {
  AkunKasBankOption,
  CsvParseResult,
} from "@/lib/mutasi-bank/types";
import { FormatModal } from "./format-modal";
import {
  imporMutasiBankAction,
  cekDuplikatMutasiDbAction,
  type CekDuplikatItem,
} from "@/app/(dashboard)/mutasi-bank/actions";

interface UnggahCsvModalProps {
  isOpen: boolean;
  akunKasBankList: AkunKasBankOption[];
  onClose: () => void;
  onSuccess: (savedCountOrMessage: number | string) => void;
}

export function UnggahCsvModal({
  isOpen,
  akunKasBankList,
  onClose,
  onSuccess,
}: UnggahCsvModalProps) {
  const [selectedAkunId, setSelectedAkunId] = useState<string>(
    akunKasBankList[0]?.id ? String(akunKasBankList[0].id) : ""
  );
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorList, setErrorList] = useState<string[]>([]);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset state saat file dibatalkan/dihapus atau modal ditutup
  const handleResetFile = () => {
    setFile(null);
    setParseResult(null);
    setErrorMessage(null);
    setErrorList([]);
    setIsCheckingDb(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    handleResetFile();
    onClose();
  };

  if (!isOpen) return null;

  // Helper untuk mengecek apakah baris valid sudah ada di database mutasi_bank untuk akun kas/bank terpilih
  const enrichWithDbDuplicates = async (
    akunIdStr: string,
    result: CsvParseResult
  ): Promise<CsvParseResult> => {
    const akunId = parseInt(akunIdStr, 10);
    if (isNaN(akunId) || akunId <= 0 || result.barisValid === 0 || result.barisInvalid > 0) {
      return result;
    }

    const itemsToCheck: CekDuplikatItem[] = result.baris
      .filter((r) => r.isValid && r.tanggal && r.deskripsi && r.jumlah !== undefined)
      .map((r) => ({
        barisKe: r.barisKe,
        tanggal: r.tanggal!,
        deskripsi: r.deskripsi!,
        jumlah: r.jumlah!,
        saldo: r.saldo ?? null,
      }));

    if (itemsToCheck.length === 0) {
      return result;
    }

    setIsCheckingDb(true);
    try {
      const checkRes = await cekDuplikatMutasiDbAction(akunId, itemsToCheck);
      if (checkRes.success && checkRes.duplikatBarisKe) {
        const duplikatSet = new Set(checkRes.duplikatBarisKe);
        let duplikatCount = 0;
        const updatedBaris = result.baris.map((r) => {
          const isDup = duplikatSet.has(r.barisKe);
          if (isDup) duplikatCount++;
          return {
            ...r,
            isDuplikatDb: isDup,
          };
        });

        return {
          ...result,
          barisDuplikatDb: duplikatCount,
          barisBaruSiapImpor: Math.max(0, result.barisValid - duplikatCount),
          baris: updatedBaris,
        };
      }
    } catch (err) {
      console.error("Gagal memeriksa duplikat database:", err);
    } finally {
      setIsCheckingDb(false);
    }

    return result;
  };

  // Proses pembacaan dan parsing berkas CSV untuk pratinjau di antarmuka
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setErrorList([]);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // 1. Validasi ekstensi
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setErrorMessage("Berkas harus berupa file berekstensi .csv.");
      handleResetFile();
      return;
    }

    // 2. Validasi batas ukuran 1 MB (1.048.576 byte)
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(
        `Ukuran berkas (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB) melebihi batas maksimal 1 MB.`
      );
      handleResetFile();
      return;
    }

    setFile(selectedFile);

    try {
      const text = await selectedFile.text();
      const result = parseMutasiBankCsv(text);

      if (result.globalError) {
        setErrorMessage(result.globalError);
        setParseResult(result);
        if (result.barisInvalid > 0) {
          setErrorList(
            result.baris
              .filter((r) => !r.isValid)
              .map((r) => `Baris ${r.barisKe}: ${r.errors.join("; ")}`)
          );
        }
        return;
      }

      setParseResult(result);

      // Cek duplikasi di database untuk akun kas/bank yang sedang dipilih
      if (selectedAkunId && result.barisInvalid === 0) {
        const enriched = await enrichWithDbDuplicates(selectedAkunId, result);
        setParseResult(enriched);
      }
    } catch (err: unknown) {
      console.error("Gagal membaca file CSV:", err);
      setErrorMessage("Gagal membaca isi berkas CSV. Pastikan berkas berformat teks UTF-8.");
    }
  };

  // Jika akun bank diganti oleh pengguna
  const handleAkunChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAkunId = e.target.value;
    setSelectedAkunId(newAkunId);

    if (parseResult && parseResult.baris.length > 0 && parseResult.barisInvalid === 0) {
      const enriched = await enrichWithDbDuplicates(newAkunId, parseResult);
      setParseResult(enriched);
    }
  };

  // Perhitungan baris valid dan duplikat database
  const barisBaruCount = parseResult?.barisBaruSiapImpor ?? (
    parseResult ? parseResult.baris.filter((r) => r.isValid && !r.isDuplikatDb).length : 0
  );
  const duplikatDbCount = parseResult?.barisDuplikatDb ?? (
    parseResult ? parseResult.baris.filter((r) => r.isDuplikatDb).length : 0
  );

  // Eksekusi penyimpanan mutasi ke sisi server via Server Action
  const handleSimpan = () => {
    if (!selectedAkunId) {
      setErrorMessage("Silakan pilih akun kas/bank terlebih dahulu.");
      return;
    }

    if (!file) {
      setErrorMessage("Silakan pilih berkas CSV terlebih dahulu.");
      return;
    }

    if (!parseResult || parseResult.barisInvalid > 0) {
      setErrorMessage("Terdapat baris data yang belum valid. Perbaiki berkas CSV sebelum mengimpor.");
      return;
    }

    const formData = new FormData();
    formData.append("akun_bank_id", selectedAkunId);
    formData.append("file", file);

    startTransition(async () => {
      setErrorMessage(null);
      setErrorList([]);
      try {
        const res = await imporMutasiBankAction(formData);

        if (!res.success) {
          setErrorMessage(res.message);
          if (res.errors && res.errors.length > 0) {
            setErrorList(res.errors);
          }
          return;
        }

        handleResetFile();
        onSuccess(res.message);
      } catch (err: unknown) {
        console.error("Gagal menyimpan mutasi bank:", err);
        setErrorMessage(getFriendlyErrorMessage(err));
      }
    });
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="unggah-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6 overflow-y-auto backdrop-blur-md animate-in fade-in duration-150"
      >
        <div className="sogan-card relative w-full max-w-4xl bg-[#0e0c0a] rounded-2xl shadow-2xl border border-amber-500/25 overflow-hidden my-6 text-[#fdfaf6]">
          {/* Header Modal */}
          <div className="px-6 sm:px-7 py-5 border-b border-amber-900/20 flex items-center justify-between bg-[#141210]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <h3 id="unggah-modal-title" className="text-xl font-bold text-[#fdfaf6]">
                  Unggah CSV Mutasi Rekening Bank
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#a89f91]">
                Proses impor transaksi rekening koran bank secara mandiri (maks. 1 MB & 1.000 baris)
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="text-[#8a7e72] hover:text-[#fdfaf6] rounded-xl p-2 hover:bg-[#1a1613] transition text-base disabled:opacity-50"
              aria-label="Tutup jendela unggah"
            >
              ✕
            </button>
          </div>

          {/* Body Modal */}
          <div className="p-6 sm:p-7 space-y-5 max-h-[75vh] overflow-y-auto">
            {errorMessage && (
              <div
                role="alert"
                className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl text-sm text-rose-200 flex flex-col gap-2"
              >
                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-rose-400 text-base">⚠</span>
                  <span className="whitespace-pre-line font-medium">{errorMessage}</span>
                </div>
                {errorList.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-xl bg-[#141210] p-3 text-xs text-rose-300 border border-rose-500/30 space-y-1">
                    <div className="font-bold text-[#fdfaf6] mb-1">Rincian Kesalahan per Baris:</div>
                    {errorList.map((err, idx) => (
                      <div key={idx} className="font-mono text-xs text-rose-400">
                        • {err}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Kontrol Akun & Berkas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Pilihan Akun Bank */}
              <div className="space-y-1.5">
                <label htmlFor="akun-bank-select" className="block text-sm sm:text-base font-semibold text-[#d6cfc7]">
                  Pilih Akun Kas / Bank <span className="text-amber-400">*</span>
                </label>
                <select
                  id="akun-bank-select"
                  value={selectedAkunId}
                  onChange={handleAkunChange}
                  disabled={isPending}
                  className="w-full text-sm sm:text-base rounded-xl border border-amber-900/30 bg-[#141210] px-4 py-3 text-[#fdfaf6] focus:border-amber-500/80 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                >
                  {akunKasBankList.map((a) => (
                    <option key={a.id} value={a.id} className="bg-[#141210] text-[#fdfaf6]">
                      {a.kode} - {a.nama}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#8a7e72]">
                  Hanya menampilkan akun kas atau bank yang aktif (is_kas_bank).
                </p>
              </div>

              {/* Tautan Panduan Format CSV */}
              <div className="flex flex-col justify-end">
                <div className="p-4 bg-[#141210] border border-amber-900/30 rounded-xl flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <span className="font-bold text-[#fdfaf6] block">Butuh bantuan format berkas?</span>
                    <span className="text-xs text-[#a89f91]">Lihat aturan kolom & contoh CSV siap pakai</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFormatModal(true)}
                    className="btn-3d-dark px-3.5 py-1.5 text-xs sm:text-sm font-bold text-amber-300 whitespace-nowrap"
                  >
                    Format CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Input Berkas CSV */}
            <div className="space-y-2">
              <label htmlFor="csv-file-input" className="block text-sm sm:text-base font-semibold text-[#d6cfc7]">
                Pilih Berkas CSV Mutasi Bank <span className="text-amber-400">*</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="csv-file-input"
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isPending}
                  className="block w-full text-sm text-[#a89f91] file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs sm:file:text-sm file:font-bold file:bg-amber-950/60 file:text-amber-300 hover:file:bg-amber-900/60 file:border file:border-amber-500/40 border border-amber-900/30 rounded-xl bg-[#141210] cursor-pointer disabled:opacity-50"
                />
                {file && (
                  <button
                    type="button"
                    onClick={handleResetFile}
                    disabled={isPending}
                    className="btn-3d-dark text-xs sm:text-sm px-4 py-2 text-rose-400 font-bold"
                    title="Hapus berkas terpilih"
                  >
                    Batal
                  </button>
                )}
              </div>
              <p className="text-xs text-[#8a7e72]">
                Ekstensi wajib .csv, ukuran maks. 1 MB, batas maks. 1.000 baris data transaksi.
              </p>
            </div>

            {/* Ringkasan & Pratinjau Baris Data */}
            {parseResult && (
              <div className="space-y-4 pt-3 border-t border-amber-900/20">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
                  <div className="p-3.5 bg-[#141210] border border-amber-900/20 rounded-xl">
                    <span className="text-[#8a7e72] block text-xs">Total Baris CSV</span>
                    <span className="font-mono font-bold text-[#fdfaf6] text-lg">
                      {parseResult.totalBaris.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className={`p-3.5 rounded-xl border ${
                    barisBaruCount > 0
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                      : "bg-[#141210] border-amber-900/20 text-[#8a7e72]"
                  }`}>
                    <span className="block text-xs font-semibold">
                      Baru & Siap Impor
                    </span>
                    <span className="font-mono font-bold text-lg text-emerald-300">
                      {barisBaruCount.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className={`p-3.5 rounded-xl border ${
                    duplikatDbCount > 0
                      ? "bg-amber-950/40 border-amber-500/40 text-amber-200"
                      : "bg-[#141210] border-amber-900/20 text-[#8a7e72]"
                  }`}>
                    <span className="block text-xs font-semibold">
                      Sudah di Database
                    </span>
                    <span className="font-mono font-bold text-lg text-amber-300">
                      {duplikatDbCount.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className={`p-3.5 rounded-xl border ${
                    parseResult.barisInvalid > 0
                      ? "bg-rose-950/40 border-rose-500/40 text-rose-200"
                      : "bg-[#141210] border-amber-900/20 text-[#8a7e72]"
                  }`}>
                    <span className="block text-xs font-semibold">
                      Cacat / Invalid
                    </span>
                    <span className="font-mono font-bold text-lg text-rose-300">
                      {parseResult.barisInvalid.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Notifikasi jika ada kembar identik dalam berkas CSV */}
                {parseResult.barisKembarBerkas > 0 && (
                  <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs sm:text-sm text-amber-200 flex items-center gap-2">
                    <span>⚠</span>
                    <span>Terdapat {parseResult.barisKembarBerkas} baris kembar identik di dalam berkas CSV.</span>
                  </div>
                )}

                {/* Pratinjau Tabel Transaksi */}
                <div className="border border-amber-900/20 rounded-xl overflow-hidden">
                  <div className="bg-[#141210] px-4 py-2.5 border-b border-amber-900/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm">
                    <span className="font-bold text-[#fdfaf6]">
                      Pratinjau Data Transaksi ({Math.min(parseResult.baris.length, 50)} dari {parseResult.totalBaris} baris)
                    </span>
                    <span className="text-xs text-[#8a7e72]">
                      {isCheckingDb ? "Sedang memeriksa duplikat di database..." : "Format desimal, eksponen, & duplikat otomatis divalidasi"}
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-xs sm:text-sm text-left border-collapse">
                      <thead className="bg-[#141210] text-xs font-bold text-[#d6cfc7] uppercase border-b border-amber-900/30 sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3.5 w-14 text-center">Baris</th>
                          <th className="py-2.5 px-3.5 w-28">Tanggal</th>
                          <th className="py-2.5 px-3.5">Deskripsi Transaksi</th>
                          <th className="py-2.5 px-3.5 text-right w-32">Jumlah (Rp)</th>
                          <th className="py-2.5 px-3.5 text-right w-32">Saldo (Rp)</th>
                          <th className="py-2.5 px-3.5 w-36 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-900/10">
                        {parseResult.baris.slice(0, 50).map((row) => {
                          const isInvalid = !row.isValid;
                          const isMasuk = (row.jumlah || 0) > 0;
                          const isDupDb = Boolean(row.isDuplikatDb);

                          return (
                            <tr
                              key={row.barisKe}
                              className={`hover:bg-[#161311] transition-colors ${
                                isInvalid
                                  ? "bg-rose-950/20"
                                  : isDupDb
                                  ? "bg-amber-950/20"
                                  : ""
                              }`}
                            >
                              <td className="py-2.5 px-3.5 text-center text-[#8a7e72] font-mono text-xs">
                                {row.barisKe}
                              </td>
                              <td className="py-2.5 px-3.5 text-[#fdfaf6] whitespace-nowrap">
                                {row.tanggal ? formatDate(row.tanggal) : <span className="text-rose-400">{row.rawTanggal || "-"}</span>}
                              </td>
                              <td className="py-2.5 px-3.5 text-[#fdfaf6] max-w-xs truncate" title={row.deskripsi || row.rawDeskripsi}>
                                {row.deskripsi || <span className="text-rose-400 italic">(Kosong)</span>}
                              </td>
                              <td className="py-2.5 px-3.5 text-right whitespace-nowrap font-mono tabular-nums">
                                {row.jumlah !== undefined ? (
                                  <span className={`font-bold ${isMasuk ? "text-emerald-300" : "text-rose-300"}`}>
                                    {isMasuk ? "+" : ""}
                                    {formatRupiah(row.jumlah)}
                                  </span>
                                ) : (
                                  <span className="text-rose-400">{row.rawJumlah || "-"}</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3.5 text-right text-[#d6cfc7] whitespace-nowrap font-mono tabular-nums">
                                {row.saldo !== null && row.saldo !== undefined ? formatRupiah(row.saldo) : <span className="text-[#5a524a]">-</span>}
                              </td>
                              <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                                {isInvalid ? (
                                  <div className="flex flex-col items-center">
                                    <span
                                      className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950/60 text-rose-300 border border-rose-500/40 cursor-help"
                                      title={row.errors.join(", ")}
                                    >
                                      ✕ Cacat
                                    </span>
                                  </div>
                                ) : isDupDb ? (
                                  <span
                                    className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40 cursor-help"
                                    title="Transaksi ini sudah ada di database mutasi bank untuk akun ini. Baris ini akan dilewati otomatis saat impor."
                                  >
                                    ⚠ Di Database
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                                    ✓ Baru & Valid
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Modal */}
          <div className="px-6 sm:px-7 py-4 border-t border-amber-900/20 bg-[#141210] flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs sm:text-sm text-[#8a7e72]">
              {parseResult && (
                <>
                  {barisBaruCount > 0 ? (
                    <>
                      Baru: <strong className="text-emerald-300">{barisBaruCount} baris</strong>
                      {duplikatDbCount > 0 && (
                        <span className="text-amber-400 ml-1.5 font-medium">
                          ({duplikatDbCount} sudah di database, akan dilewati)
                        </span>
                      )}
                    </>
                  ) : duplikatDbCount > 0 ? (
                    <span className="text-amber-400 font-semibold">
                      Semua transaksi ({duplikatDbCount} baris) sudah ada di database (akan dilewati).
                    </span>
                  ) : (
                    <>
                      Valid: <strong className="text-emerald-300">{barisBaruCount} baris</strong>
                    </>
                  )}
                  {parseResult.barisInvalid > 0 && (
                    <span className="text-rose-400 ml-1">
                      ({parseResult.barisInvalid} cacat, seluruh impor ditolak)
                    </span>
                  )}
                </>
              )}
            </span>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="btn-3d-dark px-5 py-2.5 text-sm font-bold disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSimpan}
                disabled={
                  isPending ||
                  isCheckingDb ||
                  !parseResult ||
                  parseResult.barisInvalid > 0 ||
                  parseResult.totalBaris === 0
                }
                className="btn-3d-gold inline-flex items-center gap-2 px-6 py-2.5 text-sm sm:text-base font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span> Mengimpor ke Server...
                  </>
                ) : isCheckingDb ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span> Memeriksa Duplikat DB...
                  </>
                ) : barisBaruCount === 0 && duplikatDbCount > 0 ? (
                  <>
                    <span>📥</span> Impor Mutasi (0 Baru, {duplikatDbCount} Dilewati)
                  </>
                ) : duplikatDbCount > 0 ? (
                  <>
                    <span>📥</span> Impor Mutasi ({barisBaruCount} Baru, {duplikatDbCount} Dilewati)
                  </>
                ) : (
                  <>
                    <span>📥</span> Impor Mutasi ({barisBaruCount} Baris)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Format & Contoh Berkas CSV */}
      <FormatModal
        isOpen={showFormatModal}
        onClose={() => setShowFormatModal(false)}
      />
    </>
  );
}
