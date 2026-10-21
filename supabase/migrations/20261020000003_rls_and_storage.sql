-- ==============================================================================
-- Migration: 20261020000003_rls_and_storage.sql
-- Proyek: Finance & Accounting UMKM (CV Batik Larasati)
-- Deskripsi: Tahap 4 - Row Level Security (RLS), Storage Bucket, Hak Akses Minimalis,
--            dan Helper Functions Berbasis auth.uid()
-- Target Database: rmwidxzdnrbgxeoxkapx
-- ==============================================================================

-- ==============================================================================
-- 1. HELPER FUNCTIONS (SECURITY DEFINER, SET search_path)
-- ==============================================================================

-- 1.1 Fungsi mendapatkan peran pengguna yang sedang login & aktif
CREATE OR REPLACE FUNCTION auth_peran()
RETURNS peran_pengguna
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_peran peran_pengguna;
BEGIN
    SELECT peran INTO v_peran
    FROM profiles
    WHERE id = auth.uid() AND aktif = true;
    RETURN v_peran;
END;
$$;

-- 1.2 Fungsi memeriksa apakah pengguna yang sedang login berstatus aktif
CREATE OR REPLACE FUNCTION auth_is_aktif()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_aktif BOOLEAN;
BEGIN
    SELECT aktif INTO v_aktif
    FROM profiles
    WHERE id = auth.uid();
    RETURN COALESCE(v_aktif, false);
END;
$$;

-- Batasi hak eksekusi helper function: cabut dari anon, beri authenticated & service_role
REVOKE ALL ON FUNCTION auth_peran() FROM PUBLIC;
REVOKE ALL ON FUNCTION auth_peran() FROM anon;
GRANT EXECUTE ON FUNCTION auth_peran() TO authenticated, service_role;

REVOKE ALL ON FUNCTION auth_is_aktif() FROM PUBLIC;
REVOKE ALL ON FUNCTION auth_is_aktif() FROM anon;
GRANT EXECUTE ON FUNCTION auth_is_aktif() TO authenticated, service_role;

-- ==============================================================================
-- 2. TRIGGER PROTEKSI DIREKTUR TIDAK BISA MENGUBAH DIRI SENDIRI (BR-12)
-- ==============================================================================
CREATE OR REPLACE FUNCTION trg_protect_direktur_self_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.peran IS DISTINCT FROM NEW.peran OR OLD.aktif IS DISTINCT FROM NEW.aktif) THEN
        IF auth.uid() IS NOT NULL AND auth.uid() = OLD.id THEN
            RAISE EXCEPTION 'Direktur dilarang mengubah peran atau status akunnya sendiri (BR-12).';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_direktur_self_mod ON profiles;
CREATE TRIGGER trg_direktur_self_mod
BEFORE UPDATE OF peran, aktif ON profiles
FOR EACH ROW
EXECUTE FUNCTION trg_protect_direktur_self_modification();

-- ==============================================================================
-- 3. AKTIFKAN ROW LEVEL SECURITY (RLS) DI SEMUA 8 TABEL
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE akun ENABLE ROW LEVEL SECURITY;
ALTER TABLE periode ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurnal ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurnal_baris ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengajuan ENABLE ROW LEVEL SECURITY;
ALTER TABLE penomoran ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 4. PEMBERSIHAN POLICY LAMA (IDEMPOTEN)
-- ==============================================================================
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_direktur_policy" ON profiles;

DROP POLICY IF EXISTS "akun_select_akuntan_direktur" ON akun;
DROP POLICY IF EXISTS "akun_select_staf" ON akun;
DROP POLICY IF EXISTS "akun_insert_akuntan" ON akun;
DROP POLICY IF EXISTS "akun_update_akuntan" ON akun;
DROP POLICY IF EXISTS "akun_delete_akuntan" ON akun;

DROP POLICY IF EXISTS "periode_select_akuntan_direktur" ON periode;
DROP POLICY IF EXISTS "periode_insert_akuntan" ON periode;
DROP POLICY IF EXISTS "periode_update_akuntan" ON periode;
DROP POLICY IF EXISTS "periode_delete_akuntan" ON periode;

