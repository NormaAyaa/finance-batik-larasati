# Deteksi Pengajuan Duplikat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan sistem deteksi pengajuan duplikat di modul Pengajuan CV Batik Larasati menggunakan hash berkas nota SHA-256 (duplikat pasti) dan pencocokan tanggal + nominal (duplikat kemungkinan), memblokir tombol Kirim untuk duplikat pasti, dan menyediakan konfirmasi untuk duplikat kemungkinan.

**Architecture:** 
1. Client-side hashing berkas bukti nota menggunakan Web Crypto API (`window.crypto.subtle.digest("SHA-256")`).
2. Kolom `bukti_hash` dengan indeks B-tree pada tabel database `pengajuan`.
3. Server Action `cekDuplikatPengajuanAction` yang patuh RLS dan hanya membaca data aktif (`status != 'ditolak'`) milik pengguna yang terautentikasi.
4. Komponen `PengajuanForm` menampilkan banner peringatan kontekstual, memblokir pengiriman pada duplikat pasti, dan mewajibkan centang konfirmasi pada duplikat kemungkinan.
5. Unit test komprehensif menggunakan test runner bawaan Node (`node:test`).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Supabase PostgreSQL, Web Crypto API, Node.js native test runner (`node:test`).

## Global Constraints
- Jangan membaca atau mencetak isi berkas `.env.local`.
- Migrasi Supabase baru tidak boleh mengubah berkas migrasi lama.
- Kolom `bukti_hash` pada tabel `pengajuan` menggunakan indeks biasa (BUKAN unique constraint).
- Server Action hanya boleh membaca data milik pengguna sendiri (`pengaju_id = auth.uid()`) dan mematuhi RLS.
- Status 'ditolak' tidak boleh dianggap sebagai duplikat aktif.
- Mode edit harus mendukung `excludeId` agar pengajuan tidak mendeteksi dirinya sendiri sebagai duplikat.
- Validasi TypeScript (`npx tsc --noEmit`), test (`npm test`), dan lint (`npm run lint`) harus lolos tanpa error.

---

### Task 1: Skema Database & Migrasi Supabase

**Files:**
- Create: `supabase/migrations/20261028000011_add_bukti_hash_pengajuan.sql`
- Modify: `src/types/database.ts:163-225`

- [ ] **Step 1: Buat berkas migrasi Supabase baru**
Tambahkan kolom `bukti_hash TEXT` dan indeks `idx_pengajuan_bukti_hash` pada tabel `pengajuan`.

```sql
ALTER TABLE pengajuan
ADD COLUMN IF NOT EXISTS bukti_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_pengajuan_bukti_hash ON pengajuan(bukti_hash);

COMMENT ON COLUMN pengajuan.bukti_hash IS 'Hash SHA-256 berkas bukti nota/kuitansi untuk deteksi pengajuan duplikat.';
```

- [ ] **Step 2: Jalankan migrasi ke Supabase remote DB**
Terapkan migrasi menggunakan MCP `apply_migration` ke project `hwhclcuurljbkoihinuj`.

- [ ] **Step 3: Perbarui tipe database di `src/types/database.ts`**
Tambahkan kolom `bukti_hash` pada `pengajuan.Row`, `pengajuan.Insert`, dan `pengajuan.Update`.

---

### Task 2: Modul Inti & Logika Pencocokan Duplikat + Unit Test

