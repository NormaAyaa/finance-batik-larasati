import Link from "next/link";
import { MAIN_NAVIGATION } from "@/lib/constants/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar Navigasi Sesuai PRD */}
      <aside className="w-64 border-r border-slate-200 bg-white p-4 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="mb-6 px-3 py-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              CV Batik Larasati
            </h2>
            <p className="text-xs text-slate-500">Finance & Accounting</p>
          </div>

          <nav className="space-y-1">
            {MAIN_NAVIGATION.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <span>{item.title}</span>
                <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  {item.allowedRoles.join(", ")}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-slate-200 pt-4 px-3 text-xs text-slate-500">
          <p className="font-medium text-slate-700">Status Sesi</p>
          <p>Koneksi Supabase Siap</p>
        </div>
      </aside>

      {/* Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-900 md:hidden">
              CV Batik Larasati
            </span>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
              Aplikasi Internal UMKM
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <Link href="/" className="hover:text-slate-900">
              Beranda
            </Link>
            <Link href="/login" className="hover:text-slate-900">
              Keluar
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
