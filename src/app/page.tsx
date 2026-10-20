import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
          CV Batik Larasati
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Sistem Informasi Finance & Accounting Internal UMKM
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full inline-flex justify-center items-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition"
          >
            Masuk ke Aplikasi
          </Link>
          <Link
            href="/dashboard"
            className="w-full inline-flex justify-center items-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Lihat Kerangka Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
