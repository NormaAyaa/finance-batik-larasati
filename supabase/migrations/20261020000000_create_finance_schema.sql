-- ==============================================================================
-- Migration: 20261020000000_create_finance_schema.sql
-- Proyek: Finance & Accounting UMKM (CV Batik Larasati)
-- Deskripsi: Pembuatan skema database inti (8 tabel, enum, foreign keys, unique, dan check constraints)
-- Catatan: Belum ada RLS (Row Level Security) sesuai instruksi.
-- ==============================================================================

-- ==============================================================================
-- 1. ENUM TYPES
-- ==============================================================================

-- Peran pengguna sistem (PRD 3, ERD)
CREATE TYPE peran_pengguna AS ENUM (
    'staf',
    'akuntan',
    'direktur'
);

-- Status pembukuan periode bulanan (PRD 4 BR-06, ERD)
CREATE TYPE status_periode AS ENUM (
    'terbuka',
    'ditutup'
);

-- Tipe klasifikasi bagan akun (PRD 4 BR-01, ERD)
CREATE TYPE tipe_akun AS ENUM (
    'aset',
    'kewajiban',
    'ekuitas',
    'pendapatan',
    'beban'
);

-- Jenis pengajuan pengeluaran karyawan (PRD 5 US-01, ERD)
CREATE TYPE jenis_pengajuan AS ENUM (
    'reimburse',
    'pengeluaran'
);

-- Alur status siklus hidup pengajuan (PRD 6.1, ERD)
CREATE TYPE status_pengajuan AS ENUM (
    'draf',
    'diajukan',
    'perlu_revisi',
    'menunggu_direktur',
    'disetujui',
    'ditolak',
    'dibayar',
    'dibatalkan'
);

-- Status jurnal umum (PRD 6.2, ERD)
CREATE TYPE status_jurnal AS ENUM (
    'draf',
    'diposting',
    'dibalik'
);

-- Sumber pencatatan jurnal (ERD)
CREATE TYPE sumber_jurnal AS ENUM (
    'manual',
    'pembayaran_pengajuan',
    'pembalik'
);

-- ==============================================================================
-- 2. TABEL PROFILES (Pengguna)
-- ==============================================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama_lengkap TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    peran peran_pengguna NOT NULL DEFAULT 'staf',
    jabatan TEXT NOT NULL,
    aktif BOOLEAN NOT NULL DEFAULT true,
    dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Validasi data string tidak boleh kosong
    CONSTRAINT chk_profiles_nama_lengkap CHECK (length(trim(nama_lengkap)) > 0),
    CONSTRAINT chk_profiles_jabatan CHECK (length(trim(jabatan)) > 0)
);

COMMENT ON TABLE profiles IS 'Profil pengguna internal CV Batik Larasati yang terhubung ke auth.users';

-- ==============================================================================
-- 3. TABEL PENOMORAN (Counter Nomor Dokumen Otomatis)
-- ==============================================================================
CREATE TABLE penomoran (
    jenis TEXT NOT NULL,
    tahun INT NOT NULL,
    bulan INT NOT NULL,
    nomor_terakhir INT NOT NULL DEFAULT 0,

    PRIMARY KEY (jenis, tahun, bulan),
    CONSTRAINT chk_penomoran_jenis CHECK (jenis IN ('JU', 'PG')),
    CONSTRAINT chk_penomoran_bulan CHECK (bulan BETWEEN 1 AND 12),
    CONSTRAINT chk_penomoran_nomor_terakhir CHECK (nomor_terakhir >= 0)
);

COMMENT ON TABLE penomoran IS 'Pencatat nomor urut terakhir per jenis dokumen per bulan (BR-03)';

