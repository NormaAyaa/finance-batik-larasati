"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/auth";

function sanitizeRedirectUrl(url: string | null): string {
  if (!url) return "/dashboard";
  // Wajib diawali '/' dan BUKAN '//' atau '/\' serta tidak mengandung skema protokol '://'
  if (
    url.startsWith("/") &&
    !url.startsWith("//") &&
    !url.startsWith("/\\") &&
    !url.includes("://")
  ) {
    return url;
  }
  return "/dashboard";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam === "inactive"
      ? "Akun Anda dinonaktifkan. Sesi telah diakhiri. Silakan hubungi Direktur."
      : null
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();

      // 1. Autentikasi lewat Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError || !authData.user) {
        setErrorMessage(
          "Email atau kata sandi salah. Silakan periksa kembali."
        );
        setLoading(false);
        return;
      }

      // 2. Ambil profil dari tabel profiles
      // Catatan RLS: Akun nonaktif (Yoga) diblokir oleh RLS sehingga mengembalikan 0 baris (null).
      const { data: rawProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id, nama_lengkap, email, peran, jabatan, aktif, dibuat_pada")
        .eq("id", authData.user.id)
        .maybeSingle();

      const profile = rawProfile as Profile | null;

      // Sesuai Revisi 1: Perlakukan profile null SAMA dengan aktif = false
      if (profileError || !profile || !profile.aktif) {
        // Segera sign out dari Supabase
        await supabase.auth.signOut();
        setErrorMessage(
          "Akun Anda dinonaktifkan. Silakan hubungi Direktur."
        );
        setLoading(false);
        return;
      }

      // 3. Login sukses dan akun aktif -> redirect ke target internal yang aman
      const safeTarget = sanitizeRedirectUrl(rawNext);
      router.push(safeTarget);
      router.refresh();
    } catch {
      setErrorMessage(
        "Terjadi kendala saat menghubungkan ke sistem. Coba beberapa saat lagi."
      );
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
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

      <div>
        <label
          htmlFor="email"
          className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90 mb-1.5"
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
          className="w-full rounded-xl bg-black/60 border border-amber-500/30 px-4 py-2.5 text-sm text-amber-100 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/50 transition shadow-inner"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="password"
            className="text-xs font-semibold uppercase tracking-wider text-amber-200/90"
          >
            Kata Sandi
          </label>
          <span className="text-[11px] text-amber-300/80 select-none font-mono">
            Lupa kata sandi? Hubungi Direktur.
          </span>
        </div>
        <div className="relative flex items-center">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl bg-black/60 border border-amber-500/30 px-4 py-2.5 pr-11 text-sm text-amber-100 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/50 transition shadow-inner"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            aria-pressed={showPassword}
            className="absolute right-2.5 p-1.5 text-amber-400/70 hover:text-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg transition"
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
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
                className="w-5 h-5"
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

      <button
        type="submit"
        disabled={loading}
        className="w-full relative flex items-center rounded-full p-1.5 bg-[#0b0f14] border border-[#c5a059] shadow-[0_0_20px_rgba(197,160,89,0.25)] hover:border-[#e5c07b] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 transition-all group"
      >
        {/* Medali Lingkaran Sidik Jari (Kiri) */}
        <span
          className="w-11 h-11 rounded-full border border-[#c5a059] bg-[#12171f] flex items-center justify-center shrink-0 shadow-[inset_0_1px_3px_rgba(0,0,0,0.85)] group-hover:border-[#e5c07b] transition-colors"
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

        {/* Label Tombol di Tengah */}
        <span className="flex-1 text-center font-serif text-xs md:text-sm font-semibold tracking-[0.22em] text-[#d4af37] pr-11 uppercase group-hover:text-[#f3d997] transition-colors">
          {loading ? "Memproses..." : "Masuk ke Sistem"}
        </span>
      </button>

      {/* Navigasi ke Halaman Registrasi */}
      <div className="pt-2 text-center">
        <p className="text-xs text-amber-200/80">
          Belum memiliki akun?{" "}
          <Link
            href="/register"
            className="text-amber-400 font-semibold underline underline-offset-4 hover:text-amber-300 transition-colors"
          >
            Daftar akun baru
          </Link>
        </p>
      </div>
    </form>
  );
}