**Files:**
- Create: `src/lib/pengajuan/duplikat.ts`
- Create: `tests/cek-duplikat.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Tulis tes unit gagal di `tests/cek-duplikat.test.ts`**
Uji skenario:
1. Duplikat pasti: `bukti_hash` cocok.
2. Duplikat kemungkinan: `tanggal_transaksi` dan `jumlah` cocok.
3. Prioritas: `bukti_hash` cocok mengalahkan `kemungkinan`.
4. Pengajuan dengan status `'ditolak'` diabaikan.
5. Pengajuan dengan `id === excludeId` diabaikan (mode ubah/edit).
6. Pengajuan dari `pengaju_id` berbeda diabaikan.
7. Tidak ada kecocokan mengembalikan `isDuplikat: false`.
8. Format teks pesan peringatan untuk UI.

- [ ] **Step 2: Jalankan tes untuk memastikan gagal (TDD)**
Jalankan: `npx --yes tsx --test tests/cek-duplikat.test.ts`
Ekspektasi: Gagal karena modul `src/lib/pengajuan/duplikat.ts` belum ada.

- [ ] **Step 3: Implementasikan logika evaluasi duplikat di `src/lib/pengajuan/duplikat.ts`**
Tulis fungsi:
- `evaluasiDuplikatPengajuan(candidates, params)`
- `formatPeringatanDuplikat(hasil)`
- Definisi tipe: `CekDuplikatPengajuanParams`, `HasilCekDuplikatPengajuan`, `JenisKecocokanDuplikat`.

- [ ] **Step 4: Jalankan tes unit kembali**
Jalankan: `npx --yes tsx --test tests/cek-duplikat.test.ts`
Ekspektasi: Seluruh tes lulus (PASS).

- [ ] **Step 5: Perbarui skrip test dan lint di `package.json`**
Ubah `"test"` menjadi `"npx --yes tsx --test tests/notifikasi-email.test.ts tests/cek-duplikat.test.ts"`.
Ubah `"lint"` menjadi `"eslint ."`.

---

### Task 3: Server Action `cekDuplikatPengajuanAction`

**Files:**
- Modify: `src/app/(dashboard)/pengajuan/actions.ts`

- [ ] **Step 1: Implementasikan `cekDuplikatPengajuanAction`**
- Validasi autentikasi pengguna (`supabase.auth.getUser()`).
- Filter query database ke `pengaju_id = user.id`.
- Abaikan status `ditolak` (`.neq("status", "ditolak")`).
- Abaikan `excludeId` jika disediakan (`.neq("id", excludeId)`).
- Query tahap 1: Jika `buktiHash` ada, cari kecocokan `bukti_hash`. Jika ditemukan, kembalikan duplikat `pasti`.
- Query tahap 2: Jika tidak cocok hash dan `tanggalTransaksi` serta `jumlah` ada, cari kecocokan tanggal & jumlah. Jika ditemukan, kembalikan duplikat `kemungkinan`.
- Kembalikan `isDuplikat: false` jika tidak ada yang cocok.

---

### Task 4: Integrasi Formulir Pengajuan & Halaman Edit

**Files:**
- Modify: `src/components/pengajuan/pengajuan-form.tsx`
- Modify: `src/app/(dashboard)/pengajuan/[id]/ubah/page.tsx`

- [ ] **Step 1: Tambahkan pembacaan `bukti_hash` di `src/app/(dashboard)/pengajuan/[id]/ubah/page.tsx`**
Sertakan `bukti_hash` dalam select query dan kirimkan ke `initialData`.

- [ ] **Step 2: Implementasikan Web Crypto API SHA-256 di `PengajuanForm`**
Fungsi `hitungSha256(file: File): Promise<string>`.
Hitung hash saat file dipilih. Simpan ke state `fileHash`.

- [ ] **Step 3: Panggil pengecekan duplikat**
- Panggil pengecekan saat file selesai dipilih / dihitung hash-nya.
- Panggil pengecekan setelah ekstraksi AI selesai mengisi `tanggal` dan `jumlah`.
- Tampilkan indikator status pengecekan jika sedang memuat.

- [ ] **Step 4: Tambahkan UI Peringatan Duplikat dan Proteksi Submit**
- Jika `jenisKecocokan === "pasti"`:
  - Tampilkan banner merah (rose): *"Nota ini sudah dipakai pada PG-202610-028 (Disetujui)"*.
  - Tombol "Kirim Pengajuan" dinonaktifkan / diblokir.
- Jika `jenisKecocokan === "kemungkinan"`:
  - Tampilkan banner kuning (amber): *"Pengajuan dengan tanggal dan nominal serupa sudah ada pada PG-202610-028 (Disetujui)"*.
  - Sediakan checkbox konfirmasi: *"Saya mengonfirmasi bahwa ini adalah transaksi yang berbeda (bukan pengajuan ganda)"*.
  - Tombol "Kirim Pengajuan" hanya bisa dikirim bila checkbox konfirmasi dicentang.

- [ ] **Step 5: Simpan `bukti_hash` saat create / update**
Sertakan nilai `bukti_hash` pada payload insert pengajuan baru dan update pengajuan yang sudah ada.

---

### Task 5: Verifikasi Menyeluruh & Laporan SQL

- [ ] **Step 1: Jalankan `npm test`**
Pastikan semua tes unit (notifikasi email + cek duplikat) lulus 100%.

- [ ] **Step 2: Jalankan `npx tsc --noEmit`**
Pastikan tidak ada error kompilasi TypeScript.

- [ ] **Step 3: Jalankan `npm run lint`**
Pastikan tidak ada error ESLint.

- [ ] **Step 4: Sajikan instruksi SQL migrasi kepada pengguna**
Cantumkan kode SQL migrasi secara jelas dan transparan.