-- ==============================================================================
-- 4. TABEL PERIODE (Periode Akuntansi Bulanan)
-- ==============================================================================
CREATE TABLE periode (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tahun INT NOT NULL,
    bulan INT NOT NULL,
    tanggal_mulai DATE NOT NULL,
    status status_periode NOT NULL DEFAULT 'terbuka',
    ditutup_oleh UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ditutup_pada TIMESTAMPTZ,
    alasan_buka_ulang TEXT,

    -- Satu periode hanya ada satu per kombinasi tahun dan bulan
    CONSTRAINT uq_periode_tahun_bulan UNIQUE (tahun, bulan),

    -- Validasi bulan kalender 1 s.d. 12
    CONSTRAINT chk_periode_bulan CHECK (bulan BETWEEN 1 AND 12),

    -- BR-06: Saat periode ditutup, pencatat penutupan (ditutup_oleh & ditutup_pada) wajib tercatat
    CONSTRAINT chk_periode_status_tutup CHECK (
        status = 'terbuka' OR (ditutup_oleh IS NOT NULL AND ditutup_pada IS NOT NULL)
    ),

    -- BR-06: Direktur wajib menulis alasan minimal 20 karakter jika periode dibuka kembali
    CONSTRAINT chk_periode_alasan_buka_ulang CHECK (
        alasan_buka_ulang IS NULL OR length(trim(alasan_buka_ulang)) >= 20
    )
);

COMMENT ON TABLE periode IS 'Periode akuntansi bulanan untuk penguncian jurnal (BR-05, BR-06)';

-- ==============================================================================
-- 5. TABEL AKUN (Bagan Akun / Chart of Accounts)
-- ==============================================================================
CREATE TABLE akun (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kode TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    tipe tipe_akun NOT NULL,
    saldo_normal TEXT NOT NULL,
    is_kas_bank BOOLEAN NOT NULL DEFAULT false,
    aktif BOOLEAN NOT NULL DEFAULT true,
    keterangan TEXT,

    -- BR-01: Kode akun wajib 4 digit (digit pertama 1-5)
    CONSTRAINT chk_akun_kode_format CHECK (kode ~ '^[1-5][0-9]{3}$'),

    -- BR-01: Digit pertama kode wajib sinkron dengan klasifikasi tipe
    CONSTRAINT chk_akun_kode_tipe_match CHECK (
        (substr(kode, 1, 1) = '1' AND tipe = 'aset') OR
        (substr(kode, 1, 1) = '2' AND tipe = 'kewajiban') OR
        (substr(kode, 1, 1) = '3' AND tipe = 'ekuitas') OR
        (substr(kode, 1, 1) = '4' AND tipe = 'pendapatan') OR
        (substr(kode, 1, 1) = '5' AND tipe = 'beban')
    ),

    -- Nilai saldo normal hanya boleh debit atau kredit
    CONSTRAINT chk_akun_saldo_normal_nilai CHECK (saldo_normal IN ('debit', 'kredit')),

    -- BR-01: Aset & beban bersaldo normal debit; kewajiban, ekuitas & pendapatan bersaldo normal kredit
    CONSTRAINT chk_akun_saldo_normal_tipe CHECK (
        ((tipe IN ('aset', 'beban')) AND saldo_normal = 'debit') OR
        ((tipe IN ('kewajiban', 'ekuitas', 'pendapatan')) AND saldo_normal = 'kredit')
    ),

    -- Hanya akun aset yang boleh ditandai sebagai akun kas atau bank
    CONSTRAINT chk_akun_is_kas_bank CHECK (NOT is_kas_bank OR tipe = 'aset'),

    -- Nama akun tidak boleh string kosong
    CONSTRAINT chk_akun_nama CHECK (length(trim(nama)) > 0)
);

COMMENT ON TABLE akun IS 'Bagan akun 4 digit untuk klasifikasi transaksi (BR-01)';

