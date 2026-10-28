-- ==============================================================================
-- Migration: 20261028000011_add_bukti_hash_pengajuan.sql
-- Proyek: Finance & Accounting UMKM (CV Batik Larasati)
-- Deskripsi: Menambahkan kolom bukti_hash dan indeks untuk deteksi pengajuan duplikat
-- ==============================================================================

-- 1. Tambah kolom bukti_hash pada tabel pengajuan (tanpa unique constraint)
ALTER TABLE pengajuan
ADD COLUMN IF NOT EXISTS bukti_hash TEXT;

-- 2. Buat indeks B-Tree pada kolom bukti_hash untuk performa pencarian duplikasi
CREATE INDEX IF NOT EXISTS idx_pengajuan_bukti_hash ON pengajuan(bukti_hash);

COMMENT ON COLUMN pengajuan.bukti_hash IS 'Hash SHA-256 berkas bukti nota/kuitansi untuk deteksi pengajuan duplikat.';
