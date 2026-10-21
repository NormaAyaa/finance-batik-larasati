-- ==============================================================================
-- Migration: 20261020000006_revoke_public_execute.sql
-- Proyek: Finance & Accounting UMKM (CV Batik Larasati)
-- Deskripsi: 1. Cabut hak EXECUTE seluruh fungsi di schema public dari PUBLIC dan anon.
--            2. Cabut hak EXECUTE seluruh fungsi trigger dan event_trigger dari authenticated.
--            3. Cabut hak EXECUTE get_current_user_id() dari authenticated.
--            4. Berikan izin eksplisit hanya kepada 6 fungsi operasional versi baru
--               dan 2 helper RLS (auth_peran, auth_is_aktif) ke authenticated.
-- ==============================================================================

-- ==============================================================================
-- 1. CABUT HAK EXECUTE PADA SELURUH FUNGSI SCHEMA PUBLIC DARI PUBLIC DAN ANON
-- ==============================================================================
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- ==============================================================================
-- 2. CABUT HAK EXECUTE FUNGSI TRIGGER & EVENT TRIGGER DARI AUTHENTICATED
-- ==============================================================================
REVOKE ALL ON FUNCTION rls_auto_enable() FROM authenticated;
REVOKE ALL ON FUNCTION trg_check_akun_aktif_jurnal_baris() FROM authenticated;
REVOKE ALL ON FUNCTION trg_check_akun_aktif_pengajuan() FROM authenticated;
REVOKE ALL ON FUNCTION trg_check_pengaju_bukan_direktur() FROM authenticated;
REVOKE ALL ON FUNCTION trg_check_pengajuan_status_guard() FROM authenticated;
REVOKE ALL ON FUNCTION trg_jurnal_periode_guard() FROM authenticated;
REVOKE ALL ON FUNCTION trg_pengajuan_auto_nomor() FROM authenticated;
REVOKE ALL ON FUNCTION trg_prevent_audit_log_tampering() FROM authenticated;
REVOKE ALL ON FUNCTION trg_prevent_jurnal_baris_modification() FROM authenticated;
REVOKE ALL ON FUNCTION trg_prevent_jurnal_modification() FROM authenticated;
REVOKE ALL ON FUNCTION trg_protect_direktur_self_modification() FROM authenticated;
REVOKE ALL ON FUNCTION trg_protect_used_account() FROM authenticated;
REVOKE ALL ON FUNCTION trg_record_audit_log() FROM authenticated;

-- ==============================================================================
-- 3. CABUT HAK EXECUTE GET_CURRENT_USER_ID() DARI AUTHENTICATED
-- ==============================================================================
-- Fungsi ini hanya dipakai secara internal oleh trigger trg_record_audit_log
-- dan tidak digunakan pada pg_policies maupun default kolom tabel apa pun.
REVOKE ALL ON FUNCTION get_current_user_id() FROM authenticated;

-- ==============================================================================
-- 4. PASTIKAN OVERLOAD LAMA & FUNGSI INTERNAL TIDAK BISA DIAKSES AUTHENTICATED
-- ==============================================================================
REVOKE ALL ON FUNCTION posting_jurnal(BIGINT, UUID) FROM authenticated;
REVOKE ALL ON FUNCTION buat_jurnal_pembalik(BIGINT, DATE, TEXT, UUID) FROM authenticated;
REVOKE ALL ON FUNCTION tutup_periode(BIGINT, UUID) FROM authenticated;
REVOKE ALL ON FUNCTION buka_kembali_periode(BIGINT, TEXT, UUID) FROM authenticated;
REVOKE ALL ON FUNCTION transisi_status_pengajuan(BIGINT, status_pengajuan, UUID, TEXT) FROM authenticated;
REVOKE ALL ON FUNCTION bayar_pengajuan(BIGINT, BIGINT, DATE, UUID) FROM authenticated;
REVOKE ALL ON FUNCTION generate_nomor_dokumen(TEXT, DATE) FROM authenticated;

-- ==============================================================================
-- 5. BERIKAN HAK EKSPLISIT KEPADA 6 FUNGSI OPERASIONAL VERSI BARU & 2 HELPER RLS
-- ==============================================================================
-- 5.1 Enam function versi baru (murni auth.uid())
GRANT EXECUTE ON FUNCTION posting_jurnal(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION buat_jurnal_pembalik(BIGINT, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION tutup_periode(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION buka_kembali_periode(BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION transisi_status_pengajuan(BIGINT, status_pengajuan, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION bayar_pengajuan(BIGINT, BIGINT, DATE) TO authenticated;

-- 5.2 Dua helper functions RLS (yang dirujuk oleh pg_policies)
GRANT EXECUTE ON FUNCTION auth_peran() TO authenticated;
GRANT EXECUTE ON FUNCTION auth_is_aktif() TO authenticated;

-- 5.3 Berikan akses lengkap ke service_role
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
