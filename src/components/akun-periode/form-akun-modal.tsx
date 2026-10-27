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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="sogan-card relative w-full max-w-lg rounded-2xl bg-[#0e0c0a] border border-amber-500/25 p-6 sm:p-7 shadow-2xl transition-all my-8 text-[#fdfaf6]">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-amber-900/20 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <h2 id="form-akun-title" className="text-base sm:text-lg font-bold text-[#fdfaf6] tracking-tight">
                {isEdit ? "Ubah Akun" : "Tambah Akun Baru"}
              </h2>
            </div>
            <p className="text-xs text-[#a89f91] mt-0.5">
              {isEdit
                ? "Perbarui informasi akun bagan (COA 4 digit)"
                : "Daftarkan akun baru sesuai aturan klasifikasi BR-01"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl p-2 text-[#a89f91] hover:bg-amber-950/40 hover:text-[#fdfaf6] border border-transparent hover:border-amber-900/40 transition disabled:opacity-50"
            aria-label="Tutup modal"
          >
            ✕
          </button>
        </div>

        {/* Notifikasi Error */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-4 rounded-xl bg-rose-950/40 border border-rose-500/30 p-3.5 text-xs text-rose-300 flex items-start gap-2.5"
          >
            <span className="font-bold text-rose-400" aria-hidden="true">
              ⚠️
            </span>
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Banner Akun Sudah Terpakai (Proteksi BR-01) */}
        {isEdit && isUsed && (
          <div
            role="note"
            className="mt-4 rounded-xl bg-amber-950/20 border border-amber-500/20 p-4 text-xs text-amber-200/90 flex items-start gap-3"
          >
            <span aria-hidden="true" className="font-bold text-amber-400 text-sm">
              🔒
            </span>
            <div className="flex-1">
              <p className="font-bold text-[#fdfaf6]">Kode dan Tipe Akun Terkunci (BR-01)</p>
              <p className="text-[11px] text-[#d6cfc7] mt-1 leading-relaxed">
                Akun ini sudah pernah digunakan dalam transaksi jurnal atau pengajuan. Kolom kode dan tipe dinonaktifkan di antarmuka (database tetap yang menjadi pengaman utama dan menolak bila ada perubahan). Anda tetap dapat memperbarui nama, keterangan, penanda kas/bank, dan status aktif akun.
              </p>
            </div>
          </div>
        )}

        {/* Formulir */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Tipe Akun */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="tipe-akun" className="block text-xs font-bold text-[#fdfaf6] uppercase tracking-wider">
                Tipe Klasifikasi Akun <span className="text-amber-400">*</span>
              </label>
              {isUsed && (
                <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Terkunci (Sudah Digunakan)
                </span>
              )}
            </div>
            <select
              id="tipe-akun"
              value={tipe}
              onChange={(e) => handleTipeChange(e.target.value as TipeAkun)}
              disabled={isSubmitting || isUsed}
              className="w-full rounded-xl border border-amber-900/30 bg-[#141210] px-3.5 py-2.5 text-xs sm:text-sm text-[#fdfaf6] focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition disabled:bg-[#070605] disabled:text-[#a89f91]"
            >
              {TIPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#141210] text-[#fdfaf6]">
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#a89f91] mt-1">
              Digit pertama kode wajib sinkron dengan tipe (BR-01).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Kode Akun */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="kode-akun" className="block text-xs font-bold text-[#fdfaf6] uppercase tracking-wider">
                  Kode Akun (4 Digit) <span className="text-amber-400">*</span>
                </label>
                {isUsed && (
                  <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
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
                className="w-full rounded-xl border border-amber-900/30 bg-[#141210] px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold tracking-wider text-amber-300 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition disabled:bg-[#070605] disabled:text-[#a89f91]"
                required
              />
            </div>

            {/* Saldo Normal (Otomatis dari Tipe) */}
            <div>
              <label htmlFor="saldo-normal-display" className="block text-xs font-bold text-[#fdfaf6] uppercase tracking-wider mb-1.5">
                Saldo Normal (Otomatis)
              </label>
              <div
                id="saldo-normal-display"
                className="rounded-xl border border-amber-900/30 bg-[#141210] px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#fdfaf6] flex items-center justify-between"
              >
                <span className="capitalize text-amber-300">{saldoNormal}</span>
                <span className="text-[10px] text-[#a89f91] font-normal">Sesuai BR-01</span>
              </div>
            </div>
          </div>

          {/* Nama Akun */}
          <div>
            <label htmlFor="nama-akun" className="block text-xs font-bold text-[#fdfaf6] uppercase tracking-wider mb-1.5">
              Nama Akun <span className="text-amber-400">*</span>
            </label>
            <input
              id="nama-akun"
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Kas Operasional Toko"
              disabled={isSubmitting}
              className="w-full rounded-xl border border-amber-900/30 bg-[#141210] px-3.5 py-2.5 text-xs sm:text-sm text-[#fdfaf6] placeholder-[#5c554b] focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition disabled:bg-[#070605]"
              required
              minLength={3}
            />
            <p className="text-[11px] text-[#a89f91] mt-1">Minimal 3 karakter.</p>
          </div>

          {/* Penanda Kas/Bank (Khusus Aset) */}
          <div className="rounded-xl border border-amber-900/25 p-4 bg-[#141210]/60">
            <div className="flex items-start gap-3">
              <input
                id="is-kas-bank"
                type="checkbox"
                checked={isKasBank}
                onChange={(e) => setIsKasBank(e.target.checked)}
                disabled={isSubmitting || tipe !== "aset"}
                className="mt-1 h-4 w-4 rounded border-amber-900/40 bg-[#141210] text-amber-500 focus:ring-amber-500/40 disabled:opacity-40"
              />
              <div>
                <label
                  htmlFor="is-kas-bank"
                  className={`text-xs sm:text-sm font-bold ${
                    tipe === "aset" ? "text-[#fdfaf6]" : "text-[#5c554b]"
                  }`}
                >
                  Tandai Sebagai Akun Kas / Bank
                </label>
                <p className="text-[11px] text-[#a89f91] mt-0.5">
                  {tipe === "aset"
                    ? "Digunakan untuk menampung kas tunai atau rekening bank pada pembayaran pengajuan (BR-10)."
                    : "Hanya akun bertipe Aset yang diizinkan memiliki penanda Kas/Bank (BR-01)."}
                </p>
              </div>
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label htmlFor="keterangan-akun" className="block text-xs font-bold text-[#fdfaf6] uppercase tracking-wider mb-1.5">
              Keterangan (Opsional)
            </label>
            <textarea
              id="keterangan-akun"
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Peruntukan atau catatan penggunaan akun ini..."
              disabled={isSubmitting}
              className="w-full rounded-xl border border-amber-900/30 bg-[#141210] p-3 text-xs sm:text-sm text-[#fdfaf6] placeholder-[#5c554b] focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition disabled:bg-[#070605]"
            />
          </div>

          {/* Status Aktif */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              id="status-aktif"
              type="checkbox"
              checked={aktif}
              onChange={(e) => setAktif(e.target.checked)}
              disabled={isSubmitting}
              className="h-4 w-4 rounded border-amber-900/40 bg-[#141210] text-amber-500 focus:ring-amber-500/40"
            />
            <label htmlFor="status-aktif" className="text-xs sm:text-sm font-semibold text-[#d6cfc7]">
              Akun Aktif (Dapat dipilih pada pencatatan transaksi jurnal dan pengajuan baru)
            </label>
          </div>

          {/* Aksi Bawah */}
          <div className="flex items-center justify-end gap-3 border-t border-amber-900/20 pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-amber-900/30 bg-[#141210] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#d6cfc7] hover:bg-amber-950/40 hover:text-[#fdfaf6] transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-[#070605] shadow-lg shadow-amber-950/40 transition disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#070605] border-t-transparent" />
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
