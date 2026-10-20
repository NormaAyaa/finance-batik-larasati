-- ==============================================================================
-- Migration: 20261020000001_functions_and_triggers.sql
-- Proyek: Finance & Accounting UMKM (CV Batik Larasati)
-- Deskripsi: Database Function & Trigger untuk Penomoran, Validasi Posting,
--            Pembalikan Jurnal, Tutup/Buka Periode, Mesin Status Pengajuan,
--            Pembayaran Otomatis, dan Audit Log Otomatis.
-- ==============================================================================

-- ==============================================================================
-- 0. HELPER FUNCTION: MENDAPATKAN USER ID SAAT INI
-- ==============================================================================
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==============================================================================
-- 1. PENOMORAN JU DAN PG TANPA CELAH & AMAN DARI CONCURRENCY (BR-03)
-- ==============================================================================
-- Aturan: Format JU-TahunBulan-NomorUrut atau PG-TahunBulan-NomorUrut.
-- Menggunakan INSERT ... ON CONFLICT DO UPDATE dengan row-level lock pada baris penomoran.
CREATE OR REPLACE FUNCTION generate_nomor_dokumen(
    p_jenis TEXT,
    p_tanggal DATE
)
RETURNS TEXT AS $$
DECLARE
    v_tahun INT;
    v_bulan INT;
    v_tahun_bulan TEXT;
    v_next_val INT;
