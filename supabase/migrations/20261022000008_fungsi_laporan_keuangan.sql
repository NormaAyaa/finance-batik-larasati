-- ==============================================================================
-- Migration: 20261022000008_fungsi_laporan_keuangan.sql
-- Proyek: Finance & Accounting UMKM (CV Batik Larasati)
-- Deskripsi: Fungsi baca-saja kalkulasi saldo dan mutasi untuk Laporan Keuangan
--            (Laba Rugi, Neraca, Neraca Saldo) sesuai PRD Bagian 7, 9, dan BR-11.
--            Kalkulasi dilakukan di database untuk mencegah batasan 1.000 baris.
-- Sifat: STABLE, SECURITY INVOKER, SET search_path, tanpa hak eksekusi untuk anon.
-- ==============================================================================

-- 1. FUNGSI SALDO AKUN PER TANGGAL (Kumulatif sejak awal data s.d. p_sampai)
-- Digunakan untuk Neraca dan Neraca Saldo.
CREATE OR REPLACE FUNCTION saldo_akun_per_tanggal(p_sampai date)
RETURNS TABLE (
    akun_id BIGINT,
    kode TEXT,
    nama TEXT,
    tipe tipe_akun,
    saldo_normal TEXT,
    total_debit BIGINT,
    total_kredit BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
    SELECT
        a.id AS akun_id,
        a.kode,
        a.nama,
        a.tipe,
        a.saldo_normal,
        COALESCE(SUM(jb.debit), 0)::BIGINT AS total_debit,
        COALESCE(SUM(jb.kredit), 0)::BIGINT AS total_kredit
    FROM akun a
    LEFT JOIN (
        SELECT jb_inner.akun_id, jb_inner.debit, jb_inner.kredit
        FROM jurnal_baris jb_inner
        JOIN jurnal j ON j.id = jb_inner.jurnal_id
        WHERE j.status IN ('diposting', 'dibalik')
          AND j.tanggal <= p_sampai
    ) jb ON jb.akun_id = a.id
    WHERE auth_is_aktif() AND auth_peran() IN ('akuntan', 'direktur')
      AND (a.aktif = true OR EXISTS (
          SELECT 1 FROM jurnal_baris jb_hist
          JOIN jurnal j_hist ON j_hist.id = jb_hist.jurnal_id
          WHERE jb_hist.akun_id = a.id AND j_hist.status IN ('diposting', 'dibalik')
      ))
    GROUP BY a.id, a.kode, a.nama, a.tipe, a.saldo_normal
    ORDER BY a.kode ASC;
$$;

-- 2. FUNGSI MUTASI AKUN RENTANG (Dalam rentang p_dari s.d. p_sampai)
-- Digunakan untuk Laporan Laba Rugi periode atau rentang tanggal tertentu.
CREATE OR REPLACE FUNCTION mutasi_akun_rentang(p_dari date, p_sampai date)
RETURNS TABLE (
    akun_id BIGINT,
    kode TEXT,
    nama TEXT,
    tipe tipe_akun,
    saldo_normal TEXT,
    total_debit BIGINT,
    total_kredit BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
    SELECT
        a.id AS akun_id,
        a.kode,
        a.nama,
        a.tipe,
        a.saldo_normal,
        COALESCE(SUM(jb.debit), 0)::BIGINT AS total_debit,
        COALESCE(SUM(jb.kredit), 0)::BIGINT AS total_kredit
    FROM akun a
    LEFT JOIN (
        SELECT jb_inner.akun_id, jb_inner.debit, jb_inner.kredit
        FROM jurnal_baris jb_inner
        JOIN jurnal j ON j.id = jb_inner.jurnal_id
        WHERE j.status IN ('diposting', 'dibalik')
          AND j.tanggal >= p_dari
          AND j.tanggal <= p_sampai
    ) jb ON jb.akun_id = a.id
    WHERE auth_is_aktif() AND auth_peran() IN ('akuntan', 'direktur')
      AND (a.aktif = true OR EXISTS (
          SELECT 1 FROM jurnal_baris jb_hist
          JOIN jurnal j_hist ON j_hist.id = jb_hist.jurnal_id
          WHERE jb_hist.akun_id = a.id AND j_hist.status IN ('diposting', 'dibalik')
      ))
    GROUP BY a.id, a.kode, a.nama, a.tipe, a.saldo_normal
    ORDER BY a.kode ASC;
$$;

-- Cabut hak eksekusi dari publik dan anon, berikan hanya kepada authenticated
REVOKE ALL ON FUNCTION saldo_akun_per_tanggal(date) FROM PUBLIC;
REVOKE ALL ON FUNCTION saldo_akun_per_tanggal(date) FROM anon;
GRANT EXECUTE ON FUNCTION saldo_akun_per_tanggal(date) TO authenticated;

REVOKE ALL ON FUNCTION mutasi_akun_rentang(date, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION mutasi_akun_rentang(date, date) FROM anon;
GRANT EXECUTE ON FUNCTION mutasi_akun_rentang(date, date) TO authenticated;