-- ==============================================================================
-- 6. TABEL PENGAJUAN (Pengajuan Biaya & Reimburse)
-- ==============================================================================
CREATE TABLE pengajuan (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nomor TEXT UNIQUE,
    pengaju_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    jenis jenis_pengajuan NOT NULL,
    tanggal_transaksi DATE NOT NULL,
    akun_beban_id BIGINT NOT NULL REFERENCES akun(id) ON DELETE RESTRICT,
    jumlah BIGINT NOT NULL,
    keterangan TEXT NOT NULL,
    bukti_path TEXT,
    status status_pengajuan NOT NULL DEFAULT 'draf',
    catatan_peninjau TEXT,
    diverifikasi_oleh UUID REFERENCES profiles(id) ON DELETE SET NULL,
    disetujui_oleh UUID REFERENCES profiles(id) ON DELETE SET NULL,
    akun_kas_id BIGINT REFERENCES akun(id) ON DELETE RESTRICT,
    dibayar_oleh UUID REFERENCES profiles(id) ON DELETE SET NULL,
    dibayar_pada TIMESTAMPTZ,

    -- BR-03: Format nomor pengajuan PG-YYYYMM-XXXX (null saat masih draf)
    CONSTRAINT chk_pengajuan_nomor_format CHECK (
        nomor IS NULL OR nomor ~ '^PG-[0-9]{6}-[0-9]{4}$'
    ),

    -- BR-07: Nilai pengajuan wajib Rp10.000 sampai Rp25.000.000 (bilangan bulat rupiah)
    CONSTRAINT chk_pengajuan_jumlah CHECK (jumlah >= 10000 AND jumlah <= 25000000),

    -- BR-07: Keperluan / keterangan minimal 10 karakter
    CONSTRAINT chk_pengajuan_keterangan CHECK (length(trim(keterangan)) >= 10),

    -- BR-07: Bukti nota wajib diunggah sebelum dikirim (wajib ada jika bukan draf)
    CONSTRAINT chk_pengajuan_bukti_wajib CHECK (
        status = 'draf' OR (bukti_path IS NOT NULL AND length(trim(bukti_path)) > 0)
    ),

    -- BR-08: Meminta revisi atau menolak wajib disertai catatan minimal 10 karakter
    CONSTRAINT chk_pengajuan_catatan_peninjau CHECK (
        status NOT IN ('perlu_revisi', 'ditolak') OR 
        (catatan_peninjau IS NOT NULL AND length(trim(catatan_peninjau)) >= 10)
    ),

    -- BR-09: Pengaju dilarang memverifikasi pengajuannya sendiri
    CONSTRAINT chk_pengajuan_anti_self_verification CHECK (
        diverifikasi_oleh IS NULL OR diverifikasi_oleh <> pengaju_id
    ),

    -- BR-09: Pengaju dilarang menyetujui pengajuannya sendiri
    CONSTRAINT chk_pengajuan_anti_self_approval CHECK (
        disetujui_oleh IS NULL OR disetujui_oleh <> pengaju_id
    ),

    -- BR-10: Saat status dibayar, akun kas/bank, pembayar, dan waktu bayar wajib terisi
    CONSTRAINT chk_pengajuan_data_bayar CHECK (
        status <> 'dibayar' OR 
        (akun_kas_id IS NOT NULL AND dibayar_oleh IS NOT NULL AND dibayar_pada IS NOT NULL)
    )
);

COMMENT ON TABLE pengajuan IS 'Pengajuan biaya dan reimburse karyawan CV Batik Larasati (BR-07 s.d. BR-10)';

-- ==============================================================================
-- 7. TABEL JURNAL (Jurnal Umum)
-- ==============================================================================
CREATE TABLE jurnal (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nomor TEXT UNIQUE,
    tanggal DATE NOT NULL,
    periode_id BIGINT NOT NULL REFERENCES periode(id) ON DELETE RESTRICT,
    keterangan TEXT NOT NULL,
    sumber sumber_jurnal NOT NULL DEFAULT 'manual',
    status status_jurnal NOT NULL DEFAULT 'draf',
    pengajuan_id BIGINT UNIQUE REFERENCES pengajuan(id) ON DELETE SET NULL,
    jurnal_dibalik_id BIGINT UNIQUE REFERENCES jurnal(id) ON DELETE RESTRICT,
    dibuat_oleh UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    diposting_oleh UUID REFERENCES profiles(id) ON DELETE SET NULL,
    diposting_pada TIMESTAMPTZ,

    -- BR-03: Draf belum memiliki nomor; Jurnal diposting/dibalik wajib memiliki nomor JU-YYYYMM-XXXX serta info posting
    CONSTRAINT chk_jurnal_posting_rules CHECK (
        (status = 'draf' AND nomor IS NULL) OR
        (status IN ('diposting', 'dibalik') AND nomor ~ '^JU-[0-9]{6}-[0-9]{4}$' AND diposting_oleh IS NOT NULL AND diposting_pada IS NOT NULL)
    ),

    -- BR-04: Referensi jurnal_dibalik_id hanya boleh diisi jika sumbernya adalah 'pembalik'
    CONSTRAINT chk_jurnal_pembalik_sumber CHECK (
        jurnal_dibalik_id IS NULL OR sumber = 'pembalik'
    ),

    -- BR-04: Jurnal pembayaran pengajuan tidak bisa dibalik
    CONSTRAINT chk_jurnal_pembayaran_tidak_dibalik CHECK (
        sumber <> 'pembayaran_pengajuan' OR jurnal_dibalik_id IS NULL
    ),

    -- Keterangan jurnal tidak boleh kosong
    CONSTRAINT chk_jurnal_keterangan CHECK (length(trim(keterangan)) > 0)
);

