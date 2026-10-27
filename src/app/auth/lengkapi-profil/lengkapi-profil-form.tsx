"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PeranPengguna } from "@/types/database";

interface LengkapiProfilFormProps {
  initialEmail: string;
  initialName: string;
  avatarUrl: string | null;
  nextTarget: string;
}

export function LengkapiProfilForm({
  initialEmail,
  initialName,
  avatarUrl,
  nextTarget,
}: LengkapiProfilFormProps) {
  const router = useRouter();

  const isLaras =
    initialEmail.toLowerCase() === "larasatiyw@gmail.com" ||
    initialEmail.toLowerCase() === "laras@larasati.test" ||
    initialEmail.toLowerCase().includes("laras");

  const [namaLengkap, setNamaLengkap] = useState(
    initialName || (isLaras ? "Laras Prameswari" : "")
  );
  const [jabatan, setJabatan] = useState(
    isLaras ? "Direktur dan Pemilik" : ""
  );
  const [peran, setPeran] = useState<PeranPengguna>(
    isLaras ? "direktur" : "staf"
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (namaLengkap.trim().length < 3) {
      setErrorMessage("Nama lengkap minimal 3 karakter.");
      return;
    }

    if (jabatan.trim().length < 2) {
      setErrorMessage("Jabatan minimal 2 karakter (contoh: Staf Gudang, Akuntan Keuangan).");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/lengkapi-profil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_lengkap: namaLengkap,
          jabatan,
          peran,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Gagal melengkapi profil akun.");
        setLoading(false);
        return;
      }

      setSuccessMessage(
        "Profil berhasil dilengkapi! Selamat datang di CV Batik Larasati. Mengalihkan..."
      );

      setTimeout(() => {
        router.push(nextTarget);
        router.refresh();
      }, 1200);
    } catch (err: unknown) {
      console.error("Gagal melengkapi profil:", err);
      setErrorMessage("Terjadi kendala koneksi ke server. Silakan coba kembali.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Informasi Akun Google Terhubung */}
      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 flex items-center gap-3">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={namaLengkap || "Google Avatar"}
            width={44}
            height={44}
            className="w-11 h-11 rounded-full border border-amber-400/50 object-cover shrink-0"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-600 to-amber-900 border border-amber-400/50 flex items-center justify-center font-bold text-amber-200 text-base shrink-0">
            {initialName ? initialName.charAt(0).toUpperCase() : "G"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white truncate block">
              {initialEmail}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
              Google Terhubung
            </span>
          </div>
          <p className="text-[11px] text-amber-200/70 truncate mt-0.5">
            Akun Google Anda telah diverifikasi.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl bg-red-950/70 border border-red-800/80 p-3 text-xs text-red-200 flex items-start gap-2.5"
        >
          <span className="font-bold text-red-400 mt-0.5" aria-hidden="true">
            ⚠️
          </span>
          <span className="flex-1 leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="rounded-xl bg-emerald-950/70 border border-emerald-800/80 p-3 text-xs text-emerald-200 flex items-start gap-2.5 animate-pulse"
        >
          <span className="font-bold text-emerald-400 mt-0.5" aria-hidden="true">
            ✓
          </span>
          <span className="flex-1 leading-relaxed">{successMessage}</span>
        </div>
      )}

      {/* Nama Lengkap */}
      <div>
        <label
          htmlFor="nama_lengkap"
          className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90 mb-1"
        >
          Nama Lengkap
        </label>
        <input
          id="nama_lengkap"
          type="text"
          required
          value={namaLengkap}
          onChange={(e) => setNamaLengkap(e.target.value)}
          placeholder="e.g. Raden Mas Bagus"
          className="w-full rounded-xl bg-black/60 border border-amber-500/30 px-3.5 py-2 text-sm text-amber-100 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/50 transition shadow-inner"
        />
      </div>

      {/* Jabatan Organisasi */}
      <div>
        <label
          htmlFor="jabatan"
          className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90 mb-1"
        >
          Jabatan di Perusahaan
        </label>
        <input
          id="jabatan"
          type="text"
          required
          value={jabatan}
          onChange={(e) => setJabatan(e.target.value)}
          placeholder="e.g. Staf Gudang / Akuntan Keuangan"
          className="w-full rounded-xl bg-black/60 border border-amber-500/30 px-3.5 py-2 text-sm text-amber-100 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/50 transition shadow-inner"
        />
        <p className="text-[11px] text-amber-200/60 mt-1">
          Tuliskan posisi/jabatan resmi Anda di CV Batik Larasati.
        </p>
      </div>

      {/* Peran Sistem */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90 mb-2">
          Pilih Peran Akses Sistem
        </label>
        <div className={`grid grid-cols-1 ${isLaras ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3`}>
          {/* Opsi Direktur (Khusus Akun Ibu Laras Prameswari) */}
          {isLaras && (
            <button
              type="button"
              onClick={() => setPeran("direktur")}
              className={`p-3 rounded-xl border text-left transition-all ${
                peran === "direktur"
                  ? "bg-purple-950/50 border-purple-400 ring-2 ring-purple-400/50 shadow-lg"
                  : "bg-black/40 border-purple-500/20 hover:border-purple-500/50 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-purple-200">Direktur</span>
                {peran === "direktur" && (
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                )}
              </div>
              <p className="text-[11px] text-purple-200/70 leading-relaxed">
                Persetujuan pengeluaran besar, laporan eksekutif (Laba Rugi &amp; Neraca), dan tutup buku.
              </p>
            </button>
          )}

          {/* Opsi Akuntan */}
          <button
            type="button"
            onClick={() => setPeran("akuntan")}
            className={`p-3 rounded-xl border text-left transition-all ${
              peran === "akuntan"
                ? "bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40 shadow-lg"
                : "bg-black/40 border-amber-500/20 hover:border-amber-500/50 hover:bg-white/5"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-amber-100">Akuntan</span>
              {peran === "akuntan" && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              )}
            </div>
            <p className="text-[11px] text-amber-200/70 leading-relaxed">
              Verifikasi pengajuan, pencatatan jurnal, buku besar, dan laporan keuangan.
            </p>
          </button>

          {/* Opsi Staf */}
          <button
            type="button"
            onClick={() => setPeran("staf")}
            className={`p-3 rounded-xl border text-left transition-all ${
              peran === "staf"
                ? "bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40 shadow-lg"
                : "bg-black/40 border-amber-500/20 hover:border-amber-500/50 hover:bg-white/5"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-amber-100">Staf</span>
              {peran === "staf" && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              )}
            </div>
            <p className="text-[11px] text-amber-200/70 leading-relaxed">
              Pengajuan reimburse, nota bukti pengeluaran, dan operasional lapangan.
            </p>
          </button>
        </div>
        <p className="text-[10px] text-amber-300/60 mt-1.5 font-mono">
          {isLaras
            ? "* Hak akses Direktur aktif khusus untuk akun Ibu Laras Prameswari."
            : "* Hak akses Direktur dikelola langsung secara internal oleh manajemen."}
        </p>
      </div>

      {/* Tombol Simpan */}
      <button
        type="submit"
        disabled={loading}
        className="w-full relative flex items-center rounded-full p-1.5 bg-[#0b0f14] border border-[#c5a059] shadow-[0_0_20px_rgba(197,160,89,0.25)] hover:border-[#e5c07b] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 transition-all group mt-2"
      >
        <span
          className="w-10 h-10 rounded-full border border-[#c5a059] bg-[#12171f] flex items-center justify-center shrink-0 shadow-[inset_0_1px_3px_rgba(0,0,0,0.85)] group-hover:border-[#e5c07b] transition-colors"
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-[#d4af37] group-hover:text-[#f3d997] transition-colors"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <span className="flex-1 text-center font-serif text-xs md:text-sm font-semibold tracking-[0.2em] text-[#d4af37] pr-10 uppercase group-hover:text-[#f3d997] transition-colors">
          {loading ? "Menyimpan Profil..." : "Simpan & Masuk ke Dashboard"}
        </span>
      </button>

      {/* Tombol Batal & Keluar */}
      <div className="pt-1 text-center">
        <Link
          href="/auth/keluar"
          className="text-xs text-amber-200/70 hover:text-red-400 transition-colors inline-flex items-center gap-1.5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-3.5 h-3.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
            />
          </svg>
          Batal & Akhiri Sesi Google
        </Link>
      </div>
    </form>
  );
}