DROP POLICY IF EXISTS "jurnal_select_akuntan_direktur" ON jurnal;
DROP POLICY IF EXISTS "jurnal_insert_akuntan" ON jurnal;
DROP POLICY IF EXISTS "jurnal_update_akuntan" ON jurnal;
DROP POLICY IF EXISTS "jurnal_delete_akuntan" ON jurnal;

DROP POLICY IF EXISTS "jurnal_baris_select_akuntan_direktur" ON jurnal_baris;
DROP POLICY IF EXISTS "jurnal_baris_insert_akuntan" ON jurnal_baris;
DROP POLICY IF EXISTS "jurnal_baris_update_akuntan" ON jurnal_baris;
DROP POLICY IF EXISTS "jurnal_baris_delete_akuntan" ON jurnal_baris;

DROP POLICY IF EXISTS "pengajuan_select_akuntan_direktur" ON pengajuan;
DROP POLICY IF EXISTS "pengajuan_select_staf" ON pengajuan;
DROP POLICY IF EXISTS "pengajuan_insert_pemilik" ON pengajuan;
DROP POLICY IF EXISTS "pengajuan_update_pemilik" ON pengajuan;
DROP POLICY IF EXISTS "pengajuan_delete_pemilik" ON pengajuan;

DROP POLICY IF EXISTS "penomoran_select_akuntan_direktur" ON penomoran;

DROP POLICY IF EXISTS "audit_log_select_direktur" ON audit_log;

-- ==============================================================================
-- 5. POLICY TABEL PROFILES
-- ==============================================================================
-- SELECT: Akuntan & Direktur boleh membaca semua profil (untuk daftar/tampilan).
-- Staf hanya boleh membaca profil dirinya sendiri.
-- Pengguna nonaktif ditolak total (auth_is_aktif() = false).
CREATE POLICY "profiles_select_policy" ON profiles
FOR SELECT TO authenticated
USING (
    auth_is_aktif() AND (
        auth_peran() IN ('akuntan', 'direktur')
        OR id = auth.uid()
    )
);

-- UPDATE: Hanya Direktur yang boleh mengubah profil orang lain (peran & aktif), tidak boleh diri sendiri (BR-12).
CREATE POLICY "profiles_update_direktur_policy" ON profiles
FOR UPDATE TO authenticated
USING (
    auth_is_aktif() AND auth_peran() = 'direktur' AND id <> auth.uid()
)
WITH CHECK (
    auth_is_aktif() AND auth_peran() = 'direktur' AND id <> auth.uid()
);

-- ==============================================================================
-- 6. POLICY TABEL AKUN
-- ==============================================================================
-- SELECT: Akuntan & Direktur membaca semua akun
CREATE POLICY "akun_select_akuntan_direktur" ON akun
FOR SELECT TO authenticated
USING (
    auth_is_aktif() AND auth_peran() IN ('akuntan', 'direktur')
);

-- SELECT: Staf hanya boleh membaca akun beban yang aktif saja
CREATE POLICY "akun_select_staf" ON akun
FOR SELECT TO authenticated
USING (
    auth_is_aktif() AND auth_peran() = 'staf' AND tipe = 'beban' AND aktif = true
);

-- INSERT / UPDATE / DELETE: Hanya Akuntan
CREATE POLICY "akun_insert_akuntan" ON akun
FOR INSERT TO authenticated
WITH CHECK (
    auth_is_aktif() AND auth_peran() = 'akuntan'
);

CREATE POLICY "akun_update_akuntan" ON akun
FOR UPDATE TO authenticated
USING (
    auth_is_aktif() AND auth_peran() = 'akuntan'
)
WITH CHECK (
    auth_is_aktif() AND auth_peran() = 'akuntan'
);

CREATE POLICY "akun_delete_akuntan" ON akun
FOR DELETE TO authenticated
USING (
    auth_is_aktif() AND auth_peran() = 'akuntan'
);

-- ==============================================================================
-- 7. POLICY TABEL PERIODE
-- ==============================================================================
-- SELECT: Akuntan & Direktur membaca seluruh periode
CREATE POLICY "periode_select_akuntan_direktur" ON periode
FOR SELECT TO authenticated
USING (
    auth_is_aktif() AND auth_peran() IN ('akuntan', 'direktur')
);

