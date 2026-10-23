import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatBulanTahun } from "@/lib/utils/formatters";
import { KartuRingkasan } from "@/components/dashboard/kartu-ringkasan";
import {
  GrafikBatang,
  type MonthlyFinancialData,
} from "@/components/dashboard/grafik-batang";
import {
  TabelPengajuanMenunggu,
  type PengajuanMenungguItem,
} from "@/components/dashboard/tabel-pengajuan-menunggu";
import {
  StatusPeriodeCard,
  type PeriodeStatusItem,
} from "@/components/dashboard/status-periode-card";
import {
  DashboardStaf,
  type StafRecentSubmission,
} from "@/components/dashboard/dashboard-staf";
import type { StatusPengajuan } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard - CV Batik Larasati",
  description: "Ringkasan posisi keuangan, mutasi kas/bank, dan antrean pengajuan CV Batik Larasati",
};

/**
 * Mendapatkan informasi tanggal hari ini dalam zona waktu WIB (Asia/Jakarta)
 */
function getWIBDateInfo() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA menghasilkan format YYYY-MM-DD
  const todayWIB = formatter.format(new Date());
  const [yearStr, monthStr] = todayWIB.split("-");
  const currentYear = parseInt(yearStr, 10);
  const currentMonth = parseInt(monthStr, 10);
  const startOfMonthWIB = `${yearStr}-${monthStr}-01`;

  return {
    todayWIB,
    currentYear,
    currentMonth,
    startOfMonthWIB,
    namaBulanTahun: formatBulanTahun(currentYear, currentMonth),
  };
}

