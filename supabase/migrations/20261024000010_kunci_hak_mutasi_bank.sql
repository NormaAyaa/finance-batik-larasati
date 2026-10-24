-- ==============================================================================
-- Migrasi: 20261024000010_kunci_hak_mutasi_bank.sql
-- Deskripsi: Mengunci hak akses dan immutabilitas tabel mutasi_bank:
-- 1. Hak UPDATE dibatasi hanya pada kolom jurnal_id untuk Akuntan aktif.
-- 2. Trigger mencegah perubahan kolom data transaksi mutasi bank (immutability guard).
-- 3. Hak DELETE dicabut total dari semua peran (authenticated, anon, public) dan dilindungi trigger anti-delete.
-- 4. Hak akses untuk peran Staf dan anon ditolak total (RLS & Revoke).
-- ==============================================================================

-- 1. Pastikan RLS Aktif pada mutasi_bank
ALTER TABLE mutasi_bank ENABLE ROW LEVEL SECURITY;

-- 2. Cabut seluruh hak bawaan dari PUBLIC dan anon
REVOKE ALL ON TABLE mutasi_bank FROM PUBLIC;
REVOKE ALL ON TABLE mutasi_bank FROM anon;

-- 3. Cabut hak DELETE dari semua peran (tidak ada izin DELETE untuk siapa pun)
REVOKE DELETE ON TABLE mutasi_bank FROM PUBLIC;
REVOKE DELETE ON TABLE mutasi_bank FROM anon;
REVOKE DELETE ON TABLE mutasi_bank FROM authenticated;

-- 4. Batasi hak UPDATE: cabut update umum, hanya izinkan UPDATE pada kolom jurnal_id untuk authenticated
REVOKE UPDATE ON TABLE mutasi_bank FROM PUBLIC;
REVOKE UPDATE ON TABLE mutasi_bank FROM anon;
REVOKE UPDATE ON TABLE mutasi_bank FROM authenticated;

GRANT SELECT, INSERT ON TABLE mutasi_bank TO authenticated;
GRANT UPDATE (jurnal_id) ON TABLE mutasi_bank TO authenticated;

-- 5. Trigger Penguncian Immutabilitas: Mencegah perubahan data mutasi selain jurnal_id
CREATE OR REPLACE FUNCTION trg_cegah_perubahan_mutasi_bank_func()
RETURNS TRIGGER AS $$
BEGIN
    -- Tolak jika ada perubahan pada kolom-kolom inti mutasi bank
    IF NEW.id <> OLD.id OR
       NEW.akun_bank_id <> OLD.akun_bank_id OR
       NEW.tanggal <> OLD.tanggal OR
       NEW.deskripsi <> OLD.deskripsi OR
       NEW.jumlah <> OLD.jumlah OR
       (NEW.saldo IS DISTINCT FROM OLD.saldo) OR
       NEW.nama_file <> OLD.nama_file OR
       NEW.diimpor_oleh <> OLD.diimpor_oleh OR
       NEW.diimpor_pada <> OLD.diimpor_pada THEN
        RAISE EXCEPTION 'Kolom mutasi bank tidak dapat diubah setelah diimpor. Hanya tautan jurnal_id yang dapat diperbarui.'
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_cegah_perubahan_mutasi_bank ON mutasi_bank;
CREATE TRIGGER trg_cegah_perubahan_mutasi_bank
BEFORE UPDATE ON mutasi_bank
FOR EACH ROW
EXECUTE FUNCTION trg_cegah_perubahan_mutasi_bank_func();

-- 6. Trigger Penguncian Hapus: Melarang penghapusan baris mutasi bank untuk siapa pun
CREATE OR REPLACE FUNCTION trg_cegah_hapus_mutasi_bank_func()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Data mutasi bank bersifat permanen dan tidak dapat dihapus.'
        USING ERRCODE = '23514';
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_cegah_hapus_mutasi_bank ON mutasi_bank;
CREATE TRIGGER trg_cegah_hapus_mutasi_bank
BEFORE DELETE ON mutasi_bank
FOR EACH ROW
EXECUTE FUNCTION trg_cegah_hapus_mutasi_bank_func();

-- 7. Kebijakan RLS (Row Level Security) Mutasi Bank
-- Policy SELECT: Akuntan dan Direktur aktif dapat membaca mutasi bank (BR-11)
DROP POLICY IF EXISTS "mutasi_bank_select_akuntan_direktur" ON mutasi_bank;
CREATE POLICY "mutasi_bank_select_akuntan_direktur" ON mutasi_bank
FOR SELECT TO authenticated
USING (
    auth_is_aktif() AND auth_peran() IN ('akuntan', 'direktur')
);

-- Policy INSERT: Hanya Akuntan aktif yang dapat mengimpor mutasi bank
-- WITH CHECK mewajibkan diimpor_oleh = auth.uid() agar identitas pengimpor tidak bisa dipalsukan
DROP POLICY IF EXISTS "mutasi_bank_insert_akuntan" ON mutasi_bank;
CREATE POLICY "mutasi_bank_insert_akuntan" ON mutasi_bank
FOR INSERT TO authenticated
WITH CHECK (
    auth_is_aktif()
    AND auth_peran() = 'akuntan'
    AND diimpor_oleh = auth.uid()
);

-- Policy UPDATE: Hanya Akuntan aktif yang dapat memperbarui (dibatasi kolom jurnal_id via GRANT)
DROP POLICY IF EXISTS "mutasi_bank_update_akuntan" ON mutasi_bank;
CREATE POLICY "mutasi_bank_update_akuntan" ON mutasi_bank
FOR UPDATE TO authenticated
USING (
    auth_is_aktif() AND auth_peran() = 'akuntan'
)
WITH CHECK (
    auth_is_aktif() AND auth_peran() = 'akuntan'
);

-- Pastikan tidak ada policy DELETE sama sekali
DROP POLICY IF EXISTS "mutasi_bank_delete_akuntan" ON mutasi_bank;
DROP POLICY IF EXISTS "mutasi_bank_delete_all" ON mutasi_bank;

COMMENT ON TABLE mutasi_bank IS 'Tabel mutasi rekening koran bank dengan penguncian hak UPDATE per-kolom (jurnal_id), trigger immutabilitas, larangan DELETE, dan RLS untuk peran Akuntan & Direktur.';