-- INSERT / UPDATE / DELETE: Hanya Akuntan (Direktur buka kembali periode via function resmi)
CREATE POLICY "periode_insert_akuntan" ON periode
FOR INSERT TO authenticated
WITH CHECK (
    auth_is_aktif() AND auth_peran() = 'akuntan'
);

CREATE POLICY "periode_update_akuntan" ON periode
FOR UPDATE TO authenticated
USING (
    auth_is_aktif() AND auth_peran() = 'akuntan'
)
WITH CHECK (
    auth_is_aktif() AND auth_peran() = 'akuntan'
);

CREATE POLICY "periode_delete_akuntan" ON periode
FOR DELETE TO authenticated
USING (
    auth_is_aktif() AND auth_peran() = 'akuntan'
);

-- ==============================================================================
-- 8. POLICY TABEL JURNAL
-- ==============================================================================
-- SELECT: Akuntan & Direktur membaca seluruh jurnal
CREATE POLICY "jurnal_select_akuntan_direktur" ON jurnal
FOR SELECT TO authenticated
USING (
    auth_is_aktif() AND auth_peran() IN ('akuntan', 'direktur')
);

-- INSERT: Hanya Akuntan (status draf)
CREATE POLICY "jurnal_insert_akuntan" ON jurnal
FOR INSERT TO authenticated
WITH CHECK (
    auth_is_aktif() AND auth_peran() = 'akuntan' AND status = 'draf'
);

-- UPDATE: Hanya Akuntan, hanya jika jurnal berstatus draf
CREATE POLICY "jurnal_update_akuntan" ON jurnal
FOR UPDATE TO authenticated
USING (
    auth_is_aktif() AND auth_peran() = 'akuntan' AND status = 'draf'
)
WITH CHECK (
    auth_is_aktif() AND auth_peran() = 'akuntan' AND status = 'draf'
);

-- DELETE: Hanya Akuntan, hanya jika jurnal berstatus draf
CREATE POLICY "jurnal_delete_akuntan" ON jurnal
FOR DELETE TO authenticated
USING (
    auth_is_aktif() AND auth_peran() = 'akuntan' AND status = 'draf'
);

-- ==============================================================================
-- 9. POLICY TABEL JURNAL_BARIS
-- ==============================================================================
-- SELECT: Akuntan & Direktur membaca seluruh baris jurnal
CREATE POLICY "jurnal_baris_select_akuntan_direktur" ON jurnal_baris
FOR SELECT TO authenticated
USING (
    auth_is_aktif() AND auth_peran() IN ('akuntan', 'direktur')
);

-- INSERT / UPDATE / DELETE: Hanya Akuntan, pada jurnal yang berstatus draf
CREATE POLICY "jurnal_baris_insert_akuntan" ON jurnal_baris
FOR INSERT TO authenticated
WITH CHECK (
    auth_is_aktif() AND auth_peran() = 'akuntan'
    AND EXISTS (
        SELECT 1 FROM jurnal WHERE jurnal.id = jurnal_baris.jurnal_id AND jurnal.status = 'draf'
    )
);

CREATE POLICY "jurnal_baris_update_akuntan" ON jurnal_baris
FOR UPDATE TO authenticated
USING (
    auth_is_aktif() AND auth_peran() = 'akuntan'
    AND EXISTS (
        SELECT 1 FROM jurnal WHERE jurnal.id = jurnal_baris.jurnal_id AND jurnal.status = 'draf'
    )
)
WITH CHECK (
    auth_is_aktif() AND auth_peran() = 'akuntan'
    AND EXISTS (
        SELECT 1 FROM jurnal WHERE jurnal.id = jurnal_baris.jurnal_id AND jurnal.status = 'draf'
    )
);

CREATE POLICY "jurnal_baris_delete_akuntan" ON jurnal_baris
FOR DELETE TO authenticated
USING (
    auth_is_aktif() AND auth_peran() = 'akuntan'
    AND EXISTS (
        SELECT 1 FROM jurnal WHERE jurnal.id = jurnal_baris.jurnal_id AND jurnal.status = 'draf'
    )
);