COMMENT ON TABLE jurnal IS 'Header jurnal umum CV Batik Larasati (BR-02 s.d. BR-05)';

-- ==============================================================================
-- 8. TABEL JURNAL_BARIS (Detail Baris Debit dan Kredit Jurnal)
-- ==============================================================================
CREATE TABLE jurnal_baris (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    jurnal_id BIGINT NOT NULL REFERENCES jurnal(id) ON DELETE CASCADE,
    urutan SMALLINT NOT NULL DEFAULT 1,
    akun_id BIGINT NOT NULL REFERENCES akun(id) ON DELETE RESTRICT,
    debit BIGINT NOT NULL DEFAULT 0,
    kredit BIGINT NOT NULL DEFAULT 0,
    keterangan TEXT,

    -- Urutan baris unik per jurnal
    CONSTRAINT uq_jurnal_baris_urutan UNIQUE (jurnal_id, urutan),

    -- Constraint: Nilai debit tidak boleh negatif
    CONSTRAINT chk_jurnal_baris_debit_nonnegatif CHECK (debit >= 0),

    -- Constraint: Nilai kredit tidak boleh negatif
    CONSTRAINT chk_jurnal_baris_kredit_nonnegatif CHECK (kredit >= 0),

    -- BR-02 & Constraint: Satu baris hanya debit saja atau kredit saja dengan nilai > 0
    CONSTRAINT chk_jurnal_baris_satu_sisi CHECK (
        (debit > 0 AND kredit = 0) OR (debit = 0 AND kredit > 0)
    )
);

COMMENT ON TABLE jurnal_baris IS 'Rincian akun, debit, dan kredit untuk setiap baris jurnal (BR-02)';

-- ==============================================================================
-- 9. TABEL AUDIT_LOG (Jejak Audit Aksi Sensitif)
-- ==============================================================================
CREATE TABLE audit_log (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    waktu TIMESTAMPTZ NOT NULL DEFAULT now(),
    pelaku_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    aksi TEXT NOT NULL,
    nama_tabel TEXT NOT NULL,
    id_data TEXT NOT NULL,
    data_lama JSONB,
    data_baru JSONB,

    CONSTRAINT chk_audit_log_aksi CHECK (length(trim(aksi)) > 0),
    CONSTRAINT chk_audit_log_nama_tabel CHECK (length(trim(nama_tabel)) > 0),
    CONSTRAINT chk_audit_log_id_data CHECK (length(trim(id_data)) > 0)
);

COMMENT ON TABLE audit_log IS 'Pencatatan jejak audit aksi sensitif yang bersifat immutable (BR-12)';

-- ==============================================================================
-- 10. INDEX PERFORMA & FILTERING (PRD 10 Kebutuhan Non-Fungsional)
-- ==============================================================================
CREATE INDEX idx_periode_tahun_bulan ON periode(tahun, bulan);
CREATE INDEX idx_akun_kode ON akun(kode);
CREATE INDEX idx_akun_tipe ON akun(tipe);
CREATE INDEX idx_pengajuan_pengaju ON pengajuan(pengaju_id);
CREATE INDEX idx_pengajuan_status ON pengajuan(status);
CREATE INDEX idx_pengajuan_tanggal ON pengajuan(tanggal_transaksi);
CREATE INDEX idx_jurnal_periode ON jurnal(periode_id);
CREATE INDEX idx_jurnal_tanggal ON jurnal(tanggal);
CREATE INDEX idx_jurnal_status ON jurnal(status);
CREATE INDEX idx_jurnal_baris_jurnal ON jurnal_baris(jurnal_id);
CREATE INDEX idx_jurnal_baris_akun ON jurnal_baris(akun_id);
CREATE INDEX idx_audit_log_pelaku ON audit_log(pelaku_id);
CREATE INDEX idx_audit_log_tabel ON audit_log(nama_tabel);
CREATE INDEX idx_audit_log_waktu ON audit_log(waktu);
