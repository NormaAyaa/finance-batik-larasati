-- ==============================================================================
-- Migration: 20261020000004_remove_override_user.sql
-- Proyek: Finance & Accounting UMKM (CV Batik Larasati)
-- Deskripsi: Menghapus fallback app.override_user_id dari enam function utama:
--            1. posting_jurnal
--            2. buat_jurnal_pembalik
--            3. tutup_periode
--            4. buka_kembali_periode
--            5. transisi_status_pengajuan
--            6. bayar_pengajuan
-- Identitas pelaku murni didapatkan dari auth.uid() tanpa celah bypass.
-- ==============================================================================

-- ==============================================================================
-- 1. POSTING_JURNAL (Murni auth.uid())
-- ==============================================================================
CREATE OR REPLACE FUNCTION posting_jurnal(
    p_jurnal_id BIGINT
)
RETURNS jurnal AS $$
DECLARE
    v_jurnal jurnal%ROWTYPE;
    v_periode periode%ROWTYPE;
    v_operator_profile profiles%ROWTYPE;
    v_operator_id UUID;
    v_baris_count INT;
    v_total_debit BIGINT;
    v_total_kredit BIGINT;
    v_nomor TEXT;
BEGIN
    -- Identitas operator murni dari auth.uid()
    v_operator_id := auth.uid();
    IF v_operator_id IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: Pengguna belum terautentikasi (auth.uid() kosong).';
    END IF;

    -- Verifikasi profil dan status aktif
    SELECT * INTO v_operator_profile FROM profiles WHERE id = v_operator_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profil pengguna dengan ID % tidak ditemukan.', v_operator_id;
    END IF;

    IF NOT v_operator_profile.aktif THEN
        RAISE EXCEPTION 'Akun pengguna sedang dinonaktifkan (BR-12).';
    END IF;

    IF v_operator_profile.peran <> 'akuntan' THEN
        RAISE EXCEPTION 'Hanya Akuntan yang berhak memposting jurnal umum (BR-05).';
    END IF;

    -- 1. Kunci baris jurnal yang akan diposting
    SELECT * INTO v_jurnal
    FROM jurnal
    WHERE id = p_jurnal_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Jurnal dengan ID % tidak ditemukan.', p_jurnal_id;
    END IF;

    IF v_jurnal.status <> 'draf' THEN
        RAISE EXCEPTION 'Hanya jurnal berstatus draf yang dapat diposting. Status saat ini: %', v_jurnal.status;
    END IF;

    -- 2. Kunci periode dengan FOR SHARE untuk mencegah penutupan periode bersamaan (BR-05)
    SELECT * INTO v_periode
    FROM periode
    WHERE id = v_jurnal.periode_id
    FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Periode akuntansi untuk jurnal ini tidak ditemukan.';
    END IF;

    IF v_periode.status <> 'terbuka' THEN
        RAISE EXCEPTION 'Tidak dapat memposting: periode akuntansi (%-%) berstatus ditutup (BR-05).',
            v_periode.tahun, lpad(v_periode.bulan::TEXT, 2, '0');
    END IF;

    -- 3. Cek baris jurnal: minimal 2 baris, debit = kredit (BR-02)
    SELECT COUNT(*), COALESCE(SUM(debit), 0), COALESCE(SUM(kredit), 0)
    INTO v_baris_count, v_total_debit, v_total_kredit
    FROM jurnal_baris
    WHERE jurnal_id = p_jurnal_id;

    IF v_baris_count < 2 THEN
        RAISE EXCEPTION 'Jurnal minimal harus memiliki 2 baris akun (BR-02). Baris saat ini: %', v_baris_count;
    END IF;

    IF v_total_debit <> v_total_kredit THEN
        RAISE EXCEPTION 'Jurnal tidak seimbang: Total Debit (Rp %) tidak sama dengan Total Kredit (Rp %) (BR-02).',
            v_total_debit, v_total_kredit;
    END IF;

    IF v_total_debit <= 0 THEN
        RAISE EXCEPTION 'Total nilai transaksi jurnal harus lebih dari 0.';
    END IF;

    -- 4. Cek semua akun pada baris jurnal harus aktif (BR-01)
    IF EXISTS (
        SELECT 1
        FROM jurnal_baris jb
        JOIN akun a ON a.id = jb.akun_id
        WHERE jb.jurnal_id = p_jurnal_id AND a.aktif = false
    ) THEN
        RAISE EXCEPTION 'Semua akun yang digunakan dalam baris jurnal harus aktif (BR-01).';
    END IF;

    -- 5. Generate nomor jurnal berurutan per bulan transaksi (BR-03)
    v_nomor := generate_nomor_dokumen('JU', v_jurnal.tanggal);

    -- 6. Update status dan data posting
    UPDATE jurnal
    SET status = 'diposting',
        nomor = v_nomor,
        diposting_oleh = v_operator_id,
        diposting_pada = now()
    WHERE id = p_jurnal_id
    RETURNING * INTO v_jurnal;

    RETURN v_jurnal;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION posting_jurnal(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION posting_jurnal(BIGINT) FROM anon;
GRANT EXECUTE ON FUNCTION posting_jurnal(BIGINT) TO authenticated, service_role;

-- ==============================================================================
-- 2. BUAT_JURNAL_PEMBALIK (Murni auth.uid())
-- ==============================================================================
CREATE OR REPLACE FUNCTION buat_jurnal_pembalik(
    p_jurnal_id BIGINT,
    p_tanggal_pembalik DATE,
    p_keterangan TEXT
)
RETURNS jurnal AS $$
DECLARE
    v_original jurnal%ROWTYPE;
    v_target_periode periode%ROWTYPE;
    v_operator_profile profiles%ROWTYPE;
    v_pembalik_id BIGINT;
    v_pembalik_jurnal jurnal%ROWTYPE;
    v_operator_id UUID;
    v_tahun INT;
    v_bulan INT;
BEGIN
    -- Identitas operator murni dari auth.uid()
    v_operator_id := auth.uid();
    IF v_operator_id IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: Pengguna belum terautentikasi (auth.uid() kosong).';
    END IF;

    SELECT * INTO v_operator_profile FROM profiles WHERE id = v_operator_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profil pengguna tidak ditemukan.';
    END IF;

    IF NOT v_operator_profile.aktif THEN
        RAISE EXCEPTION 'Akun pengguna sedang dinonaktifkan (BR-12).';
    END IF;

    IF v_operator_profile.peran <> 'akuntan' THEN
        RAISE EXCEPTION 'Hanya Akuntan yang berhak membuat jurnal pembalik (BR-04).';
    END IF;

    v_tahun := EXTRACT(YEAR FROM p_tanggal_pembalik)::INT;
    v_bulan := EXTRACT(MONTH FROM p_tanggal_pembalik)::INT;

    -- 1. Kunci jurnal target
    SELECT * INTO v_original
    FROM jurnal
    WHERE id = p_jurnal_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Jurnal dengan ID % tidak ditemukan.', p_jurnal_id;
    END IF;

    IF v_original.status <> 'diposting' THEN
        RAISE EXCEPTION 'Hanya jurnal yang sudah diposting yang dapat dibalik. Status saat ini: %', v_original.status;
    END IF;

    IF v_original.sumber = 'pembalik' THEN
        RAISE EXCEPTION 'Jurnal pembalik tidak dapat dibalik kembali (BR-04).';
    END IF;

    IF v_original.sumber = 'pengajuan' THEN
        RAISE EXCEPTION 'Jurnal pembayaran pengajuan tidak dapat dibalik (BR-04).';
    END IF;

    IF EXISTS (SELECT 1 FROM jurnal WHERE jurnal_dibalik_id = p_jurnal_id) THEN
        RAISE EXCEPTION 'Jurnal ini sudah pernah dibalik sebelumnya (BR-04).';
    END IF;

    -- 2. Cari dan validasi periode aktif untuk tanggal pembalik (BR-05)
    SELECT * INTO v_target_periode
    FROM periode
    WHERE tahun = v_tahun AND bulan = v_bulan
    FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Periode akuntansi untuk tanggal pembalik (%) belum dibuat.', p_tanggal_pembalik;
    END IF;

    IF v_target_periode.status <> 'terbuka' THEN
        RAISE EXCEPTION 'Tanggal pembalik berada di periode akuntansi yang sudah ditutup (BR-05).';
    END IF;

    -- 3. Buat header jurnal pembalik sebagai draf
    INSERT INTO jurnal (
        tanggal,
        periode_id,
        keterangan,
        sumber,
        status,
        jurnal_dibalik_id,
        dibuat_oleh
    ) VALUES (
        p_tanggal_pembalik,
        v_target_periode.id,
        p_keterangan,
        'pembalik',
        'draf',
        p_jurnal_id,
        v_operator_id
    ) RETURNING id INTO v_pembalik_id;

    -- 4. Salin baris jurnal dengan membalik posisi debit dan kredit (BR-04)
    INSERT INTO jurnal_baris (jurnal_id, urutan, akun_id, debit, kredit, keterangan)
    SELECT
        v_pembalik_id,
        urutan,
        akun_id,
        kredit AS debit,
        debit AS kredit,
        'Pembalik JU ' || COALESCE(v_original.nomor, '') || ': ' || COALESCE(keterangan, '')
    FROM jurnal_baris
    WHERE jurnal_id = p_jurnal_id
    ORDER BY urutan;

    -- 5. Posting jurnal pembalik tersebut
    v_pembalik_jurnal := posting_jurnal(v_pembalik_id);

    -- 6. Ubah status jurnal asli menjadi 'dibalik' (BR-04)
    UPDATE jurnal
    SET status = 'dibalik'
    WHERE id = p_jurnal_id;

    RETURN v_pembalik_jurnal;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION buat_jurnal_pembalik(BIGINT, DATE, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION buat_jurnal_pembalik(BIGINT, DATE, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION buat_jurnal_pembalik(BIGINT, DATE, TEXT) TO authenticated, service_role;

-- ==============================================================================
-- 3. TUTUP_PERIODE (Murni auth.uid())
-- ==============================================================================
CREATE OR REPLACE FUNCTION tutup_periode(
    p_periode_id BIGINT
)
RETURNS periode AS $$
DECLARE
    v_periode periode%ROWTYPE;
    v_operator_profile profiles%ROWTYPE;
    v_operator_id UUID;
BEGIN
    -- Identitas operator murni dari auth.uid()
    v_operator_id := auth.uid();
    IF v_operator_id IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: Pengguna belum terautentikasi (auth.uid() kosong).';
    END IF;

    SELECT * INTO v_operator_profile FROM profiles WHERE id = v_operator_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profil pengguna tidak ditemukan.';
    END IF;

    IF NOT v_operator_profile.aktif THEN
        RAISE EXCEPTION 'Akun pengguna sedang dinonaktifkan (BR-12).';
    END IF;

    IF v_operator_profile.peran <> 'akuntan' THEN
        RAISE EXCEPTION 'Hanya pengguna dengan peran Akuntan yang berhak menutup periode (BR-06).';
    END IF;

    -- Kunci baris periode target dengan FOR UPDATE
    SELECT * INTO v_periode
    FROM periode
    WHERE id = p_periode_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Periode dengan ID % tidak ditemukan.', p_periode_id;
    END IF;

    IF v_periode.status = 'ditutup' THEN
        RAISE EXCEPTION 'Periode akuntansi ini sudah ditutup sebelumnya.';
    END IF;

    -- Syarat BR-06: Periode ditutup berurutan
    IF EXISTS (
        SELECT 1
        FROM periode
        WHERE status = 'terbuka'
          AND (tahun < v_periode.tahun OR (tahun = v_periode.tahun AND bulan < v_periode.bulan))
    ) THEN
        RAISE EXCEPTION 'Periode sebelumnya harus sudah ditutup terlebih dahulu (BR-06).';
    END IF;

    -- Syarat BR-06: Hanya bila tidak ada jurnal draf di periode itu
    IF EXISTS (
        SELECT 1
        FROM jurnal
        WHERE periode_id = p_periode_id AND status = 'draf'
    ) THEN
        RAISE EXCEPTION 'Tidak dapat menutup periode: masih terdapat jurnal draf yang belum diposting atau dihapus (BR-06).';
    END IF;

    UPDATE periode
    SET status = 'ditutup',
        ditutup_oleh = v_operator_id,
        ditutup_pada = now()
    WHERE id = p_periode_id
    RETURNING * INTO v_periode;

    RETURN v_periode;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION tutup_periode(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION tutup_periode(BIGINT) FROM anon;
GRANT EXECUTE ON FUNCTION tutup_periode(BIGINT) TO authenticated, service_role;

-- ==============================================================================
-- 4. BUKA_KEMBALI_PERIODE (Murni auth.uid())
-- ==============================================================================
CREATE OR REPLACE FUNCTION buka_kembali_periode(
    p_periode_id BIGINT,
    p_alasan TEXT
)
RETURNS periode AS $$
DECLARE
    v_periode periode%ROWTYPE;
    v_operator_profile profiles%ROWTYPE;
    v_operator_id UUID;
BEGIN
    -- Identitas operator murni dari auth.uid()
    v_operator_id := auth.uid();
    IF v_operator_id IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: Pengguna belum terautentikasi (auth.uid() kosong).';
    END IF;

    SELECT * INTO v_operator_profile FROM profiles WHERE id = v_operator_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profil pengguna tidak ditemukan.';
    END IF;

    IF NOT v_operator_profile.aktif THEN
        RAISE EXCEPTION 'Akun pengguna sedang dinonaktifkan (BR-12).';
    END IF;

    IF v_operator_profile.peran <> 'direktur' THEN
        RAISE EXCEPTION 'Hanya Direktur yang berhak membuka kembali periode (BR-06).';
    END IF;

    IF length(trim(COALESCE(p_alasan, ''))) < 20 THEN
        RAISE EXCEPTION 'Alasan pembukaan kembali periode wajib diisi minimal 20 karakter (BR-06).';
    END IF;

    -- Kunci baris periode target dengan FOR UPDATE
    SELECT * INTO v_periode
    FROM periode
    WHERE id = p_periode_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Periode dengan ID % tidak ditemukan.', p_periode_id;
    END IF;

    IF v_periode.status = 'terbuka' THEN
        RAISE EXCEPTION 'Periode akuntansi ini sudah dalam status terbuka.';
    END IF;

    -- Syarat BR-06: Hanya periode terakhir yang ditutup yang boleh dibuka kembali
    IF EXISTS (
        SELECT 1
        FROM periode
        WHERE status = 'ditutup'
          AND (tahun > v_periode.tahun OR (tahun = v_periode.tahun AND bulan > v_periode.bulan))
    ) THEN
        RAISE EXCEPTION 'Hanya periode terakhir yang ditutup yang dapat dibuka kembali (BR-06).';
    END IF;

    UPDATE periode
    SET status = 'terbuka',
        alasan_buka_ulang = p_alasan
    WHERE id = p_periode_id
    RETURNING * INTO v_periode;

    RETURN v_periode;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION buka_kembali_periode(BIGINT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION buka_kembali_periode(BIGINT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION buka_kembali_periode(BIGINT, TEXT) TO authenticated, service_role;

-- ==============================================================================
-- 5. TRANSISI_STATUS_PENGAJUAN (Murni auth.uid())
-- ==============================================================================
CREATE OR REPLACE FUNCTION transisi_status_pengajuan(
    p_pengajuan_id BIGINT,
    p_status_baru status_pengajuan,
    p_catatan TEXT DEFAULT NULL
)
RETURNS pengajuan AS $$
DECLARE
    v_pengajuan pengajuan%ROWTYPE;
    v_operator_profile profiles%ROWTYPE;
    v_pengaju_profile profiles%ROWTYPE;
    v_akun_beban akun%ROWTYPE;
    v_operator_id UUID;
BEGIN
    -- Identitas operator murni dari auth.uid()
    v_operator_id := auth.uid();
    IF v_operator_id IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: Pengguna belum terautentikasi (auth.uid() kosong).';
    END IF;

    SELECT * INTO v_operator_profile FROM profiles WHERE id = v_operator_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profil operator tidak ditemukan.';
    END IF;

    IF NOT v_operator_profile.aktif THEN
        RAISE EXCEPTION 'Akun operator sedang dinonaktifkan (BR-12).';
    END IF;

    -- Kunci baris pengajuan FOR UPDATE
    SELECT * INTO v_pengajuan
    FROM pengajuan
    WHERE id = p_pengajuan_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pengajuan dengan ID % tidak ditemukan.', p_pengajuan_id;
    END IF;

    SELECT * INTO v_pengaju_profile FROM profiles WHERE id = v_pengajuan.pengaju_id;

    -- Izinkan perubahan status melewati trigger guard
    PERFORM set_config('app.allow_status_transition', 'true', true);

    -- ==========================================================================
    -- VALIDASI SELURUH ATURAN BR-07 SAAT MENGIRIM (draf/perlu_revisi -> diajukan/menunggu_direktur)
    -- ==========================================================================
    IF v_pengajuan.status IN ('draf', 'perlu_revisi') AND p_status_baru IN ('diajukan', 'menunggu_direktur') THEN
        IF v_operator_id <> v_pengajuan.pengaju_id THEN
            RAISE EXCEPTION 'Hanya pemilik yang dapat mengirimkan pengajuan miliknya (Tabel 6.1).';
        END IF;

        -- 1. Nilai Rp10.000 sampai Rp25.000.000 bulat (BR-07)
        IF v_pengajuan.jumlah < 10000 OR v_pengajuan.jumlah > 25000000 THEN
            RAISE EXCEPTION 'Jumlah pengajuan harus bernilai Rp10.000 sampai Rp25.000.000 (BR-07).';
        END IF;

        -- 2. Keperluan minimal 10 karakter (BR-07)
        IF length(trim(COALESCE(v_pengajuan.keterangan, ''))) < 10 THEN
            RAISE EXCEPTION 'Keperluan pengajuan minimal 10 karakter (BR-07).';
        END IF;

        -- 3. Akun beban harus aktif dan bertipe beban (BR-07)
        SELECT * INTO v_akun_beban FROM akun WHERE id = v_pengajuan.akun_beban_id;
        IF NOT FOUND OR v_akun_beban.tipe <> 'beban' OR NOT v_akun_beban.aktif THEN
            RAISE EXCEPTION 'Pengajuan wajib memakai akun beban yang aktif (BR-07).';
        END IF;

        -- 4. Tanggal transaksi tidak boleh di masa depan (BR-07)
        IF v_pengajuan.tanggal_transaksi > CURRENT_DATE THEN
            RAISE EXCEPTION 'Tanggal transaksi tidak boleh di masa depan (BR-07).';
        END IF;

        -- 5. Tanggal transaksi paling lama 30 hari sebelum pengajuan dikirim (termasuk kirim ulang) (BR-07)
        IF v_pengajuan.tanggal_transaksi < (CURRENT_DATE - INTERVAL '30 days')::DATE THEN
            RAISE EXCEPTION 'Tanggal transaksi paling lama 30 hari sebelum tanggal pengajuan dikirim (BR-07).';
        END IF;

        -- 6. Bukti nota wajib diunggah (BR-07)
        IF v_pengajuan.bukti_path IS NULL OR length(trim(v_pengajuan.bukti_path)) = 0 THEN
            RAISE EXCEPTION 'Bukti nota wajib diunggah sebelum pengajuan dikirim (BR-07).';
        END IF;

        -- Jalur alur status berdasarkan peran pengaju (BR-09)
        IF v_pengaju_profile.peran = 'akuntan' AND p_status_baru = 'diajukan' THEN
            RAISE EXCEPTION 'Pengajuan milik Akuntan harus langsung menuju status menunggu_direktur (BR-09).';
        END IF;

        IF v_pengaju_profile.peran = 'staf' AND p_status_baru = 'menunggu_direktur' THEN
            RAISE EXCEPTION 'Pengajuan Staf harus melalui verifikasi Akuntan (status diajukan) (BR-08).';
        END IF;

        UPDATE pengajuan
        SET status = p_status_baru,
            diajukan_pada = now(),
            catatan_peninjau = NULL
        WHERE id = p_pengajuan_id
        RETURNING * INTO v_pengajuan;

        RETURN v_pengajuan;

    -- draf / perlu_revisi -> dibatalkan
    ELSIF v_pengajuan.status IN ('draf', 'perlu_revisi') AND p_status_baru = 'dibatalkan' THEN
        IF v_operator_id <> v_pengajuan.pengaju_id THEN
            RAISE EXCEPTION 'Hanya pengaju yang berhak membatalkan pengajuan miliknya (BR-08).';
        END IF;

        UPDATE pengajuan
        SET status = 'dibatalkan'
        WHERE id = p_pengajuan_id
        RETURNING * INTO v_pengajuan;

        RETURN v_pengajuan;

    -- diajukan -> disetujui (Akuntan verifikasi nilai <= 1.000.000)
    ELSIF v_pengajuan.status = 'diajukan' AND p_status_baru = 'disetujui' THEN
        IF v_operator_profile.peran <> 'akuntan' THEN
            RAISE EXCEPTION 'Hanya Akuntan yang dapat memverifikasi pengajuan berstatus diajukan (BR-08).';
        END IF;

        IF v_operator_id = v_pengajuan.pengaju_id THEN
            RAISE EXCEPTION 'Akuntan dilarang memverifikasi pengajuannya sendiri (BR-09).';
        END IF;

        IF v_pengajuan.jumlah > 1000000 THEN
            RAISE EXCEPTION 'Pengajuan di atas Rp1.000.000 wajib diteruskan ke Direktur (BR-08).';
        END IF;

        UPDATE pengajuan
        SET status = 'disetujui',
            diverifikasi_oleh = v_operator_id,
            diverifikasi_pada = now(),
            catatan_peninjau = NULL
        WHERE id = p_pengajuan_id
        RETURNING * INTO v_pengajuan;

        RETURN v_pengajuan;

    -- diajukan -> menunggu_direktur (Akuntan verifikasi nilai > 1.000.000)
    ELSIF v_pengajuan.status = 'diajukan' AND p_status_baru = 'menunggu_direktur' THEN
        IF v_operator_profile.peran <> 'akuntan' THEN
            RAISE EXCEPTION 'Hanya Akuntan yang dapat memverifikasi pengajuan berstatus diajukan (BR-08).';
        END IF;

        IF v_operator_id = v_pengajuan.pengaju_id THEN
            RAISE EXCEPTION 'Akuntan dilarang memverifikasi pengajuannya sendiri (BR-09).';
        END IF;

        IF v_pengajuan.jumlah <= 1000000 THEN
            RAISE EXCEPTION 'Pengajuan sampai dengan Rp1.000.000 langsung disetujui oleh Akuntan (BR-08).';
        END IF;

        UPDATE pengajuan
        SET status = 'menunggu_direktur',
            diverifikasi_oleh = v_operator_id,
            diverifikasi_pada = now(),
            catatan_peninjau = NULL
        WHERE id = p_pengajuan_id
        RETURNING * INTO v_pengajuan;

        RETURN v_pengajuan;

    -- diajukan -> perlu_revisi / ditolak
    ELSIF v_pengajuan.status = 'diajukan' AND p_status_baru IN ('perlu_revisi', 'ditolak') THEN
        IF v_operator_profile.peran <> 'akuntan' THEN
            RAISE EXCEPTION 'Hanya Akuntan yang dapat memproses pengajuan berstatus diajukan.';
        END IF;

        IF v_operator_id = v_pengajuan.pengaju_id THEN
            RAISE EXCEPTION 'Dilarang memproses pengajuan milik sendiri (BR-09).';
        END IF;

        IF length(trim(COALESCE(p_catatan, ''))) < 10 THEN
            RAISE EXCEPTION 'Meminta revisi atau menolak wajib disertai catatan minimal 10 karakter (BR-08).';
        END IF;

        UPDATE pengajuan
        SET status = p_status_baru,
            catatan_peninjau = p_catatan,
            diverifikasi_oleh = v_operator_id,
            diverifikasi_pada = now()
        WHERE id = p_pengajuan_id
        RETURNING * INTO v_pengajuan;

        RETURN v_pengajuan;

    -- menunggu_direktur -> disetujui (Direktur menyetujui)
    ELSIF v_pengajuan.status = 'menunggu_direktur' AND p_status_baru = 'disetujui' THEN
        IF v_operator_profile.peran <> 'direktur' THEN
            RAISE EXCEPTION 'Hanya Direktur yang berhak menyetujui pengajuan ini (BR-08).';
        END IF;

        IF v_operator_id = v_pengajuan.pengaju_id THEN
            RAISE EXCEPTION 'Dilarang menyetujui pengajuan milik sendiri (BR-09).';
        END IF;

        UPDATE pengajuan
        SET status = 'disetujui',
            disetujui_oleh = v_operator_id,
            disetujui_pada = now(),
            catatan_peninjau = NULL
        WHERE id = p_pengajuan_id
        RETURNING * INTO v_pengajuan;

        RETURN v_pengajuan;

    -- menunggu_direktur -> perlu_revisi / ditolak
    ELSIF v_pengajuan.status = 'menunggu_direktur' AND p_status_baru IN ('perlu_revisi', 'ditolak') THEN
        IF v_operator_profile.peran <> 'direktur' THEN
            RAISE EXCEPTION 'Hanya Direktur yang berhak memproses pengajuan ini.';
        END IF;

        IF v_operator_id = v_pengajuan.pengaju_id THEN
            RAISE EXCEPTION 'Dilarang memproses pengajuan milik sendiri (BR-09).';
        END IF;

        IF length(trim(COALESCE(p_catatan, ''))) < 10 THEN
            RAISE EXCEPTION 'Meminta revisi atau menolak wajib disertai catatan minimal 10 karakter (BR-08).';
        END IF;

        UPDATE pengajuan
        SET status = p_status_baru,
            catatan_peninjau = p_catatan,
            disetujui_oleh = v_operator_id,
            disetujui_pada = now()
        WHERE id = p_pengajuan_id
        RETURNING * INTO v_pengajuan;

        RETURN v_pengajuan;

    ELSIF p_status_baru = 'dibayar' THEN
        RAISE EXCEPTION 'Pembayaran pengajuan wajib dilakukan melalui function resmi bayar_pengajuan() (BR-10).';

    ELSE
        RAISE EXCEPTION 'Transisi status pengajuan dari "%" ke "%" tidak diizinkan oleh sistem (Tabel 6.1 PRD).',
            v_pengajuan.status, p_status_baru;
    END IF;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION transisi_status_pengajuan(BIGINT, status_pengajuan, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION transisi_status_pengajuan(BIGINT, status_pengajuan, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION transisi_status_pengajuan(BIGINT, status_pengajuan, TEXT) TO authenticated, service_role;

-- ==============================================================================
-- 6. BAYAR_PENGAJUAN (Murni auth.uid())
-- ==============================================================================
CREATE OR REPLACE FUNCTION bayar_pengajuan(
    p_pengajuan_id BIGINT,
    p_akun_kas_id BIGINT,
    p_tanggal_bayar DATE
)
RETURNS pengajuan AS $$
DECLARE
    v_pengajuan pengajuan%ROWTYPE;
    v_kas_akun akun%ROWTYPE;
    v_periode periode%ROWTYPE;
    v_operator_profile profiles%ROWTYPE;
    v_operator_id UUID;
    v_saldo_kas BIGINT;
    v_jurnal_id BIGINT;
    v_tahun INT;
    v_bulan INT;
BEGIN
    -- Identitas operator murni dari auth.uid()
    v_operator_id := auth.uid();
    IF v_operator_id IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: Pengguna belum terautentikasi (auth.uid() kosong).';
    END IF;

    SELECT * INTO v_operator_profile FROM profiles WHERE id = v_operator_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profil operator tidak ditemukan.';
    END IF;

    IF NOT v_operator_profile.aktif THEN
        RAISE EXCEPTION 'Akun operator sedang dinonaktifkan (BR-12).';
    END IF;

    IF v_operator_profile.peran <> 'akuntan' THEN
        RAISE EXCEPTION 'Hanya Akuntan yang berhak melakukan pembayaran pengajuan (BR-10).';
    END IF;

    v_tahun := EXTRACT(YEAR FROM p_tanggal_bayar)::INT;
    v_bulan := EXTRACT(MONTH FROM p_tanggal_bayar)::INT;

    -- 1. Kunci baris pengajuan FOR UPDATE (mencegah klik ganda)
    SELECT * INTO v_pengajuan
    FROM pengajuan
    WHERE id = p_pengajuan_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pengajuan dengan ID % tidak ditemukan.', p_pengajuan_id;
    END IF;

    IF v_pengajuan.status <> 'disetujui' THEN
        RAISE EXCEPTION 'Pengajuan tidak dapat dibayar karena berstatus: %. Hanya status disetujui yang dapat dibayar (BR-10).',
            v_pengajuan.status;
    END IF;

    -- 2. Kunci akun kas/bank FOR UPDATE
    SELECT * INTO v_kas_akun
    FROM akun
    WHERE id = p_akun_kas_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Akun kas/bank dengan ID % tidak ditemukan.', p_akun_kas_id;
    END IF;

    IF NOT v_kas_akun.is_kas_bank THEN
        RAISE EXCEPTION 'Akun % (%) bukan akun kas atau bank yang valid (BR-10).',
            v_kas_akun.kode, v_kas_akun.nama;
    END IF;

    IF NOT v_kas_akun.aktif THEN
        RAISE EXCEPTION 'Akun kas/bank % (%) sedang dinonaktifkan (BR-10).',
            v_kas_akun.kode, v_kas_akun.nama;
    END IF;

    -- 3. Cek periode tanggal pembayaran (BR-05)
    SELECT * INTO v_periode
    FROM periode
    WHERE tahun = v_tahun AND bulan = v_bulan
    FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Periode akuntansi untuk tanggal bayar (%) belum dibuat.', p_tanggal_bayar;
    END IF;

    IF v_periode.status <> 'terbuka' THEN
        RAISE EXCEPTION 'Tanggal bayar berada di periode akuntansi yang sudah ditutup (BR-05).';
    END IF;

    -- 4. Hitung saldo kas/bank mencakup jurnal berstatus 'diposting' DAN 'dibalik' (c)
    SELECT COALESCE(SUM(jb.debit) - SUM(jb.kredit), 0)
    INTO v_saldo_kas
    FROM jurnal_baris jb
    JOIN jurnal j ON j.id = jb.jurnal_id
    WHERE jb.akun_id = p_akun_kas_id AND j.status IN ('diposting', 'dibalik');

    IF v_saldo_kas < v_pengajuan.jumlah THEN
        RAISE EXCEPTION 'Pembayaran ditolak: saldo akun % (%) sebesar Rp % tidak mencukupi untuk pembayaran Rp % (BR-10).',
            v_kas_akun.kode, v_kas_akun.nama, v_saldo_kas, v_pengajuan.jumlah;
    END IF;

    -- 5. Buat jurnal pembayaran dengan sumber = 'pengajuan' (j)
    INSERT INTO jurnal (
        tanggal,
        periode_id,
        keterangan,
        sumber,
        status,
        pengajuan_id,
        dibuat_oleh
    ) VALUES (
        p_tanggal_bayar,
        v_periode.id,
        'Pembayaran Pengajuan ' || COALESCE(v_pengajuan.nomor, '') || ': ' || v_pengajuan.keterangan,
        'pengajuan',
        'draf',
        p_pengajuan_id,
        v_operator_id
    ) RETURNING id INTO v_jurnal_id;

    -- Baris 1: Debit Akun Beban
    INSERT INTO jurnal_baris (jurnal_id, urutan, akun_id, debit, kredit, keterangan)
    VALUES (v_jurnal_id, 1, v_pengajuan.akun_beban_id, v_pengajuan.jumlah, 0, v_pengajuan.keterangan);

    -- Baris 2: Kredit Akun Kas/Bank
    INSERT INTO jurnal_baris (jurnal_id, urutan, akun_id, debit, kredit, keterangan)
    VALUES (v_jurnal_id, 2, p_akun_kas_id, 0, v_pengajuan.jumlah, 'Kas Keluar Pengajuan ' || COALESCE(v_pengajuan.nomor, ''));

    -- 6. Posting otomatis jurnal pembayaran
    PERFORM posting_jurnal(v_jurnal_id);

    -- 7. Update status pengajuan menjadi dibayar
    PERFORM set_config('app.allow_status_transition', 'true', true);

    UPDATE pengajuan
    SET status = 'dibayar',
        akun_kas_id = p_akun_kas_id,
        dibayar_oleh = v_operator_id,
        dibayar_pada = now()
    WHERE id = p_pengajuan_id
    RETURNING * INTO v_pengajuan;

    RETURN v_pengajuan;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION bayar_pengajuan(BIGINT, BIGINT, DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION bayar_pengajuan(BIGINT, BIGINT, DATE) FROM anon;
GRANT EXECUTE ON FUNCTION bayar_pengajuan(BIGINT, BIGINT, DATE) TO authenticated, service_role;