-- ==============================================================================
-- 10. POLICY TABEL PENGAJUAN
-- ==============================================================================
-- SELECT: Akuntan & Direktur melihat semua pengajuan
CREATE POLICY "pengajuan_select_akuntan_direktur" ON pengajuan
FOR SELECT TO authenticated
USING (
    auth_is_aktif() AND auth_peran() IN ('akuntan', 'direktur')
);

-- SELECT: Staf hanya melihat pengajuan miliknya sendiri
CREATE POLICY "pengajuan_select_staf" ON pengajuan
FOR SELECT TO authenticated
USING (
    auth_is_aktif() AND auth_peran() = 'staf' AND pengaju_id = auth.uid()
);

-- INSERT: Staf dan Akuntan dapat membuat draf pengajuan miliknya sendiri (BR-09). Direktur dilarang.
CREATE POLICY "pengajuan_insert_pemilik" ON pengajuan
FOR INSERT TO authenticated
WITH CHECK (
    auth_is_aktif()
    AND auth_peran() IN ('staf', 'akuntan')
    AND pengaju_id = auth.uid()
    AND status = 'draf'
);

-- UPDATE: Pemilik (Staf / Akuntan) hanya dapat mengubah pengajuannya saat draf atau perlu_revisi.
-- Syarat Revisi 2: status tetap draf atau perlu_revisi, dan kolom verifikasi, persetujuan, serta pembayaran dilarang diisi.
CREATE POLICY "pengajuan_update_pemilik" ON pengajuan
FOR UPDATE TO authenticated
USING (
    auth_is_aktif()
    AND auth_peran() IN ('staf', 'akuntan')
    AND pengaju_id = auth.uid()
    AND status IN ('draf', 'perlu_revisi')
)
WITH CHECK (
    auth_is_aktif()
    AND auth_peran() IN ('staf', 'akuntan')
    AND pengaju_id = auth.uid()
    AND status IN ('draf', 'perlu_revisi')
    AND diverifikasi_oleh IS NULL
    AND disetujui_oleh IS NULL
    AND akun_kas_id IS NULL
    AND dibayar_oleh IS NULL
    AND dibayar_pada IS NULL
);

-- CATATAN: TIDAK ADA POLICY DELETE PADA PENGAJUAN (Revisi 1). Pembatalan lewat status 'dibatalkan'.

-- ==============================================================================
-- 11. POLICY TABEL PENOMORAN
-- ==============================================================================
-- SELECT: Akuntan & Direktur
CREATE POLICY "penomoran_select_akuntan_direktur" ON penomoran
FOR SELECT TO authenticated
USING (
    auth_is_aktif() AND auth_peran() IN ('akuntan', 'direktur')
);
-- CATATAN: TIDAK ADA POLICY INSERT / UPDATE / DELETE (Hanya internal function SECURITY DEFINER).

-- ==============================================================================
-- 12. POLICY TABEL AUDIT_LOG
-- ==============================================================================
-- SELECT: Hanya Direktur yang aktif
CREATE POLICY "audit_log_select_direktur" ON audit_log
FOR SELECT TO authenticated
USING (
    auth_is_aktif() AND auth_peran() = 'direktur'
);
-- CATATAN: TIDAK ADA POLICY INSERT / UPDATE / DELETE (Hanya internal function SECURITY DEFINER).

-- ==============================================================================
-- 13. STORAGE BUCKET & POLICY STORAGE.OBJECTS
-- ==============================================================================
-- 13.1 Konfigurasi Bucket bukti_pengajuan (Privat, Max 5 MB, Format jpg, png, pdf)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'bukti_pengajuan',
    'bukti_pengajuan',
    false,
    5242880, -- 5 MB dalam byte
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf'];

-- 13.2 Catatan: RLS pada storage.objects sudah aktif bawaan Supabase (owner: supabase_storage_admin)

-- Pembersihan policy storage lama (idempoten)
DROP POLICY IF EXISTS "storage_select_bukti_pengajuan" ON storage.objects;
DROP POLICY IF EXISTS "storage_insert_bukti_pengajuan" ON storage.objects;
DROP POLICY IF EXISTS "storage_update_bukti_pengajuan" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_bukti_pengajuan" ON storage.objects;

