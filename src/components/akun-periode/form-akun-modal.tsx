"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getFriendlyErrorMessage } from "@/lib/utils/errors";
import type { Database, TipeAkun, SaldoNormalAkun } from "@/types/database";

type AkunRow = Database["public"]["Tables"]["akun"]["Row"];

interface FormAkunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  akunToEdit?: AkunRow | null;
}

const TIPE_OPTIONS: { value: TipeAkun; label: string; prefix: string; saldoNormal: SaldoNormalAkun }[] = [
  { value: "aset", label: "1 - Aset", prefix: "1", saldoNormal: "debit" },
  { value: "kewajiban", label: "2 - Kewajiban", prefix: "2", saldoNormal: "kredit" },
  { value: "ekuitas", label: "3 - Ekuitas", prefix: "3", saldoNormal: "kredit" },
  { value: "pendapatan", label: "4 - Pendapatan", prefix: "4", saldoNormal: "kredit" },
  { value: "beban", label: "5 - Beban", prefix: "5", saldoNormal: "debit" },
];

function FormAkunDialog({
  onClose,
  onSuccess,
  akunToEdit,
}: Omit<FormAkunModalProps, "isOpen">) {
  const isEdit = Boolean(akunToEdit);

  const [tipe, setTipe] = useState<TipeAkun>(akunToEdit?.tipe || "aset");
  const [kode, setKode] = useState<string>(akunToEdit?.kode || "1");
  const [nama, setNama] = useState<string>(akunToEdit?.nama || "");
  const [isKasBank, setIsKasBank] = useState<boolean>(akunToEdit?.is_kas_bank || false);
  const [keterangan, setKeterangan] = useState<string>(akunToEdit?.keterangan || "");
  const [aktif, setAktif] = useState<boolean>(akunToEdit ? akunToEdit.aktif : true);

  const [isUsed, setIsUsed] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Periksa apakah akun ini sudah pernah digunakan dalam transaksi jurnal atau pengajuan (BR-01)
  useEffect(() => {
    if (!isEdit || !akunToEdit) return;
    let isMounted = true;

    async function checkAccountUsage() {
      try {
        const supabase = createClient();
        const [jbRes, pbRes, pkRes] = await Promise.all([
          supabase.from("jurnal_baris").select("id").eq("akun_id", akunToEdit!.id).limit(1),
          supabase.from("pengajuan").select("id").eq("akun_beban_id", akunToEdit!.id).limit(1),
          supabase.from("pengajuan").select("id").eq("akun_kas_id", akunToEdit!.id).limit(1),
        ]);

        const used =
          Boolean(jbRes.data && jbRes.data.length > 0) ||
          Boolean(pbRes.data && pbRes.data.length > 0) ||
          Boolean(pkRes.data && pkRes.data.length > 0);

        if (isMounted) {
          setIsUsed(used);
        }
      } catch {
        // Abaikan kegagalan jaringan ringan; trigger database tetap menjadi penjaga utama
      }
    }

    checkAccountUsage();

    return () => {
      isMounted = false;
    };
  }, [isEdit, akunToEdit]);

  // Saldo normal otomatis dihitung dari Tipe (BR-01: Aset & beban debit; lainnya kredit)
  const saldoNormal: SaldoNormalAkun =
    tipe === "aset" || tipe === "beban" ? "debit" : "kredit";

  // Pengetikan kode: digit pertama otomatis menentukan tipe dan saldo normal (BR-01)
  const handleKodeChange = (rawVal: string) => {
    const clean = rawVal.replace(/\D/g, "").slice(0, 4);
    setKode(clean);

    if (clean.length > 0 && !isUsed) {
      const firstDigit = clean[0];
      const matched = TIPE_OPTIONS.find((t) => t.prefix === firstDigit);
      if (matched && matched.value !== tipe) {
        setTipe(matched.value);
        if (matched.value !== "aset") {
          setIsKasBank(false);
        }
      }
    }
  };

  // Perubahan tipe: sesuaikan digit pertama kode bila sedang dalam mode tambah
  const handleTipeChange = (newTipe: TipeAkun) => {
    setTipe(newTipe);
    const selected = TIPE_OPTIONS.find((t) => t.value === newTipe);
    const prefix = selected?.prefix || "1";

    if (!isUsed) {
      if (kode.length <= 1) {
        setKode(prefix);
      } else {
        setKode(prefix + kode.slice(1));
      }
    }

    if (newTipe !== "aset") {
      setIsKasBank(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanKode = kode.trim();
    const cleanNama = nama.trim();

    // 1. Validasi Sisi Klien untuk Kemudahan Pengguna
    if (!/^[1-5][0-9]{3}$/.test(cleanKode)) {
      setErrorMessage("Kode akun harus berupa 4 digit angka dengan digit pertama 1-5 (BR-01).");
      return;
    }

    const expectedPrefix = TIPE_OPTIONS.find((t) => t.value === tipe)?.prefix;
    if (cleanKode[0] !== expectedPrefix) {
      setErrorMessage(
        `Digit pertama kode (${cleanKode[0]}) tidak sesuai dengan tipe ${tipe.toUpperCase()} (harus diawali '${expectedPrefix}'). (BR-01)`
      );
      return;
    }

    if (cleanNama.length < 3) {
      setErrorMessage("Nama akun wajib diisi minimal 3 karakter.");
      return;
    }

    if (isKasBank && tipe !== "aset") {
      setErrorMessage("Penanda Kas/Bank hanya boleh dipilih untuk akun bertipe Aset (BR-01).");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      if (isEdit && akunToEdit) {
        // Mode Ubah: Akuntan mengubah nama, keterangan, penanda kas/bank, dan status aktif
        // Jika akun sudah digunakan, database (trigger trg_protect_used_account) melarang perubahan kode & tipe
        const { error } = await supabase
          .from("akun")
          .update({
            kode: cleanKode,
            nama: cleanNama,
            tipe: tipe,
            saldo_normal: saldoNormal,
            is_kas_bank: tipe === "aset" ? isKasBank : false,
            keterangan: keterangan.trim() || null,
            aktif: aktif,
          })
          .eq("id", akunToEdit.id);

        if (error) throw error;
        onSuccess(`Akun "${cleanKode} - ${cleanNama}" berhasil diperbarui.`);
        onClose();
      } else {
        // Mode Tambah Akun Baru
        const { error } = await supabase.from("akun").insert({
          kode: cleanKode,
          nama: cleanNama,
          tipe: tipe,
          saldo_normal: saldoNormal,
          is_kas_bank: tipe === "aset" ? isKasBank : false,
          keterangan: keterangan.trim() || null,
          aktif: aktif,
        });

        if (error) throw error;
        onSuccess(`Akun baru "${cleanKode} - ${cleanNama}" berhasil ditambahkan.`);
        onClose();
      }
    } catch (err: unknown) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-akun-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all my-8">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 id="form-akun-title" className="text-base font-bold text-slate-900">
              {isEdit ? "Ubah Akun" : "Tambah Akun Baru"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit
                ? "Perbarui informasi akun bagan (COA 4 digit)"
                : "Daftarkan akun baru sesuai aturan klasifikasi BR-01"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Tutup modal"
          >
            ✕
          </button>
        </div>

        {/* Notifikasi Error */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2"
          >
            <span className="font-bold text-rose-600" aria-hidden="true">
              ⚠️
            </span>
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Banner Akun Sudah Terpakai (Proteksi BR-01) */}
        {isEdit && isUsed && (
          <div
            role="note"
            className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2.5"
          >
            <span aria-hidden="true" className="font-bold text-amber-600 text-sm">
              🔒
            </span>
            <div className="flex-1">
              <p className="font-bold">Kode dan Tipe Akun Terkunci (BR-01)</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Akun ini sudah pernah digunakan dalam transaksi jurnal atau pengajuan. Kolom kode dan tipe dinonaktifkan di antarmuka (database tetap yang menjadi pengaman utama dan menolak bila ada perubahan). Anda tetap dapat memperbarui nama, keterangan, penanda kas/bank, dan status aktif akun.
              </p>
            </div>
          </div>
        )}

        {/* Formulir */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Tipe Akun */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="tipe-akun" className="block text-xs font-semibold text-slate-700">
                Tipe Klasifikasi Akun <span className="text-rose-500">*</span>
              </label>
              {isUsed && (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
                  Terkunci (Sudah Digunakan)
                </span>
              )}
            </div>
            <select
              id="tipe-akun"
              value={tipe}
              onChange={(e) => handleTipeChange(e.target.value as TipeAkun)}
              disabled={isSubmitting || isUsed}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
            >
              {TIPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Digit pertama kode wajib sinkron dengan tipe (BR-01).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Kode Akun */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="kode-akun" className="block text-xs font-semibold text-slate-700">
                  Kode Akun (4 Digit) <span className="text-rose-500">*</span>
                </label>
                {isUsed && (
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
                    Terkunci
                  </span>
                )}
              </div>
              <input
                id="kode-akun"
                type="text"
                maxLength={4}
                value={kode}
                onChange={(e) => handleKodeChange(e.target.value)}
                placeholder="Contoh: 1101"
                disabled={isSubmitting || isUsed}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold tracking-wider text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                required
              />
            </div>

            {/* Saldo Normal (Otomatis dari Tipe) */}
            <div>
              <label htmlFor="saldo-normal-display" className="block text-xs font-semibold text-slate-700 mb-1">
                Saldo Normal (Otomatis)
              </label>
              <div
                id="saldo-normal-display"
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 flex items-center justify-between"
              >
                <span className="capitalize">{saldoNormal}</span>
                <span className="text-[10px] text-slate-400 font-normal">Sesuai BR-01</span>
              </div>
            </div>
          </div>

          {/* Nama Akun */}
          <div>
            <label htmlFor="nama-akun" className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Akun <span className="text-rose-500">*</span>
            </label>
            <input
              id="nama-akun"
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Kas Operasional Toko"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
              required
              minLength={3}
            />
            <p className="text-[11px] text-slate-500 mt-1">Minimal 3 karakter.</p>
          </div>

          {/* Penanda Kas/Bank (Khusus Aset) */}
          <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/50">
            <div className="flex items-start gap-2.5">
              <input
                id="is-kas-bank"
                type="checkbox"
                checked={isKasBank}
                onChange={(e) => setIsKasBank(e.target.checked)}
                disabled={isSubmitting || tipe !== "aset"}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-40"
              />
              <div>
                <label
                  htmlFor="is-kas-bank"
                  className={`text-xs font-semibold ${
                    tipe === "aset" ? "text-slate-800" : "text-slate-400"
                  }`}
                >
                  Tandai Sebagai Akun Kas / Bank
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {tipe === "aset"
                    ? "Digunakan untuk menampung kas tunai atau rekening bank pada pembayaran pengajuan (BR-10)."
                    : "Hanya akun bertipe Aset yang diizinkan memiliki penanda Kas/Bank (BR-01)."}
                </p>
              </div>
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label htmlFor="keterangan-akun" className="block text-xs font-semibold text-slate-700 mb-1">
              Keterangan (Opsional)
            </label>
            <textarea
              id="keterangan-akun"
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Peruntukan atau catatan penggunaan akun ini..."
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
            />
          </div>

          {/* Status Aktif */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="status-aktif"
              type="checkbox"
              checked={aktif}
              onChange={(e) => setAktif(e.target.checked)}
              disabled={isSubmitting}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="status-aktif" className="text-xs font-medium text-slate-700">
              Akun Aktif (Dapat dipilih pada pencatatan transaksi jurnal dan pengajuan baru)
            </label>
          </div>

          {/* Aksi Bawah */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Menyimpan...</span>
                </>
              ) : isEdit ? (
                "Simpan Perubahan"
              ) : (
                "Tambah Akun"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FormAkunModal(props: FormAkunModalProps) {
  if (!props.isOpen) return null;
  const key = props.akunToEdit ? `edit-${props.akunToEdit.id}` : "new";
  return <FormAkunDialog key={key} {...props} />;
}