BEGIN
    IF p_jenis NOT IN ('JU', 'PG') THEN
        RAISE EXCEPTION 'Jenis dokumen tidak valid: %. Hanya JU atau PG yang didukung.', p_jenis;
    END IF;

    v_tahun := EXTRACT(YEAR FROM p_tanggal)::INT;
    v_bulan := EXTRACT(MONTH FROM p_tanggal)::INT;
    v_tahun_bulan := to_char(p_tanggal, 'YYYYMM');

    -- Row-level locking: atomik dan terurut per jenis dokumen, tahun, dan bulan
    INSERT INTO penomoran (jenis, tahun, bulan, nomor_terakhir)
    VALUES (p_jenis, v_tahun, v_bulan, 1)
    ON CONFLICT (jenis, tahun, bulan)
    DO UPDATE SET nomor_terakhir = penomoran.nomor_terakhir + 1
    RETURNING nomor_terakhir INTO v_next_val;

    RETURN p_jenis || '-' || v_tahun_bulan || '-' || lpad(v_next_val::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ==============================================================================
-- 2. POSTING JURNAL UMUM (BR-02, BR-05)
-- ==============================================================================
-- Aturan:
-- - Minimal 2 baris (BR-02)
-- - Total debit = total kredit dan lebih dari 0 (BR-02)
-- - Semua akun yang digunakan harus aktif (BR-01)
-- - Tanggal jurnal berada di periode terbuka (BR-05)
-- - Mendapatkan nomor JU otomatis (BR-03)
CREATE OR REPLACE FUNCTION posting_jurnal(
    p_jurnal_id BIGINT,
    p_user_id UUID DEFAULT NULL
)
RETURNS jurnal AS $$
DECLARE
    v_jurnal jurnal%ROWTYPE;
    v_periode periode%ROWTYPE;
    v_baris_count INT;
    v_total_debit BIGINT;
    v_total_kredit BIGINT;
    v_nomor TEXT;
    v_operator_id UUID;
BEGIN
    v_operator_id := COALESCE(p_user_id, get_current_user_id());

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

    -- 2. Cek periode: Kunci periode dengan FOR SHARE untuk mencegah penutupan periode bersamaan (BR-05)
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

    -- Pastikan tanggal jurnal cocok dengan tahun dan bulan periode
    IF EXTRACT(YEAR FROM v_jurnal.tanggal)::INT <> v_periode.tahun OR
       EXTRACT(MONTH FROM v_jurnal.tanggal)::INT <> v_periode.bulan THEN
        RAISE EXCEPTION 'Tanggal jurnal (%) tidak cocok dengan periode akuntansi (%-%).',
            v_jurnal.tanggal, v_periode.tahun, lpad(v_periode.bulan::TEXT, 2, '0');
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
$$ LANGUAGE plpgsql VOLATILE;

-- ==============================================================================
-- 3. JURNAL DIPOSTING TIDAK BISA DIUBAH/DIHAPUS, PEMBALIK SATU KALI (BR-04)
-- ==============================================================================

-- Trigger: Mencegah perubahan/penghapusan pada jurnal yang sudah diposting
CREATE OR REPLACE FUNCTION trg_prevent_jurnal_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.status <> 'draf' THEN
            RAISE EXCEPTION 'Jurnal yang sudah diposting atau dibalik tidak dapat dihapus oleh siapa pun (BR-04).';
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Jika jurnal sebelumnya sudah diposting / dibalik
        IF OLD.status IN ('diposting', 'dibalik') THEN
            -- Hanya izinkan perpindahan status dari 'diposting' ke 'dibalik' saat pembuatan jurnal pembalik
            IF OLD.status = 'diposting' AND NEW.status = 'dibalik' AND
               NEW.id = OLD.id AND
               NEW.nomor = OLD.nomor AND
               NEW.tanggal = OLD.tanggal AND
               NEW.periode_id = OLD.periode_id AND
               NEW.keterangan = OLD.keterangan AND
               NEW.sumber = OLD.sumber AND
               NEW.dibuat_oleh = OLD.dibuat_oleh AND
               NEW.diposting_oleh = OLD.diposting_oleh AND
               NEW.diposting_pada = OLD.diposting_pada THEN
                RETURN NEW;
            ELSE
                RAISE EXCEPTION 'Jurnal yang sudah diposting tidak dapat diubah datanya oleh siapa pun (BR-04).';
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_jurnal_immutability
BEFORE UPDATE OR DELETE ON jurnal
FOR EACH ROW
EXECUTE FUNCTION trg_prevent_jurnal_modification();

-- Trigger: Mencegah perubahan baris jurnal jika header jurnal sudah diposting
CREATE OR REPLACE FUNCTION trg_prevent_jurnal_baris_modification()
RETURNS TRIGGER AS $$
DECLARE
    v_status status_jurnal;
    v_target_id BIGINT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_target_id := OLD.jurnal_id;
    ELSE
        v_target_id := NEW.jurnal_id;
    END IF;

    SELECT status INTO v_status
    FROM jurnal
    WHERE id = v_target_id;

    IF v_status <> 'draf' THEN
        RAISE EXCEPTION 'Baris jurnal tidak dapat ditambah, diubah, atau dihapus karena jurnal sudah diposting/dibalik (BR-04).';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_jurnal_baris_immutability
BEFORE INSERT OR UPDATE OR DELETE ON jurnal_baris
FOR EACH ROW
EXECUTE FUNCTION trg_prevent_jurnal_baris_modification();

-- Function: Membuat Jurnal Pembalik (BR-04)
CREATE OR REPLACE FUNCTION buat_jurnal_pembalik(
    p_jurnal_id BIGINT,
    p_tanggal_pembalik DATE,
    p_keterangan TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS jurnal AS $$
DECLARE
    v_original jurnal%ROWTYPE;
    v_target_periode periode%ROWTYPE;
    v_pembalik_id BIGINT;
    v_pembalik_jurnal jurnal%ROWTYPE;
    v_operator_id UUID;
    v_tahun INT;
    v_bulan INT;
BEGIN
    v_operator_id := COALESCE(p_user_id, get_current_user_id());
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

    -- Syarat BR-04: Jurnal harus sudah diposting
    IF v_original.status <> 'diposting' THEN
        RAISE EXCEPTION 'Hanya jurnal yang sudah diposting yang dapat dibalik. Status saat ini: %', v_original.status;
    END IF;

    -- Syarat BR-04: Jurnal pembalik dan jurnal pembayaran pengajuan tidak bisa dibalik
    IF v_original.sumber = 'pembalik' THEN
        RAISE EXCEPTION 'Jurnal pembalik tidak dapat dibalik kembali (BR-04).';
    END IF;

    IF v_original.sumber = 'pembayaran_pengajuan' THEN
        RAISE EXCEPTION 'Jurnal pembayaran pengajuan tidak dapat dibalik (BR-04).';
    END IF;

    -- Syarat BR-04: Satu jurnal hanya bisa dibalik satu kali
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

    -- 3. Buat header jurnal pembalik sebagai draf terlebih dahulu
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
        kredit AS debit,  -- Ditukar
        debit AS kredit,  -- Ditukar
        'Pembalik JU ' || COALESCE(v_original.nomor, '') || ': ' || COALESCE(keterangan, '')
    FROM jurnal_baris
    WHERE jurnal_id = p_jurnal_id
    ORDER BY urutan;

    -- 5. Posting jurnal pembalik tersebut
    v_pembalik_jurnal := posting_jurnal(v_pembalik_id, v_operator_id);

    -- 6. Ubah status jurnal asli menjadi 'dibalik' (BR-04)
    UPDATE jurnal
    SET status = 'dibalik'
    WHERE id = p_jurnal_id;

    RETURN v_pembalik_jurnal;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ==============================================================================
-- 4. TUTUP DAN BUKA KEMBALI PERIODE (BR-06)
-- ==============================================================================

-- Function: Tutup Periode (Akuntan)
CREATE OR REPLACE FUNCTION tutup_periode(
    p_periode_id BIGINT,
    p_user_id UUID DEFAULT NULL
)
RETURNS periode AS $$
DECLARE
    v_periode periode%ROWTYPE;
    v_operator_id UUID;
    v_peran peran_pengguna;
BEGIN
    v_operator_id := COALESCE(p_user_id, get_current_user_id());

    -- Validasi peran operator (Hanya Akuntan)
    SELECT peran INTO v_peran FROM profiles WHERE id = v_operator_id;
    IF v_peran <> 'akuntan' THEN
        RAISE EXCEPTION 'Hanya pengguna dengan peran Akuntan yang berhak menutup periode (BR-06).';
    END IF;

    -- Kunci periode target
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

    -- Syarat BR-06: Periode ditutup berurutan (periode sebelumnya harus sudah ditutup)
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

    -- Update status periode
    UPDATE periode
    SET status = 'ditutup',
        ditutup_oleh = v_operator_id,
        ditutup_pada = now()
    WHERE id = p_periode_id
    RETURNING * INTO v_periode;

    RETURN v_periode;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Function: Buka Kembali Periode (Direktur)
CREATE OR REPLACE FUNCTION buka_kembali_periode(
    p_periode_id BIGINT,
    p_alasan TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS periode AS $$
DECLARE
    v_periode periode%ROWTYPE;
    v_operator_id UUID;
    v_peran peran_pengguna;
BEGIN
    v_operator_id := COALESCE(p_user_id, get_current_user_id());

    -- Validasi peran operator (Hanya Direktur)
    SELECT peran INTO v_peran FROM profiles WHERE id = v_operator_id;
    IF v_peran <> 'direktur' THEN
        RAISE EXCEPTION 'Hanya Direktur yang berhak membuka kembali periode (BR-06).';
    END IF;

    -- Validasi alasan minimal 20 karakter
    IF length(trim(COALESCE(p_alasan, ''))) < 20 THEN
        RAISE EXCEPTION 'Alasan pembukaan kembali periode wajib diisi minimal 20 karakter (BR-06).';
    END IF;

    -- Kunci periode target
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

    -- Update status periode menjadi terbuka
    UPDATE periode
    SET status = 'terbuka',
        alasan_buka_ulang = p_alasan
    WHERE id = p_periode_id
    RETURNING * INTO v_periode;

    RETURN v_periode;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ==============================================================================
-- 5. MESIN STATUS PENGAJUAN SESUAI TABEL 6.1 PRD (BR-08, BR-09)
-- ==============================================================================
CREATE OR REPLACE FUNCTION transisi_status_pengajuan(
    p_pengajuan_id BIGINT,
    p_status_baru status_pengajuan,
    p_user_id UUID DEFAULT NULL,
    p_catatan TEXT DEFAULT NULL
)
RETURNS pengajuan AS $$
DECLARE
    v_pengajuan pengajuan%ROWTYPE;
    v_operator_id UUID;
    v_peran_operator peran_pengguna;
    v_peran_pengaju peran_pengguna;
    v_nomor TEXT;
BEGIN
    v_operator_id := COALESCE(p_user_id, get_current_user_id());

    -- Dapatkan peran operator
    SELECT peran INTO v_peran_operator FROM profiles WHERE id = v_operator_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profil pengguna operator tidak ditemukan.';
    END IF;

    -- Kunci baris pengajuan untuk atomisitas alur status
    SELECT * INTO v_pengajuan
    FROM pengajuan
    WHERE id = p_pengajuan_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pengajuan dengan ID % tidak ditemukan.', p_pengajuan_id;
    END IF;

    -- Dapatkan peran pengaju
    SELECT peran INTO v_peran_pengaju FROM profiles WHERE id = v_pengajuan.pengaju_id;

    -- ==========================================================================
    -- EVALUASI PERPINDAHAN STATUS BERDASARKAN TABEL 6.1 PRD
    -- ==========================================================================

    -- 1. draf / perlu_revisi -> diajukan
    IF v_pengajuan.status IN ('draf', 'perlu_revisi') AND p_status_baru = 'diajukan' THEN
        IF v_operator_id <> v_pengajuan.pengaju_id THEN
            RAISE EXCEPTION 'Hanya pengaju yang berhak mengirimkan pengajuan miliknya (Tabel 6.1).';
        END IF;

        IF v_peran_pengaju <> 'staf' THEN
            RAISE EXCEPTION 'Pengajuan milik Akuntan harus langsung menuju status menunggu_direktur (BR-09, Tabel 6.1).';
        END IF;

        IF v_pengajuan.bukti_path IS NULL OR length(trim(v_pengajuan.bukti_path)) = 0 THEN
            RAISE EXCEPTION 'Bukti nota wajib diunggah sebelum pengajuan dikirim (BR-07).';
        END IF;

        -- Generate nomor jika belum ada
        IF v_pengajuan.nomor IS NULL THEN
            v_nomor := generate_nomor_dokumen('PG', v_pengajuan.tanggal_transaksi);
        ELSE
            v_nomor := v_pengajuan.nomor;
        END IF;

        UPDATE pengajuan
        SET status = 'diajukan',
            nomor = v_nomor,
            catatan_peninjau = NULL
        WHERE id = p_pengajuan_id
        RETURNING * INTO v_pengajuan;

        RETURN v_pengajuan;

    -- 2. draf / perlu_revisi -> menunggu_direktur (Milik Akuntan)
    ELSIF v_pengajuan.status IN ('draf', 'perlu_revisi') AND p_status_baru = 'menunggu_direktur' THEN
        IF v_operator_id <> v_pengajuan.pengaju_id THEN
            RAISE EXCEPTION 'Hanya pemilik yang dapat mengirimkan pengajuan ini.';
        END IF;

        IF v_peran_pengaju <> 'akuntan' THEN
            RAISE EXCEPTION 'Pengajuan Staf tidak bisa langsung ke menunggu_direktur tanpa verifikasi Akuntan (Tabel 6.1).';
        END IF;

        IF v_pengajuan.bukti_path IS NULL OR length(trim(v_pengajuan.bukti_path)) = 0 THEN
            RAISE EXCEPTION 'Bukti nota wajib diunggah sebelum pengajuan dikirim (BR-07).';
        END IF;

        IF v_pengajuan.nomor IS NULL THEN
            v_nomor := generate_nomor_dokumen('PG', v_pengajuan.tanggal_transaksi);
        ELSE
            v_nomor := v_pengajuan.nomor;
        END IF;

        UPDATE pengajuan
        SET status = 'menunggu_direktur',
            nomor = v_nomor,
            catatan_peninjau = NULL
        WHERE id = p_pengajuan_id
        RETURNING * INTO v_pengajuan;

        RETURN v_pengajuan;

    -- 3. draf / perlu_revisi -> dibatalkan
    ELSIF v_pengajuan.status IN ('draf', 'perlu_revisi') AND p_status_baru = 'dibatalkan' THEN
        IF v_operator_id <> v_pengajuan.pengaju_id THEN
            RAISE EXCEPTION 'Hanya pengaju yang berhak membatalkan pengajuan miliknya (BR-08, Tabel 6.1).';
        END IF;

        UPDATE pengajuan
        SET status = 'dibatalkan'
        WHERE id = p_pengajuan_id
        RETURNING * INTO v_pengajuan;

        RETURN v_pengajuan;

    -- 4. diajukan -> disetujui (Akuntan verifikasi nilai <= 1.000.000)
    ELSIF v_pengajuan.status = 'diajukan' AND p_status_baru = 'disetujui' THEN
        IF v_peran_operator <> 'akuntan' THEN
            RAISE EXCEPTION 'Hanya Akuntan yang dapat memverifikasi pengajuan berstatus diajukan (BR-08).';
        END IF;

        IF v_operator_id = v_pengajuan.pengaju_id THEN
            RAISE EXCEPTION 'Akuntan dilarang memverifikasi atau menyetujui pengajuannya sendiri (BR-09).';
        END IF;

        IF v_pengajuan.jumlah > 1000000 THEN
            RAISE EXCEPTION 'Pengajuan di atas Rp1.000.000 wajib diteruskan ke Direktur (BR-08).';
        END IF;

        UPDATE pengajuan
        SET status = 'disetujui',
            diverifikasi_oleh = v_operator_id,
            catatan_peninjau = NULL
        WHERE id = p_pengajuan_id
        RETURNING * INTO v_pengajuan;

        RETURN v_pengajuan;

    -- 5. diajukan -> menunggu_direktur (Akuntan verifikasi nilai > 1.000.000)
    ELSIF v_pengajuan.status = 'diajukan' AND p_status_baru = 'menunggu_direktur' THEN
        IF v_peran_operator <> 'akuntan' THEN
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
            catatan_peninjau = NULL
        WHERE id = p_pengajuan_id
        RETURNING * INTO v_pengajuan;

        RETURN v_pengajuan;

    -- 6. diajukan -> perlu_revisi / ditolak (Akuntan meminta revisi / menolak)
    ELSIF v_pengajuan.status = 'diajukan' AND p_status_baru IN ('perlu_revisi', 'ditolak') THEN
        IF v_peran_operator <> 'akuntan' THEN
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
            diverifikasi_oleh = v_operator_id
        WHERE id = p_pengajuan_id
        RETURNING * INTO v_pengajuan;

        RETURN v_pengajuan;

    -- 7. menunggu_direktur -> disetujui (Direktur menyetujui)
    ELSIF v_pengajuan.status = 'menunggu_direktur' AND p_status_baru = 'disetujui' THEN
        IF v_peran_operator <> 'direktur' THEN
            RAISE EXCEPTION 'Hanya Direktur yang berhak menyetujui pengajuan ini (BR-08, Tabel 6.1).';
        END IF;

        IF v_operator_id = v_pengajuan.pengaju_id THEN
            RAISE EXCEPTION 'Dilarang menyetujui pengajuan milik sendiri (BR-09).';
        END IF;

        UPDATE pengajuan
        SET status = 'disetujui',
            disetujui_oleh = v_operator_id,
            catatan_peninjau = NULL
        WHERE id = p_pengajuan_id
        RETURNING * INTO v_pengajuan;

        RETURN v_pengajuan;

    -- 8. menunggu_direktur -> perlu_revisi / ditolak (Direktur menolak / minta revisi)
    ELSIF v_pengajuan.status = 'menunggu_direktur' AND p_status_baru IN ('perlu_revisi', 'ditolak') THEN
        IF v_peran_operator <> 'direktur' THEN
            RAISE EXCEPTION 'Hanya Direktur yang berhak memproses pengajuan ini (Tabel 6.1).';
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
            disetujui_oleh = v_operator_id
        WHERE id = p_pengajuan_id
        RETURNING * INTO v_pengajuan;

        RETURN v_pengajuan;

    -- 9. Status disetujui -> dibayar ditangani secara khusus oleh fungsi bayar_pengajuan()
    ELSIF p_status_baru = 'dibayar' THEN
        RAISE EXCEPTION 'Pembayaran pengajuan wajib dilakukan melalui fungsi bayar_pengajuan() untuk validasi kas dan pembuatan jurnal otomatis (BR-10).';

    ELSE
        RAISE EXCEPTION 'Transisi status pengajuan dari "%" ke "%" tidak diizinkan oleh sistem (Tabel 6.1 PRD).',
            v_pengajuan.status, p_status_baru;
    END IF;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ==============================================================================
-- 6. PEMBAYARAN PENGAJUAN (BR-10)
-- ==============================================================================
-- Aturan:
-- - Hanya Akuntan yang membayar pengajuan berstatus 'disetujui'
-- - Memilih akun kas/bank yang aktif
-- - Cek saldo kas/bank >= jumlah pengajuan (Saldo dihitung dari jurnal terposting)
-- - Dibuatkan tepat satu jurnal umum dan otomatis diposting (Debit: Beban, Kredit: Kas/Bank)
-- - Satu pengajuan hanya bisa dibayar satu kali (aman dari klik ganda bersamaan)
CREATE OR REPLACE FUNCTION bayar_pengajuan(
    p_pengajuan_id BIGINT,
    p_akun_kas_id BIGINT,
    p_tanggal_bayar DATE,
    p_user_id UUID DEFAULT NULL
)
RETURNS pengajuan AS $$
DECLARE
    v_pengajuan pengajuan%ROWTYPE;
    v_kas_akun akun%ROWTYPE;
    v_periode periode%ROWTYPE;
    v_operator_id UUID;
    v_peran_operator peran_pengguna;
    v_saldo_kas BIGINT;
    v_jurnal_id BIGINT;
    v_tahun INT;
    v_bulan INT;
BEGIN
    v_operator_id := COALESCE(p_user_id, get_current_user_id());
    v_tahun := EXTRACT(YEAR FROM p_tanggal_bayar)::INT;
    v_bulan := EXTRACT(MONTH FROM p_tanggal_bayar)::INT;

    -- 1. Validasi peran operator (Hanya Akuntan)
    SELECT peran INTO v_peran_operator FROM profiles WHERE id = v_operator_id;
    IF v_peran_operator <> 'akuntan' THEN
        RAISE EXCEPTION 'Hanya Akuntan yang dapat melakukan pembayaran pengajuan (BR-10).';
    END IF;

    -- 2. Kunci baris pengajuan FOR UPDATE (mencegah double-payment saat klik ganda)
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

    -- 3. Kunci akun kas/bank FOR UPDATE untuk serialisasi kalkulasi saldo kas
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

    -- 4. Validasi periode akuntansi untuk tanggal pembayaran (BR-05)
    SELECT * INTO v_periode
    FROM periode
    WHERE tahun = v_tahun AND bulan = v_bulan
    FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Periode akuntansi untuk tanggal bayar (%) belum dibuat.', p_tanggal_bayar;
    END IF;

    IF v_periode.status <> 'terbuka' THEN
        RAISE EXCEPTION 'Tanggal bayar berada di periode akuntansi yang sudah ditutup (BR-05, BR-10).';
    END IF;

    -- 5. Hitung saldo kas/bank dari seluruh baris jurnal yang sudah diposting (PRD 8)
    -- Akun kas/bank bertipe aset (saldo normal debit), saldo = Total Debit - Total Kredit
    SELECT COALESCE(SUM(jb.debit) - SUM(jb.kredit), 0)
    INTO v_saldo_kas
    FROM jurnal_baris jb
    JOIN jurnal j ON j.id = jb.jurnal_id
    WHERE jb.akun_id = p_akun_kas_id AND j.status = 'diposting';

    IF v_saldo_kas < v_pengajuan.jumlah THEN
        RAISE EXCEPTION 'Pembayaran ditolak: saldo akun % (%) sebesar Rp % tidak mencukupi untuk pembayaran Rp % (BR-10).',
            v_kas_akun.kode, v_kas_akun.nama, v_saldo_kas, v_pengajuan.jumlah;
    END IF;

    -- 6. Otomatis buat jurnal umum pembayaran pengajuan
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
        'pembayaran_pengajuan',
        'draf',
        p_pengajuan_id,
        v_operator_id
    ) RETURNING id INTO v_jurnal_id;

    -- Baris 1: Debit Akun Beban Pengajuan
    INSERT INTO jurnal_baris (jurnal_id, urutan, akun_id, debit, kredit, keterangan)
    VALUES (v_jurnal_id, 1, v_pengajuan.akun_beban_id, v_pengajuan.jumlah, 0, v_pengajuan.keterangan);

    -- Baris 2: Kredit Akun Kas/Bank
    INSERT INTO jurnal_baris (jurnal_id, urutan, akun_id, debit, kredit, keterangan)
    VALUES (v_jurnal_id, 2, p_akun_kas_id, 0, v_pengajuan.jumlah, 'Kas Keluar Pengajuan ' || COALESCE(v_pengajuan.nomor, ''));

    -- 7. Otomatis posting jurnal pembayaran tersebut
    PERFORM posting_jurnal(v_jurnal_id, v_operator_id);

    -- 8. Update status pengajuan menjadi 'dibayar'
    UPDATE pengajuan
    SET status = 'dibayar',
        akun_kas_id = p_akun_kas_id,
        dibayar_oleh = v_operator_id,
        dibayar_pada = now()
    WHERE id = p_pengajuan_id
    RETURNING * INTO v_pengajuan;

    RETURN v_pengajuan;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ==============================================================================
-- 7. AUDIT LOG OTOMATIS (BR-12)
-- ==============================================================================

-- Trigger Function: Merekam aksi sensitif ke tabel audit_log
CREATE OR REPLACE FUNCTION trg_record_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_pelaku_id UUID;
    v_aksi TEXT;
    v_id_data TEXT;
    v_data_lama JSONB := NULL;
    v_data_baru JSONB := NULL;
BEGIN
    v_pelaku_id := get_current_user_id();

    IF TG_OP = 'INSERT' THEN
        v_aksi := 'INSERT';
        v_id_data := NEW.id::TEXT;
        v_data_baru := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_aksi := 'UPDATE';
        v_id_data := NEW.id::TEXT;
        v_data_lama := to_jsonb(OLD);
        v_data_baru := to_jsonb(NEW);

        -- Khusus untuk perubahan status spesifik:
        IF TG_TABLE_NAME = 'jurnal' THEN
            IF OLD.status = 'draf' AND NEW.status = 'diposting' THEN
                v_aksi := 'POSTING_JURNAL';
            ELSIF OLD.status = 'diposting' AND NEW.status = 'dibalik' THEN
                v_aksi := 'PEMBALIKAN_JURNAL';
            END IF;
        ELSIF TG_TABLE_NAME = 'pengajuan' THEN
            IF OLD.status <> NEW.status THEN
                IF NEW.status = 'dibayar' THEN
                    v_aksi := 'PEMBAYARAN_PENGAJUAN';
                ELSE
                    v_aksi := 'PERUBAHAN_STATUS_PENGAJUAN';
                END IF;
            END IF;
        ELSIF TG_TABLE_NAME = 'periode' THEN
            IF OLD.status = 'terbuka' AND NEW.status = 'ditutup' THEN
                v_aksi := 'TUTUP_PERIODE';
            ELSIF OLD.status = 'ditutup' AND NEW.status = 'terbuka' THEN
                v_aksi := 'BUKA_KEMBALI_PERIODE';
            END IF;
        ELSIF TG_TABLE_NAME = 'profiles' THEN
            IF OLD.peran <> NEW.peran OR OLD.aktif <> NEW.aktif THEN
                v_aksi := 'PERUBAHAN_PENGGUNA';
            END IF;
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        v_aksi := 'DELETE';
        v_id_data := OLD.id::TEXT;
        v_data_lama := to_jsonb(OLD);
    END IF;

    INSERT INTO audit_log (
        pelaku_id,
        aksi,
        nama_tabel,
        id_data,
        data_lama,
        data_baru
    ) VALUES (
        v_pelaku_id,
        v_aksi,
        TG_TABLE_NAME,
        v_id_data,
        v_data_lama,
        v_data_baru
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang Trigger Audit Log pada tabel-tabel aksi sensitif (BR-12)
CREATE TRIGGER trg_audit_profiles
AFTER UPDATE ON profiles
FOR EACH ROW
WHEN (OLD.peran IS DISTINCT FROM NEW.peran OR OLD.aktif IS DISTINCT FROM NEW.aktif)
EXECUTE FUNCTION trg_record_audit_log();

CREATE TRIGGER trg_audit_akun
AFTER INSERT OR UPDATE OR DELETE ON akun
FOR EACH ROW
EXECUTE FUNCTION trg_record_audit_log();

CREATE TRIGGER trg_audit_periode
AFTER UPDATE ON periode
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION trg_record_audit_log();

CREATE TRIGGER trg_audit_jurnal
AFTER UPDATE ON jurnal
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION trg_record_audit_log();

CREATE TRIGGER trg_audit_pengajuan
AFTER UPDATE ON pengajuan
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION trg_record_audit_log();

-- Trigger: Immutabilitas Audit Log (BR-12: Tidak bisa diubah atau dihapus oleh siapa pun)
CREATE OR REPLACE FUNCTION trg_prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit log bersifat permanen dan tidak dapat diubah atau dihapus oleh siapa pun (BR-12).';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_log_immutable
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW
EXECUTE FUNCTION trg_prevent_audit_log_tampering();
