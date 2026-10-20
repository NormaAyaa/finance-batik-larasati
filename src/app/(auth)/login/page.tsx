import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Masuk Akun</h1>
        <p className="text-sm text-slate-500 mb-6">
          CV Batik Larasati - Internal Finance
        </p>

        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800">
          Kerangka Halaman Masuk. Logika autentikasi dan formulir login Supabase belum diimplementasikan.
        </div>
      </div>
    </div>
  );
}
