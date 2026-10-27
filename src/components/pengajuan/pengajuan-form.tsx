"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { transisiStatusPengajuanAction } from "@/app/(dashboard)/pengajuan/actions";
import { getFriendlyErrorMessage } from "@/lib/utils/errors";
import { formatRupiah } from "@/lib/utils/formatters";
import type { JenisPengajuan, StatusPengajuan } from "@/types/database";

interface ExpenseAccount {
  id: number;
  kode: string;
  nama: string;
}

interface PengajuanFormProps {
  userRole: "staf" | "akuntan";
  userId: string;
  expenseAccounts: ExpenseAccount[];
  initialData?: {
    id: number;
    nomor: string | null;
    jenis: JenisPengajuan;
    tanggal_transaksi: string;
    akun_beban_id: number;
    jumlah: number;
    keterangan: string;
    bukti_path: string | null;
    status: StatusPengajuan;
    catatan_peninjau: string | null;
  };
  mode: "create" | "edit";
}

export function PengajuanForm({
  userRole,
  userId,
  expenseAccounts,
  initialData,
  mode,
}: PengajuanFormProps) {
  const router = useRouter();
  const supabase = createClient();

  // Hitung batas tanggal: maksimal 30 hari ke belakang dan tidak boleh di masa depan (BR-07)
  const todayStr = new Date().toISOString().split("T")[0];
  const minDateObj = new Date();
  minDateObj.setDate(minDateObj.getDate() - 30);
  const minDateStr = minDateObj.toISOString().split("T")[0];

  // State form
  const [jenis, setJenis] = useState<JenisPengajuan>(
    initialData?.jenis || "reimburse"
  );
  const [tanggalTransaksi, setTanggalTransaksi] = useState<string>(
    initialData?.tanggal_transaksi || todayStr
  );
  const [akunBebanId, setAkunBebanId] = useState<number | "">(
    initialData?.akun_beban_id || (expenseAccounts[0]?.id ?? "")
  );
  const [jumlah, setJumlah] = useState<string>(
    initialData?.jumlah ? String(initialData.jumlah) : ""
  );
  const [keterangan, setKeterangan] = useState<string>(
    initialData?.keterangan || ""
  );
  const [file, setFile] = useState<File | null>(null);
  const [existingBuktiPath] = useState<string | null>(
    initialData?.bukti_path || null
  );

  // Status submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionType, setActionType] = useState<"draf" | "kirim">("kirim");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State fitur AI ekstraksi nota
  const [userTouchedTanggal, setUserTouchedTanggal] = useState<boolean>(
    Boolean(initialData?.tanggal_transaksi)
  );
  const [userTouchedAkun, setUserTouchedAkun] = useState<boolean>(
    Boolean(initialData?.akun_beban_id)
  );
  const [isExtractingAi, setIsExtractingAi] = useState(false);
  const [aiNotification, setAiNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [aiAppliedFields, setAiAppliedFields] = useState<{
    tanggal: boolean;
    jumlah: boolean;
    keterangan: boolean;
    akunBeban: boolean;
  }>({
    tanggal: false,
    jumlah: false,
    keterangan: false,
    akunBeban: false,
  });
  const [aiSuggestions, setAiSuggestions] = useState<{
    tanggal?: string;
    jumlah?: number;
    keterangan?: string;
    akunBebanId?: number;
    akunBebanLabel?: string;
  }>({});

  const applyAiSuggestion = (
    field: "tanggal" | "jumlah" | "keterangan" | "akunBeban"
  ) => {
    if (field === "tanggal" && aiSuggestions.tanggal) {
      setTanggalTransaksi(aiSuggestions.tanggal);
      setAiAppliedFields((prev) => ({ ...prev, tanggal: true }));
      setAiSuggestions((prev) => {
        const copy = { ...prev };
        delete copy.tanggal;
        return copy;
      });
    } else if (field === "jumlah" && aiSuggestions.jumlah) {
      setJumlah(String(aiSuggestions.jumlah));
      setAiAppliedFields((prev) => ({ ...prev, jumlah: true }));
      setAiSuggestions((prev) => {
        const copy = { ...prev };
        delete copy.jumlah;
        return copy;
      });
    } else if (field === "keterangan" && aiSuggestions.keterangan) {
      setKeterangan(aiSuggestions.keterangan);
      setAiAppliedFields((prev) => ({ ...prev, keterangan: true }));
      setAiSuggestions((prev) => {
        const copy = { ...prev };
        delete copy.keterangan;
        return copy;
      });
    } else if (field === "akunBeban" && aiSuggestions.akunBebanId) {
      setAkunBebanId(aiSuggestions.akunBebanId);
      setAiAppliedFields((prev) => ({ ...prev, akunBeban: true }));
      setAiSuggestions((prev) => {
        const copy = { ...prev };
        delete copy.akunBebanId;
        delete copy.akunBebanLabel;
        return copy;
      });
    }
  };

  const handleExtractNota = async () => {
    if (!file || isExtractingAi || isSubmitting) return;

    setIsExtractingAi(true);
    setAiNotification(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ekstrak-nota", {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        const msg = json?.error || "Nota tidak dapat dibaca otomatis, silakan isi manual.";
        setAiNotification({ type: "error", message: msg });
        return;
      }

      const {
        tanggal,
        jumlah: aiJumlah,
        keperluan,
        nama_toko,
        kode_akun: aiKodeAkun,
        keyakinan,
        pesan_jumlah,
      } = json.data;

      let filledCount = 0;

      // 1. Kolom Tanggal: langsung isi otomatis dengan hasil AI
      if (tanggal) {
        setTanggalTransaksi(tanggal);
        setAiAppliedFields((prev) => ({ ...prev, tanggal: true }));
        filledCount++;
      }

      // 2. Kolom Jumlah: langsung isi otomatis dengan hasil AI jika dalam batas BR-07
      if (aiJumlah && aiJumlah >= 10000 && aiJumlah <= 25000000) {
        setJumlah(String(aiJumlah));
        setAiAppliedFields((prev) => ({ ...prev, jumlah: true }));
        filledCount++;
      }

      // 3. Kolom Keperluan: langsung isi otomatis dengan hasil AI
      if (keperluan) {
        const combinedText = nama_toko ? `${nama_toko} - ${keperluan}` : keperluan;
        setKeterangan(combinedText);
        setAiAppliedFields((prev) => ({ ...prev, keterangan: true }));
        filledCount++;
      }

      // 4. Kolom Akun Beban (Kategori): langsung pilih akun yang direkomendasikan AI
      if (aiKodeAkun) {
        const matchedAccount = expenseAccounts.find(
          (acc) => acc.kode === aiKodeAkun
        );
        if (matchedAccount) {
          setAkunBebanId(matchedAccount.id);
          setAiAppliedFields((prev) => ({ ...prev, akunBeban: true }));
          filledCount++;
        }
      }

      // Kosongkan saran tombol manual karena seluruh data langsung masuk ke formulir
      setAiSuggestions({});

      const warningText = pesan_jumlah ? ` Catatan: ${pesan_jumlah}.` : "";

      if (filledCount === 0) {
        setAiNotification({
          type: "info",
          message: pesan_jumlah
            ? `Nota berhasil dipindai: ${pesan_jumlah}.`
            : "Nota berhasil dipindai, namun data transaksi (tanggal, jumlah, keperluan) tidak ditemukan dengan jelas. Silakan isi secara manual.",
        });
      } else {
        setAiNotification({
          type: "success",
          message: `Ekstraksi AI selesai (Tingkat keyakinan: ${keyakinan}). ${filledCount} kolom berhasil diisi otomatis.${warningText} Silakan periksa kembali sebelum menyimpan.`,
        });
      }
    } catch {
      setAiNotification({
        type: "error",
        message: "Nota tidak dapat dibaca otomatis, silakan isi manual.",
      });
    } finally {
      setIsExtractingAi(false);
    }
  };

  const parsedJumlah = parseInt(jumlah, 10) || 0;

  // Validasi lokal (sebagai kemudahan pengguna, aturan sebenarnya di database)
  const validateForm = (isSending: boolean): string | null => {
    if (!tanggalTransaksi) {
      return "Tanggal transaksi wajib diisi.";
    }
    if (tanggalTransaksi > todayStr) {
      return "Tanggal transaksi tidak boleh di masa depan (BR-07).";
    }
    if (tanggalTransaksi < minDateStr) {
      return "Tanggal transaksi paling lama 30 hari ke belakang dari hari ini (BR-07).";
    }
    if (!akunBebanId) {
      return "Akun beban wajib dipilih (BR-07).";
    }
    if (!parsedJumlah || parsedJumlah < 10000 || parsedJumlah > 25000000) {
      return "Jumlah pengajuan harus bernilai antara Rp 10.000 sampai Rp 25.000.000 (BR-07).";
    }
    if (keterangan.trim().length < 10) {
      return "Keperluan / keterangan pengajuan wajib diisi minimal 10 karakter (BR-07).";
    }
    // Jika mengirim, bukti wajib ada (baru diunggah atau sudah ada sebelumnya)
    if (isSending && !file && !existingBuktiPath) {
      return "Bukti nota/kuitansi wajib diunggah sebelum pengajuan dikirim (BR-07).";
    }
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return "Ukuran file bukti melebihi 5 MB. Harap perkecil ukuran file.";
      }
      const allowed = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowed.includes(file.type)) {
        return "Format file bukti harus berupa JPG, PNG, atau PDF.";
      }
    }
    return null;
  };

  const handleSubmit = async (targetAction: "draf" | "kirim") => {
    if (isSubmitting) return;

    setErrorMessage(null);
    setActionType(targetAction);

    const isSending = targetAction === "kirim";
    const clientErr = validateForm(isSending);
    if (clientErr) {
      setErrorMessage(clientErr);
      return;
    }

    setIsSubmitting(true);

    try {
      let finalBuktiPath = existingBuktiPath;

      // 1. Unggah bukti ke private bucket `bukti_pengajuan` bila ada file baru
      if (file) {
        const lastDot = file.name.lastIndexOf(".");
        const rawBase = lastDot !== -1 ? file.name.substring(0, lastDot) : file.name;
        const ext = lastDot !== -1 ? file.name.substring(lastDot + 1).toLowerCase() : "jpg";

        // Bersihkan nama berkas: huruf kecil, ganti spasi dan karakter khusus dengan tanda hubung
        const cleanBase =
          rawBase
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "bukti";

        // Tetap beri awalan timestamp unik
        const timestamp = Date.now();
        const cleanFileName = `${timestamp}-${cleanBase}.${ext}`;
        // Path wajib diawali auth.uid() sesuai storage RLS policy
        const filePath = `${userId}/${cleanFileName}`;

        const { error: uploadErr } = await supabase.storage
          .from("bukti_pengajuan")
          .upload(filePath, file, {
            contentType: file.type || (ext === "pdf" ? "application/pdf" : "image/jpeg"),
            upsert: false,
          });

        if (uploadErr) {
          throw uploadErr;
        }

        finalBuktiPath = filePath;
      }

      let savedId: number;

      if (mode === "create") {
        // Mode Buat Baru: Simpan draf ke database
        const { data: newRow, error: insertErr } = await supabase
          .from("pengajuan")
          .insert({
            pengaju_id: userId,
            jenis,
            tanggal_transaksi: tanggalTransaksi,
            akun_beban_id: Number(akunBebanId),
            jumlah: parsedJumlah,
            keterangan: keterangan.trim(),
            bukti_path: finalBuktiPath,
            status: "draf", // Selalu draf saat insert (sesuai RLS pengajuan_insert_pemilik)
          })
          .select("id")
          .single();

        if (insertErr || !newRow) {
          throw insertErr;
        }

        savedId = newRow.id;
      } else {
        // Mode Ubah: Update pengajuan saat draf atau perlu_revisi (sesuai RLS pengajuan_update_pemilik)
        if (!initialData) throw new Error("Data pengajuan tidak valid.");

        const { error: updateErr } = await supabase
          .from("pengajuan")
          .update({
            jenis,
            tanggal_transaksi: tanggalTransaksi,
            akun_beban_id: Number(akunBebanId),
            jumlah: parsedJumlah,
            keterangan: keterangan.trim(),
            bukti_path: finalBuktiPath,
          })
          .eq("id", initialData.id);

        if (updateErr) {
          throw updateErr;
        }

        savedId = initialData.id;
      }

      // Jika aksi = "kirim", lakukan transisi status lewat Server Action transisiStatusPengajuanAction
      if (isSending) {
        // Alur peran: Staf -> 'diajukan', Akuntan -> 'menunggu_direktur' (BR-09)
        const targetStatus: StatusPengajuan =
          userRole === "akuntan" ? "menunggu_direktur" : "diajukan";

        const res = await transisiStatusPengajuanAction({
          pengajuanId: savedId,
          targetStatus,
        });

        if (!res.success) {
          throw new Error(res.error || "Gagal mengirim pengajuan.");
        }
      }

      // Sukses: arahkan ke halaman detail pengajuan
      router.push(`/pengajuan/${savedId}`);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto sogan-card p-6 sm:p-8 border-amber-900/30 text-[#fdfaf6]">
      {/* Catatan peninjau jika dalam status perlu revisi */}
      {mode === "edit" && initialData?.catatan_peninjau && (
        <div
          role="region"
          aria-label="Catatan Revisi dari Peninjau"
          className="rounded-xl border border-orange-500/40 bg-orange-950/30 p-5 text-sm sm:text-base text-orange-200"
        >
          <div className="flex items-center gap-2 font-bold text-orange-300">
            <span aria-hidden="true" className="text-base sm:text-lg">↩</span> Catatan Revisi dari Peninjau:
          </div>
          <p className="mt-1.5 text-[#fdfaf6] font-medium leading-relaxed">
            &quot;{initialData.catatan_peninjau}&quot;
          </p>
          <p className="mt-2 text-xs sm:text-sm text-[#a89f91]">
            Harap sesuaikan data pengajuan atau unggah ulang nota bukti sesuai arahan di atas sebelum mengirim ulang.
          </p>
        </div>
      )}

      {/* Alert Error Database / Validasi */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="sogan-card border-rose-500/40 bg-gradient-to-r from-rose-950/30 to-[#0f0d0b] p-5 text-sm sm:text-base text-rose-300"
        >
          <p className="font-bold flex items-center gap-2 text-base">
            <span aria-hidden="true">⚠️</span> Gagal Menyimpan Pengajuan
          </p>
          <p className="mt-1 text-rose-400/90 leading-relaxed">{errorMessage}</p>
        </div>
      )}

      {/* Banner Status Ekstraksi AI */}
      {aiNotification && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-xl border p-5 text-sm sm:text-base ${
            aiNotification.type === "success"
              ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
              : aiNotification.type === "error"
              ? "border-rose-500/40 bg-rose-950/40 text-rose-300"
              : "border-amber-500/40 bg-amber-950/40 text-amber-300"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span aria-hidden="true" className="text-lg leading-none">
                {aiNotification.type === "success"
                  ? "✨"
                  : aiNotification.type === "error"
                  ? "⚠️"
                  : "ℹ️"}
              </span>
              <div>
                <p className="font-bold">
                  {aiNotification.type === "success"
                    ? "Hasil Pembacaan Nota AI"
                    : aiNotification.type === "error"
                    ? "Pemberitahuan Ekstraksi Nota"
                    : "Informasi Ekstraksi Nota"}
                </p>
                <p className="mt-1 leading-relaxed">{aiNotification.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAiNotification(null)}
              className="text-sm font-bold opacity-60 hover:opacity-100 px-1 py-0.5 rounded"
              aria-label="Tutup pemberitahuan"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit("kirim");
        }}
        className="space-y-6"
      >
        {/* Jenis Pengajuan */}
        <fieldset className="space-y-2.5">
          <legend className="text-sm sm:text-base font-bold text-[#fdfaf6]">
            Jenis Pengajuan <span className="text-rose-400">*</span>
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label
              htmlFor="jenis-reimburse"
              className={`flex items-center gap-3.5 p-4 rounded-xl border cursor-pointer transition ${
                jenis === "reimburse"
                  ? "border-amber-500 bg-amber-950/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50"
                  : "border-amber-900/30 bg-[#141210] hover:bg-[#1a1613]"
              }`}
            >
              <input
                id="jenis-reimburse"
                type="radio"
                name="jenis"
                value="reimburse"
                checked={jenis === "reimburse"}
                onChange={() => setJenis("reimburse")}
                className="h-5 w-5 text-amber-500 focus:ring-amber-400 bg-[#0e0c0a] border-amber-900/50"
              />
              <div>
                <span className="block text-sm sm:text-base font-bold text-[#fdfaf6]">
                  Reimburse
                </span>
                <span className="block text-xs sm:text-sm text-[#a89f91] mt-0.5">
                  Penggantian uang pribadi karyawan
                </span>
              </div>
            </label>

            <label
              htmlFor="jenis-pengeluaran"
              className={`flex items-center gap-3.5 p-4 rounded-xl border cursor-pointer transition ${
                jenis === "pengeluaran"
                  ? "border-amber-500 bg-amber-950/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50"
                  : "border-amber-900/30 bg-[#141210] hover:bg-[#1a1613]"
              }`}
            >
              <input
                id="jenis-pengeluaran"
                type="radio"
                name="jenis"
                value="pengeluaran"
                checked={jenis === "pengeluaran"}
                onChange={() => setJenis("pengeluaran")}
                className="h-5 w-5 text-amber-500 focus:ring-amber-400 bg-[#0e0c0a] border-amber-900/50"
              />
              <div>
                <span className="block text-sm sm:text-base font-bold text-[#fdfaf6]">
                  Pengeluaran
                </span>
                <span className="block text-xs sm:text-sm text-[#a89f91] mt-0.5">
                  Biaya langsung operasional UMKM
                </span>
              </div>
            </label>
          </div>
        </fieldset>

        {/* Tanggal Transaksi */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <label
              htmlFor="tanggal_transaksi"
              className="text-sm sm:text-base font-bold text-[#fdfaf6] inline-flex items-center flex-wrap gap-2"
            >
              <span>Tanggal Transaksi</span>
              <span className="text-rose-400">*</span>
              {aiAppliedFields.tanggal && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-500/40">
                  <span aria-hidden="true">✓</span> Diisi AI, periksa dulu
                </span>
              )}
            </label>
            {aiSuggestions.tanggal && (
              <button
                type="button"
                onClick={() => applyAiSuggestion("tanggal")}
                className="text-xs sm:text-sm font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 px-3 py-1 rounded-lg transition shadow-sm"
              >
                Pakai hasil AI: {aiSuggestions.tanggal}
              </button>
            )}
          </div>
          <input
            id="tanggal_transaksi"
            type="date"
            min={minDateStr}
            max={todayStr}
            value={tanggalTransaksi}
            onChange={(e) => {
              setUserTouchedTanggal(true);
              setTanggalTransaksi(e.target.value);
              setAiAppliedFields((prev) => ({ ...prev, tanggal: false }));
            }}
            required
            className="w-full px-4 py-3 text-sm sm:text-base rounded-xl border border-amber-900/40 bg-[#141210] text-[#fdfaf6] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 [color-scheme:dark]"
          />
          <p className="text-xs sm:text-sm text-[#a89f91]">
            Maksimal 30 hari ke belakang ({minDateStr}) dan tidak boleh di masa depan (BR-07).
          </p>
        </div>

        {/* Akun Beban (Hanya Akun Beban Aktif) */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <label
              htmlFor="akun_beban_id"
              className="text-sm sm:text-base font-bold text-[#fdfaf6] inline-flex items-center flex-wrap gap-2"
            >
              <span>Akun Beban</span>
              <span className="text-rose-400">*</span>
              {aiAppliedFields.akunBeban && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-500/40">
                  <span aria-hidden="true">✓</span> Diisi AI, periksa dulu
                </span>
              )}
            </label>
            {aiSuggestions.akunBebanId && (
              <button
                type="button"
                onClick={() => applyAiSuggestion("akunBeban")}
                className="text-xs sm:text-sm font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 px-3 py-1 rounded-lg transition shadow-sm"
              >
                Pakai hasil AI: {aiSuggestions.akunBebanLabel}
              </button>
            )}
          </div>
          <select
            id="akun_beban_id"
            value={akunBebanId}
            onChange={(e) => {
              setUserTouchedAkun(true);
              setAkunBebanId(Number(e.target.value));
              setAiAppliedFields((prev) => ({ ...prev, akunBeban: false }));
            }}
            required
            className="w-full px-4 py-3 text-sm sm:text-base rounded-xl border border-amber-900/40 bg-[#141210] text-[#fdfaf6] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
          >
            {expenseAccounts.length === 0 ? (
              <option value="" className="bg-[#141210] text-[#fdfaf6]">Tidak ada akun beban aktif</option>
            ) : (
              expenseAccounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-[#141210] text-[#fdfaf6]">
                  {acc.kode} — {acc.nama}
                </option>
              ))
            )}
          </select>
          <p className="text-xs sm:text-sm text-[#a89f91]">
            Hanya akun bertipe beban yang berstatus aktif yang dapat dipilih (BR-07).
          </p>
        </div>

        {/* Jumlah Rupiah */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <label
              htmlFor="jumlah"
              className="text-sm sm:text-base font-bold text-[#fdfaf6] inline-flex items-center flex-wrap gap-2"
            >
              <span>Jumlah Pengajuan (Rupiah)</span>
              <span className="text-rose-400">*</span>
              {aiAppliedFields.jumlah && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-500/40">
                  <span aria-hidden="true">✓</span> Diisi AI, periksa dulu
                </span>
              )}
            </label>
            {aiSuggestions.jumlah && (
              <button
                type="button"
                onClick={() => applyAiSuggestion("jumlah")}
                className="text-xs sm:text-sm font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 px-3 py-1 rounded-lg transition shadow-sm"
              >
                Pakai hasil AI: {formatRupiah(aiSuggestions.jumlah)}
              </button>
            )}
          </div>
          <div className="relative">
            <span
              aria-hidden="true"
              className="absolute left-3.5 top-3.5 text-sm sm:text-base font-bold text-amber-400/80"
            >
              Rp
            </span>
            <input
              id="jumlah"
              type="number"
              min={10000}
              max={25000000}
              step={1}
              value={jumlah}
              onChange={(e) => {
                setJumlah(e.target.value);
                setAiAppliedFields((prev) => ({ ...prev, jumlah: false }));
              }}
              placeholder="10000 s/d 25000000"
              required
              className="w-full pl-12 pr-4 py-3 text-base sm:text-lg font-mono font-bold rounded-xl border border-amber-900/40 bg-[#141210] text-amber-300 placeholder-[#78716c] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-[#a89f91]">
              Rentang: Rp 10.000 s/d Rp 25.000.000 (bilangan bulat)
            </span>
            {parsedJumlah > 0 && (
              <span className="font-bold font-mono text-amber-300 text-sm sm:text-base">
                {formatRupiah(parsedJumlah)}
              </span>
            )}
          </div>
        </div>

        {/* Keperluan / Keterangan */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <label
              htmlFor="keterangan"
              className="text-sm sm:text-base font-bold text-[#fdfaf6] inline-flex items-center flex-wrap gap-2"
            >
              <span>Keperluan Pengajuan</span>
              <span className="text-rose-400">*</span>
              {aiAppliedFields.keterangan && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-500/40">
                  <span aria-hidden="true">✓</span> Diisi AI, periksa dulu
                </span>
              )}
            </label>
            {aiSuggestions.keterangan && (
              <button
                type="button"
                onClick={() => applyAiSuggestion("keterangan")}
                className="text-xs sm:text-sm font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 px-3 py-1 rounded-lg transition shadow-sm truncate max-w-xs"
                title={aiSuggestions.keterangan}
              >
                Pakai hasil AI: &quot;{aiSuggestions.keterangan.slice(0, 20)}...&quot;
              </button>
            )}
          </div>
          <textarea
            id="keterangan"
            rows={4}
            value={keterangan}
            onChange={(e) => {
              setKeterangan(e.target.value);
              setAiAppliedFields((prev) => ({ ...prev, keterangan: false }));
            }}
            placeholder="Jelaskan rincian keperluan pengeluaran atau reimburse secara jelas..."
            required
            className="w-full px-4 py-3 text-sm sm:text-base rounded-xl border border-amber-900/40 bg-[#141210] text-[#fdfaf6] placeholder-[#78716c] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 leading-relaxed"
          />
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span
              className={
                keterangan.trim().length >= 10
                  ? "text-emerald-400 font-medium"
                  : "text-rose-400 font-medium"
              }
            >
              Minimal 10 karakter (terisi: {keterangan.trim().length} karakter)
            </span>
          </div>
        </div>

        {/* Upload Bukti Nota / Dokumen */}
        <div className="space-y-2">
          <label
            htmlFor="bukti_file"
            className="block text-sm sm:text-base font-bold text-[#fdfaf6]"
          >
            Unggah Bukti Transaksi (Nota / Kuitansi / Faktur){" "}
            <span className="text-rose-400">*</span>
          </label>

          {existingBuktiPath && !file && (
            <div className="rounded-xl bg-[#141210] border border-amber-900/30 p-3.5 text-sm text-[#a89f91] flex items-center justify-between">
              <span className="truncate max-w-sm">
                📁 Bukti saat ini:{" "}
                <span className="font-mono text-xs sm:text-sm font-bold text-amber-300">
                  {existingBuktiPath.split("/").pop()?.replace(/^\d+-/, "")}
                </span>
              </span>
              <span className="text-emerald-400 font-bold text-xs sm:text-sm">
                ✓ Tersimpan
              </span>
            </div>
          )}

          <input
            id="bukti_file"
            type="file"
            disabled={isSubmitting}
            accept="image/jpeg,image/png,application/pdf"
            onChange={(e) => {
              const selected = e.target.files?.[0] || null;
              setFile(selected);
            }}
            className="block w-full text-sm sm:text-base text-[#a89f91] file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-amber-950/70 file:text-amber-300 hover:file:bg-amber-900/70 cursor-pointer border border-amber-900/40 rounded-xl p-1.5 bg-[#141210] disabled:opacity-50 disabled:pointer-events-none"
          />
          <p className="text-xs sm:text-sm text-[#a89f91]">
            Format yang didukung: JPG, PNG, atau PDF. Ukuran berkas maksimal 5 MB. Bukti disimpan secara privat dan aman di bucket penyimpanan (BR-07).
          </p>

          {/* Tombol Isi Otomatis dari Nota (AI) */}
          {file && (
            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-1.5">
                    <span aria-hidden="true">✨</span> Isi Otomatis dari Nota (AI)
                  </p>
                  <p className="text-xs sm:text-sm text-[#a89f91] mt-0.5">
                    Foto dikirim ke layanan AI Google (tingkat gratis) untuk dibaca. Pembacaan hanya dijalankan saat tombol ditekan.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isExtractingAi || isSubmitting}
                  onClick={handleExtractNota}
                  className="btn-3d-orange px-4 py-2.5 text-xs sm:text-sm font-bold shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {isExtractingAi ? (
                    <>
                      <span
                        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"
                        aria-hidden="true"
                      />
                      Membaca nota...
                    </>
                  ) : (
                    "Isi otomatis dari nota (AI)"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tombol Aksi */}
        <div className="pt-5 border-t border-amber-900/20 flex flex-col-reverse sm:flex-row items-center justify-end gap-3.5">
          <Link
            href="/pengajuan"
            tabIndex={isSubmitting ? -1 : 0}
            className={`btn-3d-dark w-full sm:w-auto px-5 py-2.5 text-sm sm:text-base font-semibold text-center ${
              isSubmitting ? "opacity-50 pointer-events-none cursor-not-allowed" : ""
            }`}
          >
            Batal
          </Link>

          {/* Tombol Simpan Draf */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit("draf")}
            className="btn-3d-dark w-full sm:w-auto px-5 py-2.5 text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            {isSubmitting && actionType === "draf"
              ? "Menyimpan Draf..."
              : "Simpan sebagai Draf"}
          </button>

          {/* Tombol Kirim Pengajuan */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-3d-gold w-full sm:w-auto px-6 py-2.5 text-sm sm:text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            {isSubmitting && actionType === "kirim"
              ? "Mengirim..."
              : mode === "edit"
              ? "Kirim Ulang Pengajuan"
              : "Kirim Pengajuan"}
          </button>
        </div>
      </form>
    </div>
  );
}

