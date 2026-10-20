import { UserRole } from "@/types/database";

export interface NavItem {
  title: string;
  href: string;
  allowedRoles: UserRole[];
  description?: string;
}

export const MAIN_NAVIGATION: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    allowedRoles: ["staf", "akuntan", "direktur"],
    description: "Ringkasan keuangan dan status pengajuan",
  },
  {
    title: "Pengajuan",
    href: "/pengajuan",
    allowedRoles: ["staf", "akuntan", "direktur"],
    description: "Pengajuan reimburse dan pengeluaran operasional",
  },
  {
    title: "Jurnal Umum",
    href: "/jurnal",
    allowedRoles: ["akuntan", "direktur"],
    description: "Pencatatan dan pembalikan jurnal transaksi",
  },
  {
    title: "Buku Besar",
    href: "/buku-besar",
    allowedRoles: ["akuntan", "direktur"],
    description: "Mutasi dan saldo berjalan per akun",
  },
  {
    title: "Laporan Keuangan",
    href: "/laporan",
    allowedRoles: ["akuntan", "direktur"],
    description: "Laba rugi, neraca, dan neraca saldo",
  },
  {
    title: "Akun & Periode",
    href: "/akun-periode",
    allowedRoles: ["akuntan", "direktur"],
    description: "Bagan akun (COA) dan tutup/buka buku periode",
  },
  {
    title: "Pengguna & Audit Log",
    href: "/pengguna-audit",
    allowedRoles: ["direktur"],
    description: "Manajemen peran pengguna dan log audit sistem",
  },
];
