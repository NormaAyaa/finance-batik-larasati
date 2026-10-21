"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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

      // Jika aksi = "kirim", lakukan transisi status lewat RPC resmi transisi_status_pengajuan
      if (isSending) {
        // Alur peran: Staf -> 'diajukan', Akuntan -> 'menunggu_direktur' (BR-09)
        const targetStatus: StatusPengajuan =
          userRole === "akuntan" ? "menunggu_direktur" : "diajukan";

        const { error: rpcErr } = await supabase.rpc(
          "transisi_status_pengajuan",
          {
            p_pengajuan_id: savedId,
            p_status_baru: targetStatus,
          }
        );

        if (rpcErr) {
          throw rpcErr;
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
    <div className="space-y-6 max-w-2xl bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
      {/* Catatan peninjau jika dalam status perlu revisi */}
      {mode === "edit" && initialData?.catatan_peninjau && (
        <div
          role="region"
          aria-label="Catatan Revisi dari Peninjau"
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900"
        >
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <span aria-hidden="true">↩</span> Catatan Revisi dari Peninjau:
          </div>
          <p className="mt-1 text-slate-800 font-medium">
            &quot;{initialData.catatan_peninjau}&quot;
          </p>
          <p className="mt-1.5 text-[11px] text-amber-700">
            Harap sesuaikan data pengajuan atau unggah ulang nota bukti sesuai arahan di atas sebelum mengirim ulang.
          </p>
        </div>
      )}

      {/* Alert Error Database / Validasi */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-800"
        >
          <p className="font-bold flex items-center gap-1.5">
            <span aria-hidden="true">⚠️</span> Gagal Menyimpan Pengajuan
          </p>
          <p className="mt-1">{errorMessage}</p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit("kirim");
        }}
        className="space-y-5"
      >
        {/* Jenis Pengajuan */}
        <fieldset className="space-y-2">
          <legend className="text-xs font-bold text-slate-900">
            Jenis Pengajuan <span className="text-rose-600">*</span>
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <label
              htmlFor="jenis-reimburse"
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                jenis === "reimburse"
                  ? "border-amber-700 bg-amber-50/50 ring-1 ring-amber-700"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                id="jenis-reimburse"
                type="radio"
                name="jenis"
                value="reimburse"
                checked={jenis === "reimburse"}
                onChange={() => setJenis("reimburse")}
                className="h-4 w-4 text-amber-700 focus:ring-amber-500 border-slate-300"
              />
              <div>
                <span className="block text-xs font-bold text-slate-900">
                  Reimburse
                </span>
                <span className="block text-[11px] text-slate-500">
                  Penggantian uang pribadi
                </span>
              </div>
            </label>

            <label
              htmlFor="jenis-pengeluaran"
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                jenis === "pengeluaran"
                  ? "border-amber-700 bg-amber-50/50 ring-1 ring-amber-700"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                id="jenis-pengeluaran"
                type="radio"
                name="jenis"
                value="pengeluaran"
                checked={jenis === "pengeluaran"}
                onChange={() => setJenis("pengeluaran")}
                className="h-4 w-4 text-amber-700 focus:ring-amber-500 border-slate-300"
              />
              <div>
                <span className="block text-xs font-bold text-slate-900">
                  Pengeluaran
                </span>
                <span className="block text-[11px] text-slate-500">
                  Biaya langsung UMKM
                </span>
              </div>
            </label>
          </div>
        </fieldset>

        {/* Tanggal Transaksi */}
        <div className="space-y-1.5">
          <label
            htmlFor="tanggal_transaksi"
            className="block text-xs font-bold text-slate-900"
          >
            Tanggal Transaksi <span className="text-rose-600">*</span>
          </label>
          <input
            id="tanggal_transaksi"
            type="date"
            min={minDateStr}
            max={todayStr}
            value={tanggalTransaksi}
            onChange={(e) => setTanggalTransaksi(e.target.value)}
            required
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
          <p className="text-[11px] text-slate-500">
            Maksimal 30 hari ke belakang ({minDateStr}) dan tidak boleh di masa depan (BR-07).
          </p>
        </div>

        {/* Akun Beban (Hanya Akun Beban Aktif) */}
        <div className="space-y-1.5">
          <label
            htmlFor="akun_beban_id"
            className="block text-xs font-bold text-slate-900"
          >
            Akun Beban <span className="text-rose-600">*</span>
          </label>
          <select
            id="akun_beban_id"
            value={akunBebanId}
            onChange={(e) => setAkunBebanId(Number(e.target.value))}
            required
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            {expenseAccounts.length === 0 ? (
              <option value="">Tidak ada akun beban aktif</option>
            ) : (
              expenseAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.kode} — {acc.nama}
                </option>
              ))
            )}
          </select>
          <p className="text-[11px] text-slate-500">
            Hanya akun bertipe beban yang berstatus aktif yang dapat dipilih (BR-07).
          </p>
        </div>

        {/* Jumlah Rupiah */}
        <div className="space-y-1.5">
          <label
            htmlFor="jumlah"
            className="block text-xs font-bold text-slate-900"
          >
            Jumlah Pengajuan (Rupiah) <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <span
              aria-hidden="true"
              className="absolute left-3 top-2.5 text-xs font-bold text-slate-500"
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
              onChange={(e) => setJumlah(e.target.value)}
              placeholder="10000 s/d 25000000"
              required
              className="w-full pl-10 pr-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">
              Rentang: Rp 10.000 s/d Rp 25.000.000 (bilangan bulat rupiah)
            </span>
            {parsedJumlah > 0 && (
              <span className="font-bold text-amber-800">
                {formatRupiah(parsedJumlah)}
              </span>
            )}
          </div>
        </div>

        {/* Keperluan / Keterangan */}
        <div className="space-y-1.5">
          <label
            htmlFor="keterangan"
            className="block text-xs font-bold text-slate-900"
          >
            Keperluan Pengajuan <span className="text-rose-600">*</span>
          </label>
          <textarea
            id="keterangan"
            rows={3}
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Jelaskan rincian keperluan pengeluaran atau reimburse secara jelas..."
            required
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
          <div className="flex items-center justify-between text-[11px]">
            <span
              className={
                keterangan.trim().length >= 10
                  ? "text-emerald-700 font-medium"
                  : "text-rose-600"
              }
            >
              Minimal 10 karakter (terisi: {keterangan.trim().length} karakter)
            </span>
          </div>
        </div>

        {/* Upload Bukti Nota / Dokumen */}
        <div className="space-y-1.5">
          <label
            htmlFor="bukti_file"
            className="block text-xs font-bold text-slate-900"
          >
            Unggah Bukti Transaksi (Nota / Kuitansi / Faktur){" "}
            <span className="text-rose-600">*</span>
          </label>

          {existingBuktiPath && !file && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 flex items-center justify-between">
              <span className="truncate max-w-sm">
                📁 Bukti saat ini:{" "}
                <span className="font-mono text-[11px] font-semibold text-slate-900">
                  {existingBuktiPath.split("/").pop()?.replace(/^\d+-/, "")}
                </span>
              </span>
              <span className="text-emerald-700 font-semibold text-[11px]">
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
            className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer border border-slate-300 rounded-lg p-1 bg-white disabled:opacity-50 disabled:pointer-events-none"
          />
          <p className="text-[11px] text-slate-500">
            Format yang didukung: JPG, PNG, atau PDF. Ukuran berkas maksimal 5 MB. Bukti disimpan secara privat dan aman di bucket penyimpanan (BR-07).
          </p>
        </div>

        {/* Tombol Aksi */}
        <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <Link
            href="/pengajuan"
            tabIndex={isSubmitting ? -1 : 0}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 text-center transition ${
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
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-400 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none transition"
          >
            {isSubmitting && actionType === "draf"
              ? "Menyimpan Draf..."
              : "Simpan sebagai Draf"}
          </button>

          {/* Tombol Kirim Pengajuan */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2 rounded-lg bg-amber-800 hover:bg-amber-900 text-xs font-bold text-white shadow focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none transition"
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
