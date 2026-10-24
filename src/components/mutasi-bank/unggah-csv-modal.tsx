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
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto animate-in fade-in duration-150"
      >
        <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
          {/* Header Modal */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h3 id="unggah-modal-title" className="text-base font-bold text-slate-900">
                Unggah CSV Mutasi Rekening Bank
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Proses impor transaksi rekening koran bank secara mandiri (maks. 1 MB & 1.000 baris)
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-200 transition disabled:opacity-50"
              aria-label="Tutup jendela unggah"
            >
              ✕
            </button>
          </div>

          {/* Body Modal */}
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {errorMessage && (
              <div
                role="alert"
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex flex-col gap-1.5"
              >
                <div className="flex items-start gap-2">
                  <span className="font-bold text-red-600">⚠</span>
                  <span className="whitespace-pre-line font-medium">{errorMessage}</span>
                </div>
                {errorList.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-lg bg-white p-2.5 text-xs text-red-700 border border-red-200 space-y-1">
                    <div className="font-bold text-slate-800 mb-1">Rincian Kesalahan per Baris:</div>
                    {errorList.map((err, idx) => (
                      <div key={idx} className="font-mono text-[11px] text-red-600">
                        • {err}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Kontrol Akun & Berkas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pilihan Akun Bank */}
              <div className="space-y-1">
                <label htmlFor="akun-bank-select" className="block text-xs font-bold text-slate-800">
                  Pilih Akun Kas / Bank <span className="text-red-500">*</span>
                </label>
                <select
                  id="akun-bank-select"
                  value={selectedAkunId}
                  onChange={handleAkunChange}
                  disabled={isPending}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {akunKasBankList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.kode} - {a.nama}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  Hanya menampilkan akun kas atau bank yang aktif (is_kas_bank).
                </p>
              </div>

              {/* Tautan Panduan Format CSV */}
              <div className="flex flex-col justify-end">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800 block">Butuh bantuan format berkas?</span>
                    <span className="text-[11px] text-slate-500">Lihat aturan kolom & contoh CSV siap pakai</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFormatModal(true)}
                    className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition whitespace-nowrap"
                  >
                    Format CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Input Berkas CSV */}
            <div className="space-y-1.5">
              <label htmlFor="csv-file-input" className="block text-xs font-bold text-slate-800">
                Pilih Berkas CSV Mutasi Bank <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="csv-file-input"
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isPending}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer border border-slate-300 rounded-lg bg-white cursor-pointer disabled:opacity-50"
                />
                {file && (
                  <button
                    type="button"
                    onClick={handleResetFile}
                    disabled={isPending}
                    className="text-xs px-2.5 py-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                    title="Hapus berkas terpilih"
                  >
                    Batal
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Ekstensi wajib .csv, ukuran maks. 1 MB, batas maks. 1.000 baris data transaksi.
              </p>
            </div>

            {/* Ringkasan & Pratinjau Baris Data */}
            {parseResult && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-500 block text-[10px]">Total Baris CSV</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {parseResult.totalBaris.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-lg border ${
                    barisBaruCount > 0
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-slate-50 border-slate-200"
                  }`}>
                    <span className={`block text-[10px] ${barisBaruCount > 0 ? "text-emerald-700" : "text-slate-500"}`}>
                      Baru & Siap Impor
                    </span>
                    <span className={`font-bold text-sm ${barisBaruCount > 0 ? "text-emerald-800" : "text-slate-600"}`}>
                      {barisBaruCount.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-lg border ${
                    duplikatDbCount > 0
                      ? "bg-amber-50 border-amber-300"
                      : "bg-slate-50 border-slate-200"
                  }`}>
                    <span className={`block text-[10px] ${duplikatDbCount > 0 ? "text-amber-700" : "text-slate-500"}`}>
                      Sudah di Database
                    </span>
                    <span className={`font-bold text-sm ${duplikatDbCount > 0 ? "text-amber-800" : "text-slate-600"}`}>
                      {duplikatDbCount.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-lg border ${
                    parseResult.barisInvalid > 0
                      ? "bg-red-50 border-red-200"
                      : "bg-slate-50 border-slate-200"
                  }`}>
                    <span className={`block text-[10px] ${parseResult.barisInvalid > 0 ? "text-red-700" : "text-slate-500"}`}>
                      Cacat / Invalid
                    </span>
                    <span className={`font-bold text-sm ${parseResult.barisInvalid > 0 ? "text-red-800" : "text-slate-600"}`}>
                      {parseResult.barisInvalid.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Notifikasi jika ada kembar identik dalam berkas CSV */}
                {parseResult.barisKembarBerkas > 0 && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                    <span>⚠</span>
                    <span>Terdapat {parseResult.barisKembarBerkas} baris kembar identik di dalam berkas CSV.</span>
                  </div>
                )}

                {/* Pratinjau Tabel Transaksi */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      Pratinjau Data Transaksi ({Math.min(parseResult.baris.length, 50)} dari {parseResult.totalBaris} baris)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isCheckingDb ? "Sedang memeriksa duplikat di database..." : "Format desimal, eksponen, & duplikat otomatis divalidasi"}
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="py-1.5 px-3 w-12 text-center">Baris</th>
                          <th className="py-1.5 px-3 w-24">Tanggal</th>
                          <th className="py-1.5 px-3">Deskripsi Transaksi</th>
                          <th className="py-1.5 px-3 text-right w-28">Jumlah (Rp)</th>
                          <th className="py-1.5 px-3 text-right w-28">Saldo (Rp)</th>
                          <th className="py-1.5 px-3 w-32 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parseResult.baris.slice(0, 50).map((row) => {
                          const isInvalid = !row.isValid;
                          const isMasuk = (row.jumlah || 0) > 0;
                          const isDupDb = Boolean(row.isDuplikatDb);
                          return (
                            <tr
                              key={row.barisKe}
                              className={`hover:bg-slate-50 ${
                                isInvalid
                                  ? "bg-red-50/50"
                                  : isDupDb
                                  ? "bg-amber-50/40"
                                  : ""
                              }`}
                            >
                              <td className="py-1.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                                {row.barisKe}
                              </td>
                              <td className="py-1.5 px-3 text-slate-800 whitespace-nowrap">
                                {row.tanggal ? formatDate(row.tanggal) : <span className="text-red-500">{row.rawTanggal || "-"}</span>}
                              </td>
                              <td className="py-1.5 px-3 text-slate-800 max-w-xs truncate" title={row.deskripsi || row.rawDeskripsi}>
                                {row.deskripsi || <span className="text-red-500 italic">(Kosong)</span>}
                              </td>
                              <td className="py-1.5 px-3 text-right whitespace-nowrap">
                                {row.jumlah !== undefined ? (
                                  <span className={`font-semibold ${isMasuk ? "text-emerald-700" : "text-rose-700"}`}>
                                    {isMasuk ? "+" : ""}
                                    {formatRupiah(row.jumlah)}
                                  </span>
                                ) : (
                                  <span className="text-red-500">{row.rawJumlah || "-"}</span>
                                )}
                              </td>
                              <td className="py-1.5 px-3 text-right text-slate-600 whitespace-nowrap">
                                {row.saldo !== null && row.saldo !== undefined ? formatRupiah(row.saldo) : <span className="text-slate-400">-</span>}
                              </td>
                              <td className="py-1.5 px-3 text-center whitespace-nowrap">
                                {isInvalid ? (
                                  <div className="flex flex-col items-center">
                                    <span
                                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 cursor-help"
                                      title={row.errors.join(", ")}
                                    >
                                      ✕ Cacat
                                    </span>
                                  </div>
                                ) : isDupDb ? (
                                  <span
                                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 cursor-help"
                                    title="Transaksi ini sudah ada di database mutasi bank untuk akun ini. Baris ini akan dilewati otomatis saat impor."
                                  >
                                    ⚠ Sudah di Database
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
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
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {parseResult && (
                <>
                  {barisBaruCount > 0 ? (
                    <>
                      Baru: <strong className="text-emerald-700">{barisBaruCount} baris</strong>
                      {duplikatDbCount > 0 && (
                        <span className="text-amber-700 ml-1.5 font-medium">
                          ({duplikatDbCount} sudah di database, akan dilewati)
                        </span>
                      )}
                    </>
                  ) : duplikatDbCount > 0 ? (
                    <span className="text-amber-700 font-semibold">
                      Semua transaksi ({duplikatDbCount} baris) sudah ada di database (akan dilewati).
                    </span>
                  ) : (
                    <>
                      Valid: <strong>{barisBaruCount} baris</strong>
                    </>
                  )}
                  {parseResult.barisInvalid > 0 && (
                    <span className="text-red-600 ml-1">
                      ({parseResult.barisInvalid} cacat, seluruh impor ditolak)
                    </span>
                  )}
                </>
              )}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
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
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
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
                    <span>📥</span> Impor Mutasi (0 Baris Baru, {duplikatDbCount} Dilewati)
                  </>
                ) : duplikatDbCount > 0 ? (
                  <>
                    <span>📥</span> Impor Mutasi ({barisBaruCount} Baris Baru, {duplikatDbCount} Dilewati)
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
