"use client";

import { useState } from "react";
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 border border-red-200 p-3.5 text-xs text-red-800 flex items-start gap-2"
        >
          <span className="font-bold text-red-600 mt-0.5">⚠️</span>
          <span className="flex-1">{errorMessage}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
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
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700 transition"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
        >
          Kata Sandi
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700 transition"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex justify-center items-center rounded-lg bg-amber-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-700 focus:ring-offset-2 disabled:opacity-60 transition shadow-sm"
      >
        {loading ? "Memverifikasi..." : "Masuk ke Sistem"}
      </button>
    </form>
  );
}
