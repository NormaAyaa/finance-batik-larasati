-- ==============================================================================
-- Migration: 20261021000007_simpan_jurnal_draf_and_guards.sql
-- Deskripsi: 
-- 1. Penambahan function simpan_jurnal_draf (atomik header + baris, SECURITY INVOKER, auth.uid()).
-- 2. Update RLS jurnal_insert_akuntan & jurnal_update_akuntan agar WITH CHECK mewajibkan dibuat_oleh = auth.uid().
-- 3. Update trigger trg_jurnal_auto_periode agar mengisi periode_id dari tanggal dan menimpa nilai kiriman klien pada INSERT maupun UPDATE.
-- ==============================================================================

-- ==============================================================================
-- 1. FUNCTION SIMPAN_JURNAL_DRAF (Atomik Baru & Ubah Draf)
-- ==============================================================================
CREATE OR REPLACE FUNCTION simpan_jurnal_draf(
    p_jurnal_id BIGINT DEFAULT NULL,
    p_tanggal DATE DEFAULT NULL,
    p_keterangan TEXT DEFAULT NULL,
    p_baris JSONB DEFAULT '[]'::JSONB
)
RETURNS jurnal AS $$
DECLARE
    v_user_id UUID;
    v_operator_profile profiles%ROWTYPE;
    v_jurnal jurnal%ROWTYPE;
    v_target_id BIGINT;
    v_baris_count INT;
    v_elem JSONB;
    v_urutan INT := 0;
    v_akun_id BIGINT;
    v_debit BIGINT;
    v_kredit BIGINT;
    v_baris_ket TEXT;
BEGIN
    -- 1. Identitas pembuat murni dari auth.uid() (tidak menerima dari parameter)
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: Pengguna belum terautentikasi (auth.uid() kosong).';
    END IF;

    -- Verifikasi profil aktif & peran akuntan
    SELECT * INTO v_operator_profile FROM profiles WHERE id = v_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profil pengguna tidak ditemukan.';
    END IF;

    IF NOT v_operator_profile.aktif THEN
        RAISE EXCEPTION 'Akun pengguna sedang dinonaktifkan (BR-12).';
    END IF;

    IF v_operator_profile.peran <> 'akuntan' THEN
        RAISE EXCEPTION 'Hanya Akuntan yang berhak membuat atau mengubah draf jurnal umum.';
    END IF;

    -- 2. Validasi input
    IF p_tanggal IS NULL THEN
        RAISE EXCEPTION 'Tanggal transaksi wajib diisi.';
    END IF;

    IF p_keterangan IS NULL OR length(trim(p_keterangan)) < 5 THEN
        RAISE EXCEPTION 'Keterangan jurnal wajib diisi minimal 5 karakter.';
    END IF;

    IF p_baris IS NULL OR jsonb_typeof(p_baris) <> 'array' THEN
        RAISE EXCEPTION 'Format baris jurnal tidak valid.';
    END IF;

    v_baris_count := jsonb_array_length(p_baris);
    IF v_baris_count < 2 THEN
        RAISE EXCEPTION 'Jurnal minimal harus memiliki 2 baris akun (BR-02).';
    END IF;

    -- 3. Simpan Header Draf Jurnal
    IF p_jurnal_id IS NULL OR p_jurnal_id = 0 THEN
        -- Insert Draf Baru
        -- Kolom dibuat_oleh murni dari v_user_id (auth.uid())
        -- Kolom sumber = 'manual', status = 'draf'
        -- Kolom periode_id akan diisi/ditimpa otomatis oleh trg_jurnal_auto_periode
        INSERT INTO jurnal (
            tanggal,
            keterangan,
            sumber,
            status,
            dibuat_oleh
        ) VALUES (
            p_tanggal,
            trim(p_keterangan),
            'manual',
            'draf',
            v_user_id
        ) RETURNING * INTO v_jurnal;

        v_target_id := v_jurnal.id;
    ELSE
        -- Update Draf yang Sudah Ada
        SELECT * INTO v_jurnal
        FROM jurnal
        WHERE id = p_jurnal_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Jurnal dengan ID % tidak ditemukan.', p_jurnal_id;
        END IF;

        IF v_jurnal.status <> 'draf' THEN
            RAISE EXCEPTION 'Hanya jurnal berstatus draf yang dapat diubah datanya. Status saat ini: % (BR-04).', v_jurnal.status;
        END IF;

        UPDATE jurnal
        SET tanggal = p_tanggal,
            keterangan = trim(p_keterangan)
        WHERE id = p_jurnal_id
        RETURNING * INTO v_jurnal;

        v_target_id := p_jurnal_id;

        -- Hapus baris lama dalam transaksi yang sama
        DELETE FROM jurnal_baris WHERE jurnal_id = v_target_id;
    END IF;

    -- 4. Simpan seluruh baris baru dalam transaksi yang sama
    FOR v_elem IN SELECT * FROM jsonb_array_elements(p_baris)
    LOOP
        v_urutan := v_urutan + 1;
        v_akun_id := (v_elem->>'akun_id')::BIGINT;
        v_debit := COALESCE((v_elem->>'debit')::BIGINT, 0);
        v_kredit := COALESCE((v_elem->>'kredit')::BIGINT, 0);
        v_baris_ket := v_elem->>'keterangan';

        IF v_akun_id IS NULL THEN
            RAISE EXCEPTION 'Baris ke-%: Akun wajib dipilih.', v_urutan;
        END IF;

        IF v_debit < 0 OR v_kredit < 0 THEN
            RAISE EXCEPTION 'Baris ke-%: Nilai debit dan kredit tidak boleh negatif (BR-02).', v_urutan;
        END IF;

        IF (v_debit = 0 AND v_kredit = 0) OR (v_debit > 0 AND v_kredit > 0) THEN
            RAISE EXCEPTION 'Baris ke-%: Satu baris hanya boleh diisi salah satu antara debit atau kredit (BR-02).', v_urutan;
        END IF;

        IF v_baris_ket IS NOT NULL AND length(trim(v_baris_ket)) = 0 THEN
            v_baris_ket := NULL;
        ELSE
            v_baris_ket := trim(v_baris_ket);
        END IF;

        INSERT INTO jurnal_baris (
            jurnal_id,
            urutan,
            akun_id,
            debit,
            kredit,
            keterangan
        ) VALUES (
            v_target_id,
            v_urutan,
            v_akun_id,
            v_debit,
            v_kredit,
            v_baris_ket
        );
    END LOOP;

    RETURN v_jurnal;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path = public, pg_temp;