export default async function DashboardPage() {
  // 1. Guard autentikasi (semua peran boleh masuk: staf, akuntan, direktur)
  const { profile } = await requireAuth(["staf", "akuntan", "direktur"]);
  const supabase = await createClient();

  // ============================================================================
  // TAMPILAN KHUSUS STAF (Sesuai Butir 6 & BR-11: Data Keuangan Rahasia)
  // ============================================================================
  if (profile.peran === "staf") {
    // Staf HANYA membaca pengajuan miliknya sendiri.
    // Dilarang memanggil fungsi laporan keuangan atau membaca tabel akun/jurnal.
    const [allSubmissionsRes, recentSubmissionsRes] = await Promise.all([
      supabase
        .from("pengajuan")
        .select("id, status")
        .eq("pengaju_id", profile.id),
      supabase
        .from("pengajuan")
        .select("id, nomor, tanggal_transaksi, jenis, jumlah, status, keterangan")
        .eq("pengaju_id", profile.id)
        .order("id", { ascending: false })
        .limit(10),
    ]);

    if (allSubmissionsRes.error || recentSubmissionsRes.error) {
      console.error(
        "Gagal memuat pengajuan staf:",
        allSubmissionsRes.error || recentSubmissionsRes.error
      );
      throw new Error("Terjadi kendala saat memuat data pengajuan Anda. Silakan coba kembali.");
    }

    const statusCounts: Record<StatusPengajuan, number> = {
      draf: 0,
      diajukan: 0,
      perlu_revisi: 0,
      menunggu_direktur: 0,
      disetujui: 0,
      ditolak: 0,
      dibayar: 0,
      dibatalkan: 0,
    };

    const allItems = allSubmissionsRes.data || [];
    for (const item of allItems) {
      const st = item.status as StatusPengajuan;
      if (statusCounts[st] !== undefined) {
        statusCounts[st] += 1;
      }
    }

    const recentItems: StafRecentSubmission[] = (recentSubmissionsRes.data || []).map((row) => ({
      id: row.id,
      nomor: row.nomor || "-",
      tanggal_transaksi: row.tanggal_transaksi,
      jenis: row.jenis,
      jumlah: Number(row.jumlah) || 0,
      status: row.status as StatusPengajuan,
      keterangan: row.keterangan || "",
    }));

    return (
      <DashboardStaf
        namaLengkap={profile.nama_lengkap}
        jabatan={profile.jabatan}
        statusCounts={statusCounts}
        recentItems={recentItems}
        totalSubmissions={allItems.length}
      />
    );
  }

  // ============================================================================
  // TAMPILAN KHUSUS AKUNTAN DAN DIREKTUR (Sesuai Butir 1 sampai 5)
  // ============================================================================
  const { todayWIB, startOfMonthWIB, namaBulanTahun } = getWIBDateInfo();

  // Status pengajuan yang menunggu tindakan per peran:
  // - Akuntan: diajukan (menunggu verifikasi) + disetujui (menunggu pembayaran)
  // - Direktur: menunggu_direktur (menunggu persetujuan)
  const targetStatuses: StatusPengajuan[] =
    profile.peran === "akuntan"
      ? ["diajukan", "disetujui"]
      : ["menunggu_direktur"];

  // Batch Paralel 1: Permintaan data primer yang tidak saling bergantung
  const [
    kasBankAccountsRes,
    saldoTodayRes,
    mutasiMonthRes,
    periodesRes,
    pendingItemsRes,
    pendingCountRes,
    akuntanDiajukanCountRes,
    akuntanDisetujuiCountRes,
  ] = await Promise.all([
    supabase
      .from("akun")
      .select("id, kode, nama, is_kas_bank")
      .eq("is_kas_bank", true),
    supabase.rpc("saldo_akun_per_tanggal", { p_sampai: todayWIB }),
    supabase.rpc("mutasi_akun_rentang", {
      p_dari: startOfMonthWIB,
      p_sampai: todayWIB,
    }),
    supabase
      .from("periode")
      .select("id, tahun, bulan, status, tanggal_mulai")
      .order("tahun", { ascending: false })
      .order("bulan", { ascending: false }),
    supabase
      .from("pengajuan")
      .select(`
        id,
        nomor,
        jenis,
        tanggal_transaksi,
        jumlah,
        status,
        pengaju:profiles!pengaju_id (
          id,
          nama_lengkap,
          email,
          peran
        )
      `)
      .in("status", targetStatuses)
      .order("id", { ascending: false })
      .limit(10),
    supabase
      .from("pengajuan")
      .select("id", { count: "exact", head: true })
      .in("status", targetStatuses),
    profile.peran === "akuntan"
      ? supabase
          .from("pengajuan")
          .select("id", { count: "exact", head: true })
          .eq("status", "diajukan")
      : Promise.resolve({ count: 0, error: null }),
    profile.peran === "akuntan"
      ? supabase
          .from("pengajuan")
          .select("id", { count: "exact", head: true })
          .eq("status", "disetujui")
      : Promise.resolve({ count: 0, error: null }),
  ]);

  // Validasi error tanpa mengekspos error mentah Postgres
  if (
    kasBankAccountsRes.error ||
    saldoTodayRes.error ||
    mutasiMonthRes.error ||
    periodesRes.error ||
    pendingItemsRes.error
  ) {
    console.error("Gagal memuat batch 1 dashboard:", {
      kb: kasBankAccountsRes.error,
      saldo: saldoTodayRes.error,
      mutasi: mutasiMonthRes.error,
      periode: periodesRes.error,
      pending: pendingItemsRes.error,
    });
    throw new Error("Terjadi kendala saat memuat data ringkasan keuangan. Silakan muat ulang.");
  }

  const periodesList = periodesRes.data || [];

  // Batch Paralel 2: Hitung jurnal draf per periode (head: true) & mutasi 6 bulan untuk grafik
  // 1. Hitung jumlah draf per periode secara paralel tanpa mengambil baris
  const draftCountsPromises = periodesList.map((p) =>
    supabase
      .from("jurnal")
      .select("id", { count: "exact", head: true })
      .eq("periode_id", p.id)
      .eq("status", "draf")
  );

  // 2. Ambil data mutasi untuk paling banyak 6 periode terakhir yang punya periode
  const sixPeriods = periodesList.slice(0, 6).reverse(); // urutan kronologis menaik
  const chartPromises = sixPeriods.map((p) => {
    const y = p.tahun;
    const m = String(p.bulan).padStart(2, "0");
    const startDate = `${y}-${m}-01`;
    const lastDay = new Date(y, p.bulan, 0).getDate();
    const endDate = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
    return supabase.rpc("mutasi_akun_rentang", {
      p_dari: startDate,
      p_sampai: endDate,
    });
  });

  const [draftCountsRes, chartDataRes] = await Promise.all([
    Promise.all(draftCountsPromises),
    Promise.all(chartPromises),
  ]);

  // Susun data status periode
  const periodeCards: PeriodeStatusItem[] = periodesList.map((p, idx) => ({
    id: p.id,
    tahun: p.tahun,
    bulan: p.bulan,
    status: p.status as "terbuka" | "ditutup",
    jumlahDraf: draftCountsRes[idx]?.count ?? 0,
    tanggal_mulai: p.tanggal_mulai,
  }));

  // Susun data grafik batang (6 bulan terakhir)
  const chartData: MonthlyFinancialData[] = sixPeriods.map((p, idx) => {
    const rows = chartDataRes[idx]?.data || [];
    let pend = 0;
    let beb = 0;
    for (const r of rows) {
      const d = Number(r.total_debit) || 0;
      const k = Number(r.total_kredit) || 0;
      if (r.tipe === "pendapatan") {
        pend += (k - d);
      } else if (r.tipe === "beban") {
        beb += (d - k);
      }
    }
    return {
      periodeLabel: formatBulanTahun(p.tahun, p.bulan),
      pendapatan: pend,
      beban: beb,
      labaRugi: pend - beb,
    };
  });

  // Hitung Kartu Ringkasan Keuangan:
  // 1. Total Saldo Kas & Bank per hari ini
  const kasBankIds = new Set((kasBankAccountsRes.data || []).map((a) => a.id));
  let totalKasBank = 0;
  for (const r of saldoTodayRes.data || []) {
    if (kasBankIds.has(r.akun_id)) {
      const d = Number(r.total_debit) || 0;
      const k = Number(r.total_kredit) || 0;
      // Akun kas dan bank bertipe aset (saldo normal debit: debit - kredit)
      totalKasBank += (d - k);
    }
  }

  // 2. Pendapatan & Beban bulan berjalan (WIB)
  let pendapatanBulanIni = 0;
  let bebanBulanIni = 0;
  for (const r of mutasiMonthRes.data || []) {
    const d = Number(r.total_debit) || 0;
    const k = Number(r.total_kredit) || 0;
    if (r.tipe === "pendapatan") {
      pendapatanBulanIni += (k - d);
    } else if (r.tipe === "beban") {
      bebanBulanIni += (d - k);
    }
  }
  const labaBulanIni = pendapatanBulanIni - bebanBulanIni;

  // 3. Pengajuan menunggu
  const totalMenunggu = pendingCountRes.count ?? 0;
  const pendingItems: PengajuanMenungguItem[] = (pendingItemsRes.data || []).map((row) => ({
    id: row.id,
    nomor: row.nomor || "-",
    pengaju: row.pengaju as unknown as PengajuanMenungguItem["pengaju"],
    tanggal_transaksi: row.tanggal_transaksi,
    jumlah: Number(row.jumlah) || 0,
    status: row.status as StatusPengajuan,
    jenis: row.jenis,
  }));

  const detailAkuntan =
    profile.peran === "akuntan"
      ? {
          diajukan: akuntanDiajukanCountRes.count ?? 0,
          disetujui: akuntanDisetujuiCountRes.count ?? 0,
        }
      : undefined;

  return (
    <div className="space-y-6">
      {/* 1. Header Dashboard Keuangan */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard Keuangan</h1>
        <p className="text-xs text-slate-500 mt-1">
          Selamat datang, <span className="font-semibold text-slate-700">{profile.nama_lengkap}</span> (
          {profile.jabatan}). Ringkasan posisi kas & bank, hasil usaha bulan berjalan, serta antrean pengajuan tertunda.
        </p>
      </div>

      {/* 2. Kartu Ringkasan (5 Kartu Utama) */}
      <KartuRingkasan
        totalKasBank={totalKasBank}
        pendapatanBulanIni={pendapatanBulanIni}
        bebanBulanIni={bebanBulanIni}
        labaBulanIni={labaBulanIni}
        jumlahPengajuanMenunggu={totalMenunggu}
        peran={profile.peran}
        detailAkuntan={detailAkuntan}
        namaBulan={namaBulanTahun}
      />

      {/* 3. Grafik Batang Pendapatan & Beban (Paling banyak 6 bulan terakhir) */}
      <GrafikBatang data={chartData} />

      {/* 4. Bagian Bawah: Tabel Pengajuan Menunggu (Kiri) & Status Periode (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TabelPengajuanMenunggu
            items={pendingItems}
            totalMenunggu={totalMenunggu}
            peran={profile.peran}
          />
        </div>
        <div className="lg:col-span-1">
          <StatusPeriodeCard periodes={periodeCards} />
        </div>
      </div>
    </div>
  );
}
