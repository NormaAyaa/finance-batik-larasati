"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PeranPengguna } from "@/types/database";

export function RegisterForm() {
  const router = useRouter();

  const [namaLengkap, setNamaLengkap] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [peran, setPeran] = useState<PeranPengguna>("staf");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGoogleAuth = async () => {
    try {
      setGoogleLoading(true);
      setErrorMessage(null);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setGoogleLoading(false);
      }
    } catch {
      setErrorMessage("Gagal menghubungkan ke autentikasi Google.");
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password !== konfirmasiPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok dengan kata sandi.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Kata sandi minimal 6 karakter.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_lengkap: namaLengkap,
          jabatan,
          peran,
          email,
          password,
          konfirmasi_password: konfirmasiPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Gagal melakukan pendaftaran akun.");
        setLoading(false);
        return;
      }

      setSuccessMessage(
        "Pendaftaran berhasil! Akun Anda telah aktif. Mengalihkan ke halaman masuk..."
      );

      // Arahkan ke halaman login setelah 1.5 detik
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: unknown) {
      console.error("Gagal mengirim registrasi:", err);
      setErrorMessage("Terjadi kendala koneksi ke server. Silakan coba kembali.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tombol Google OAuth */}
      <button
        type="button"
        disabled={loading || googleLoading}
        onClick={handleGoogleAuth}
        className="w-full flex items-center justify-center gap-3 rounded-xl bg-white/10 hover:bg-white/15 border border-amber-500/30 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-100 transition shadow-md hover:border-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
          />
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
          />
          <path
            fill="#FBBC05"
            d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
          />
          <path
            fill="#34A853"
            d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.4 7.5 23 12 23z"
          />
        </svg>
        {googleLoading ? "Menghubungkan ke Google..." : "Daftar dengan Google"}
      </button>

      {/* Pembatas / Divider */}
      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-amber-500/20" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
          <span className="bg-[#120c06] px-3 text-amber-200/50">atau daftar dengan email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
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

        {/* Baris 1: Nama Lengkap & Jabatan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div>
            <label
              htmlFor="jabatan"
              className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90 mb-1"
            >
              Jabatan
            </label>
            <input
              id="jabatan"
              type="text"
              required
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value)}
              placeholder="e.g. Staf Operasional"
              className="w-full rounded-xl bg-black/60 border border-amber-500/30 px-3.5 py-2 text-sm text-amber-100 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/50 transition shadow-inner"
            />
          </div>
        </div>

        {/* Baris 2: Peran Pengguna & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="peran"
              className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90 mb-1"
            >
              Peran Akses
            </label>
            <select
              id="peran"
              value={peran}
              onChange={(e) => setPeran(e.target.value as PeranPengguna)}
              className="w-full rounded-xl bg-black/80 border border-amber-500/30 px-3.5 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/50 transition shadow-inner"
            >
              {(email.toLowerCase().includes("laras") ||
                email.toLowerCase() === "laras@larasati.test" ||
                peran === "direktur") && (
                <option value="direktur" className="bg-[#0b0f14] text-purple-200">
                  Direktur (Khusus Ibu Laras Prameswari)
                </option>
              )}
              <option value="staf" className="bg-[#0b0f14] text-amber-100">
                Staf (Pengajuan &amp; Operasional)
              </option>
              <option value="akuntan" className="bg-[#0b0f14] text-amber-100">
                Akuntan (Jurnal &amp; Keuangan)
              </option>
            </select>
          </div>

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90 mb-1"
          >
            Email Pengguna
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@larasati.test"
            className="w-full rounded-xl bg-black/60 border border-amber-500/30 px-3.5 py-2 text-sm text-amber-100 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/50 transition shadow-inner"
          />
        </div>
      </div>

      {/* Baris 3: Kata Sandi & Konfirmasi Kata Sandi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90 mb-1"
          >
            Kata Sandi
          </label>
          <div className="relative flex items-center">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-black/60 border border-amber-500/30 px-3.5 py-2 pr-10 text-sm text-amber-100 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/50 transition shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              className="absolute right-2 p-1 text-amber-400/70 hover:text-amber-200 focus:outline-none rounded transition"
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="konfirmasi_password"
            className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90 mb-1"
          >
            Konfirmasi Kata Sandi
          </label>
          <input
            id="konfirmasi_password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            value={konfirmasiPassword}
            onChange={(e) => setKonfirmasiPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl bg-black/60 border border-amber-500/30 px-3.5 py-2 text-sm text-amber-100 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/50 transition shadow-inner"
          />
        </div>
      </div>

      {/* Tombol Daftar */}
      <div className="pt-1.5">
        <button
          type="submit"
          disabled={loading}
          className="w-full relative flex items-center rounded-full p-1.5 bg-[#0b0f14] border border-[#c5a059] shadow-[0_0_20px_rgba(197,160,89,0.25)] hover:border-[#e5c07b] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 transition-all group"
        >
          {/* Medali Lingkaran Sidik Jari (Kiri) */}
          <span
            className="w-10 h-10 rounded-full border border-[#c5a059] bg-[#12171f] flex items-center justify-center shrink-0 shadow-[inset_0_1px_3px_rgba(0,0,0,0.85)] group-hover:border-[#e5c07b] transition-colors"
            aria-hidden="true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-[#d4af37] group-hover:text-[#f3d997] transition-colors"
              aria-hidden="true"
            >
              <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
              <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
              <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
              <path d="M2 12a10 10 0 0 1 18-6" />
              <path d="M2 16h.01" />
              <path d="M21.8 16c.2-2 .131-5.354 0-6" />
              <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
              <path d="M8.65 22c.21-.66.45-1.32.57-2" />
              <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
            </svg>
          </span>

          {/* Label Tombol */}
          <span className="flex-1 text-center font-serif text-xs md:text-sm font-semibold tracking-[0.22em] text-[#d4af37] pr-10 uppercase group-hover:text-[#f3d997] transition-colors">
            {loading ? "Mendaftarkan Akun..." : "Daftar ke Sistem"}
          </span>
        </button>
      </div>

      {/* Navigasi ke Halaman Login */}
      <div className="pt-2 text-center">
        <p className="text-xs text-amber-200/80">
          Sudah memiliki akun terdaftar?{" "}
          <Link
            href="/login"
            className="text-amber-400 font-semibold underline underline-offset-4 hover:text-amber-300 transition-colors"
          >
            Masuk ke sistem
          </Link>
        </p>
      </div>
    </form>
  </div>
);
}