-- SELECT: Akuntan & Direktur dapat membaca semua file di bucket bukti_pengajuan.
-- Staf hanya dapat membaca file di foldernya sendiri (path diawali user ID).
CREATE POLICY "storage_select_bukti_pengajuan" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'bukti_pengajuan'
    AND auth_is_aktif()
    AND (
        auth_peran() IN ('akuntan', 'direktur')
        OR (
            auth_peran() = 'staf'
            AND (
                (storage.foldername(name))[1] = auth.uid()::text
                OR name LIKE (auth.uid()::text || '/%')
            )
        )
    )
);

-- INSERT: Staf dan Akuntan dapat mengunggah file bukti ke foldernya masing-masing
CREATE POLICY "storage_insert_bukti_pengajuan" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'bukti_pengajuan'
    AND auth_is_aktif()
    AND auth_peran() IN ('staf', 'akuntan')
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR name LIKE (auth.uid()::text || '/%')
    )
);

-- UPDATE: Pengunggah (Staf / Akuntan) dapat memperbarui file miliknya sendiri
CREATE POLICY "storage_update_bukti_pengajuan" ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'bukti_pengajuan'
    AND auth_is_aktif()
    AND auth_peran() IN ('staf', 'akuntan')
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR name LIKE (auth.uid()::text || '/%')
    )
)
WITH CHECK (
    bucket_id = 'bukti_pengajuan'
    AND auth_is_aktif()
    AND auth_peran() IN ('staf', 'akuntan')
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR name LIKE (auth.uid()::text || '/%')
    )
);

-- DELETE: Pengunggah (Staf / Akuntan) dapat menghapus file miliknya sendiri
CREATE POLICY "storage_delete_bukti_pengajuan" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'bukti_pengajuan'
    AND auth_is_aktif()
    AND auth_peran() IN ('staf', 'akuntan')
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR name LIKE (auth.uid()::text || '/%')
    )
);

-- ==============================================================================
-- 14. PENCABUTAN HAK AKSES ANON & HAK MINIMALIS AUTHENTICATED
-- ==============================================================================

-- 14.1 Cabut semua hak akses tabel, sequence, dan routine dari role anon di schema public
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon;

-- 14.2 Cabut hak akses dari authenticated lalu berikan hak seminimal mungkin
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Hak baca saja untuk penomoran dan audit_log (tanpa hak tulis sama sekali - Revisi 3)
GRANT SELECT ON penomoran TO authenticated;
GRANT SELECT ON audit_log TO authenticated;

-- Hak terbatas pada tabel profiles: hanya SELECT dan UPDATE
GRANT SELECT, UPDATE ON profiles TO authenticated;

-- Hak pada bagan akun dan periode
GRANT SELECT, INSERT, UPDATE, DELETE ON akun TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON periode TO authenticated;

-- Hak pada jurnal umum dan baris jurnal
GRANT SELECT, INSERT, UPDATE, DELETE ON jurnal TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON jurnal_baris TO authenticated;

-- Hak pada tabel pengajuan: hanya SELECT, INSERT, UPDATE (TIDAK ADA DELETE - Revisi 1 & 3)
GRANT SELECT, INSERT, UPDATE ON pengajuan TO authenticated;

-- Hak sequence
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ==============================================================================
-- 15. SINKRONISASI SEQUENCE IDENTITY DENGAN DATA SEED (Mencegah duplicate key pkey)
-- ==============================================================================
SELECT setval(pg_get_serial_sequence('pengajuan', 'id'), COALESCE((SELECT MAX(id) FROM pengajuan), 1));
SELECT setval(pg_get_serial_sequence('jurnal', 'id'), COALESCE((SELECT MAX(id) FROM jurnal), 1));
SELECT setval(pg_get_serial_sequence('jurnal_baris', 'id'), COALESCE((SELECT MAX(id) FROM jurnal_baris), 1));
SELECT setval(pg_get_serial_sequence('akun', 'id'), COALESCE((SELECT MAX(id) FROM akun), 1));
SELECT setval(pg_get_serial_sequence('periode', 'id'), COALESCE((SELECT MAX(id) FROM periode), 1));
SELECT setval(pg_get_serial_sequence('audit_log', 'id'), COALESCE((SELECT MAX(id) FROM audit_log), 1));