-- Hak Akses: Hanya authenticated yang dapat mengeksekusi
REVOKE ALL ON FUNCTION simpan_jurnal_draf(BIGINT, DATE, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION simpan_jurnal_draf(BIGINT, DATE, TEXT, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION simpan_jurnal_draf(BIGINT, DATE, TEXT, JSONB) TO authenticated;

COMMENT ON FUNCTION simpan_jurnal_draf(BIGINT, DATE, TEXT, JSONB) IS 
'Menyimpan header draf jurnal dan seluruh baris akunnya secara atomik dalam satu transaksi database.';

-- ==============================================================================
-- 2. RLS POLICY DENGAN WITH CHECK (dibuat_oleh = auth.uid())
-- ==============================================================================
DROP POLICY IF EXISTS "jurnal_insert_akuntan" ON jurnal;
CREATE POLICY "jurnal_insert_akuntan" ON jurnal
FOR INSERT TO authenticated
WITH CHECK (
    auth_is_aktif() AND auth_peran() = 'akuntan' AND status = 'draf' AND dibuat_oleh = auth.uid()
);

DROP POLICY IF EXISTS "jurnal_update_akuntan" ON jurnal;
CREATE POLICY "jurnal_update_akuntan" ON jurnal
FOR UPDATE TO authenticated
USING (
    auth_is_aktif() AND auth_peran() = 'akuntan' AND status = 'draf'
)
WITH CHECK (
    auth_is_aktif() AND auth_peran() = 'akuntan' AND status = 'draf' AND dibuat_oleh = auth.uid()
);

-- ==============================================================================
-- 3. TRIGGER OTOMATISASI & MENIMPA PERIODE_ID DARI TANGGAL (INSERT & UPDATE)
-- ==============================================================================
CREATE OR REPLACE FUNCTION trg_jurnal_periode_guard()
RETURNS TRIGGER AS $$
DECLARE
    v_periode periode%ROWTYPE;
    v_tahun INT;
    v_bulan INT;
BEGIN
    -- Jalankan jika INSERT, atau jika tanggal/periode_id berubah pada UPDATE
    IF TG_OP = 'INSERT' OR OLD.tanggal IS DISTINCT FROM NEW.tanggal OR OLD.periode_id IS DISTINCT FROM NEW.periode_id THEN
        v_tahun := EXTRACT(YEAR FROM NEW.tanggal)::INT;
        v_bulan := EXTRACT(MONTH FROM NEW.tanggal)::INT;

        -- Cari periode berdasarkan tahun dan bulan tanggal transaksi
        SELECT * INTO v_periode
        FROM periode
        WHERE tahun = v_tahun AND bulan = v_bulan;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Periode akuntansi untuk tanggal jurnal (%) belum dibuat di sistem (BR-05).', NEW.tanggal;
        END IF;

        IF v_periode.status <> 'terbuka' THEN
            RAISE EXCEPTION 'Jurnal hanya bisa dibuat atau diubah pada periode yang berstatus terbuka (BR-05). Periode %-% sudah ditutup.',
                v_tahun, lpad(v_bulan::TEXT, 2, '0');
        END IF;

        -- Otomatis isi dan timpa nilai periode_id yang dikirim klien
        NEW.periode_id := v_periode.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_jurnal_auto_periode ON jurnal;
CREATE TRIGGER trg_jurnal_auto_periode
BEFORE INSERT OR UPDATE ON jurnal
FOR EACH ROW
EXECUTE FUNCTION trg_jurnal_periode_guard();
