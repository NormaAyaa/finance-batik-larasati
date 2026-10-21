-- ==============================================================================
-- Migration: 20261020000005_revoke_old_function_overloads.sql
-- Proyek: Finance & Accounting UMKM (CV Batik Larasati)
-- Deskripsi: Merapikan 6 overload fungsi lama (yang menerima p_user_id) menjadi
--            fungsi internal tanpa default parameter, mencabut hak EXECUTE dari
--            PUBLIC, anon, dan authenticated, serta menyetel ALTER DEFAULT PRIVILEGES.
-- ==============================================================================

-- ==============================================================================
-- 1. MERAPIKAN OVERLOAD LAMA MENJADI INTERNAL STUB & MENCABUT HAK AKSES
-- ==============================================================================

-- 1.1 posting_jurnal(bigint, uuid)
DROP FUNCTION IF EXISTS posting_jurnal(bigint, uuid);
CREATE OR REPLACE FUNCTION posting_jurnal(p_jurnal_id bigint, p_user_id uuid)
RETURNS jurnal AS $$
BEGIN
    RAISE EXCEPTION 'Akses ditolak: Overload posting_jurnal dengan parameter p_user_id sudah dinonaktifkan.';
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION posting_jurnal(bigint, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION posting_jurnal(bigint, uuid) FROM anon;
REVOKE ALL ON FUNCTION posting_jurnal(bigint, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION posting_jurnal(bigint, uuid) TO service_role;
COMMENT ON FUNCTION posting_jurnal(bigint, uuid) IS 'DEPRECATED / INTERNAL ONLY: Tidak boleh dipanggil langsung dari API client.';

-- 1.2 buat_jurnal_pembalik(bigint, date, text, uuid)
DROP FUNCTION IF EXISTS buat_jurnal_pembalik(bigint, date, text, uuid);
CREATE OR REPLACE FUNCTION buat_jurnal_pembalik(p_jurnal_id bigint, p_tanggal_pembalik date, p_keterangan text, p_user_id uuid)
RETURNS jurnal AS $$
BEGIN
    RAISE EXCEPTION 'Akses ditolak: Overload buat_jurnal_pembalik dengan parameter p_user_id sudah dinonaktifkan.';
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION buat_jurnal_pembalik(bigint, date, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION buat_jurnal_pembalik(bigint, date, text, uuid) FROM anon;
REVOKE ALL ON FUNCTION buat_jurnal_pembalik(bigint, date, text, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION buat_jurnal_pembalik(bigint, date, text, uuid) TO service_role;
COMMENT ON FUNCTION buat_jurnal_pembalik(bigint, date, text, uuid) IS 'DEPRECATED / INTERNAL ONLY: Tidak boleh dipanggil langsung dari API client.';

-- 1.3 tutup_periode(bigint, uuid)
DROP FUNCTION IF EXISTS tutup_periode(bigint, uuid);
CREATE OR REPLACE FUNCTION tutup_periode(p_periode_id bigint, p_user_id uuid)
RETURNS periode AS $$
BEGIN
    RAISE EXCEPTION 'Akses ditolak: Overload tutup_periode dengan parameter p_user_id sudah dinonaktifkan.';
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION tutup_periode(bigint, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION tutup_periode(bigint, uuid) FROM anon;
REVOKE ALL ON FUNCTION tutup_periode(bigint, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION tutup_periode(bigint, uuid) TO service_role;
COMMENT ON FUNCTION tutup_periode(bigint, uuid) IS 'DEPRECATED / INTERNAL ONLY: Tidak boleh dipanggil langsung dari API client.';

-- 1.4 buka_kembali_periode(bigint, text, uuid)
DROP FUNCTION IF EXISTS buka_kembali_periode(bigint, text, uuid);
CREATE OR REPLACE FUNCTION buka_kembali_periode(p_periode_id bigint, p_alasan text, p_user_id uuid)
RETURNS periode AS $$
BEGIN
    RAISE EXCEPTION 'Akses ditolak: Overload buka_kembali_periode dengan parameter p_user_id sudah dinonaktifkan.';
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION buka_kembali_periode(bigint, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION buka_kembali_periode(bigint, text, uuid) FROM anon;
REVOKE ALL ON FUNCTION buka_kembali_periode(bigint, text, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION buka_kembali_periode(bigint, text, uuid) TO service_role;
COMMENT ON FUNCTION buka_kembali_periode(bigint, text, uuid) IS 'DEPRECATED / INTERNAL ONLY: Tidak boleh dipanggil langsung dari API client.';

-- 1.5 transisi_status_pengajuan(bigint, status_pengajuan, uuid, text)
DROP FUNCTION IF EXISTS transisi_status_pengajuan(bigint, status_pengajuan, uuid, text);
CREATE OR REPLACE FUNCTION transisi_status_pengajuan(p_pengajuan_id bigint, p_status_baru status_pengajuan, p_user_id uuid, p_catatan text)
RETURNS pengajuan AS $$
BEGIN
    RAISE EXCEPTION 'Akses ditolak: Overload transisi_status_pengajuan dengan parameter p_user_id sudah dinonaktifkan.';
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION transisi_status_pengajuan(bigint, status_pengajuan, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION transisi_status_pengajuan(bigint, status_pengajuan, uuid, text) FROM anon;
REVOKE ALL ON FUNCTION transisi_status_pengajuan(bigint, status_pengajuan, uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION transisi_status_pengajuan(bigint, status_pengajuan, uuid, text) TO service_role;
COMMENT ON FUNCTION transisi_status_pengajuan(bigint, status_pengajuan, uuid, text) IS 'DEPRECATED / INTERNAL ONLY: Tidak boleh dipanggil langsung dari API client.';

-- 1.6 bayar_pengajuan(bigint, bigint, date, uuid)
DROP FUNCTION IF EXISTS bayar_pengajuan(bigint, bigint, date, uuid);
CREATE OR REPLACE FUNCTION bayar_pengajuan(p_pengajuan_id bigint, p_akun_kas_id bigint, p_tanggal_bayar date, p_user_id uuid)
RETURNS pengajuan AS $$
BEGIN
    RAISE EXCEPTION 'Akses ditolak: Overload bayar_pengajuan dengan parameter p_user_id sudah dinonaktifkan.';
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION bayar_pengajuan(bigint, bigint, date, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION bayar_pengajuan(bigint, bigint, date, uuid) FROM anon;
REVOKE ALL ON FUNCTION bayar_pengajuan(bigint, bigint, date, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION bayar_pengajuan(bigint, bigint, date, uuid) TO service_role;
COMMENT ON FUNCTION bayar_pengajuan(bigint, bigint, date, uuid) IS 'DEPRECATED / INTERNAL ONLY: Tidak boleh dipanggil langsung dari API client.';

-- ==============================================================================
-- 2. ALTER DEFAULT PRIVILEGES (Mencegah fungsi baru otomatis dibuka ke PUBLIC / anon)
-- ==============================================================================
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon;
