import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk Sistem",
  description: "Masuk ke Sistem Keuangan CV Batik Larasati",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-slate-100">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="mb-6">
          <div className="inline-block px-2.5 py-1 mb-3 rounded text-[11px] font-bold tracking-wider uppercase bg-amber-100 text-amber-900">
            Internal Finance
          </div>
          <h1 className="text-xl font-bold text-slate-900">Masuk Akun</h1>
          <p className="text-xs text-slate-500 mt-1">
            CV Batik Larasati Surakarta
          </p>
        </div>

        <Suspense
          fallback={
            <div className="py-8 text-center text-xs text-slate-400">
              Memuat formulir masuk...
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <p className="text-[11px] text-slate-400">
            Aplikasi internal operasional UMKM. Pendaftaran publik dinonaktifkan.
          </p>
        </div>
      </div>
    </div>
  );
}
