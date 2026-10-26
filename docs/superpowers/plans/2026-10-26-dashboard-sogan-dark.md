# Implementasi UI Dashboard "Sogan Obsidian" CV Batik Larasati

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah antarmuka (UI) seluruh layout dashboard dan halaman `/dashboard` CV Batik Larasati menjadi tema gelap mewah "Sogan Obsidian" yang memadukan sidebar ramping bergaya Referensi 2 dengan metrik bento dan grafik bercahaya bergaya Referensi 1, selaras dengan estetika landing page dan mematuhi 100% aturan bisnis di `PRD_Finance.docx`.

**Architecture:** Menerapkan wrapper layout Next.js 16 (App Router) baru berlatar `#070605` dengan komponen sidebar ramping vertikal `w-20` (desktop) berfitur hover tooltip serta bottom bar responsif (mobile). Memperbarui komponen bento metrik, grafik batang SVG 6 bulan, kartu status periode, dan tabel antrean pengajuan agar menggunakan dark glassmorphism bernuansa emas/amber tanpa mengubah kontrak data, hak akses peran, query database Supabase, maupun alur navigasi.

**Tech Stack:** Next.js 16.4.2 (App Router, Turbopack), React 19, Tailwind CSS v4, TypeScript, Supabase SSR.

**Spec:** `docs/superpowers/specs/2026-10-26-dashboard-sogan-dark-design.md`

## Global Constraints

- Warna latar belakang utama adalah `#070605` (Sogan Obsidian) serasi dengan landing page.
- Aturan PRD BR-11 wajib dipatuhi: Staf HANYA melihat pengajuan miliknya, tidak boleh memuat saldo kas/bank, jurnal, laba rugi, maupun laporan keuangan.
- Aturan PRD BR-06 wajib dipatuhi: Penutupan periode memerlukan 0 draf jurnal; peringatan draf jurnal tetap tampil pada kartu periode.
- Aturan PRD Seksi 9 wajib dipatuhi: Angka negatif pada laba (rugi) bersih wajib ditampilkan dalam tanda kurung `(Rp...)`.
- Tombol Keluar wajib menggunakan form method POST ke `/auth/keluar` sesuai mekanisme autentikasi Supabase.
- Penyesuaian tampilan tidak boleh merusak fungsionalitas cetak/unduh PDF (`@media print` di CSS tetap terjaga).

## Review Focus

1. **Role Access Integrity (Staf vs Akuntan vs Direktur)**: Pengguna dengan peran staf yang membuka `/dashboard` tidak boleh melihat metrik kas/bank atau grafik keuangan umum.
2. **Negative Value Representation**: Angka laba (rugi) negatif (seperti bulan September pada data uji) wajib diformat dengan tanda kurung `(Rp 4.625.000)` bukan `-Rp 4.625.000`.
3. **Form Logout POST**: Tombol keluar di sidebar ramping harus tetap memicu submit form POST ke `/auth/keluar` tanpa terhambat styling `w-20` atau z-index.
4. **Mobile Responsiveness**: Pengguna di layar kecil (<768px) tetap dapat mengakses menu navigasi secara nyaman melalui mobile bar/drawer tanpa overflow horizontal.
5. **Print Stylesheet Isolation**: Memastikan kelas dark mode di layout tidak menimpa aturan `@media print` saat mencetak laporan atau bukti pengajuan.

---

### Task 1: CSS Design Tokens & Utilities "Sogan Obsidian"

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: Utility classes untuk dark glassmorphism card (`.sogan-card`, `.sogan-card-glow`), custom subtle scrollbars, and golden border highlights.

- [ ] **Step 1: Tambahkan utilitas tema Sogan Obsidian di `src/app/globals.css`**
Tambahkan kelas `.sogan-card` (`bg-[#0f0d0b]/85 border border-amber-900/25 rounded-2xl backdrop-blur-md`), `.sogan-card-hover`, scrollbar kustom halus bertema tembaga, dan pastikan blok `@media print` tetap terisolasi.

- [ ] **Step 2: Jalankan build untuk verifikasi CSS**
Run: `npm run build`
Expected: Berhasil dikompilasi tanpa error Turbopack/Tailwind v4.

- [ ] **Step 3: Commit perubahan**
```bash
git add src/app/globals.css
git commit -m "style: tambahkan utilitas tema Sogan Obsidian di globals.css"
```

---

### Task 2: Sidebar Ikonik Ramping (Referensi 2) & Layout Dashboard

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`
- Create (optional client helper if needed for tooltips/active nav): `src/components/layout/sidebar-slim.tsx`

**Interfaces:**
- Consumes: `requireAuth()`, `MAIN_NAVIGATION` dari `@/lib/constants/navigation`
- Produces: Layout wrapper `bg-[#070605]` dengan sidebar ramping `w-20` di desktop dan top context header.

- [ ] **Step 1: Implementasikan komponen navigasi sidebar ramping**
Buat navigasi ikonik vertikal bergaya Referensi 2:
- Monogram Canting Larasati di bagian atas dengan golden ring pendar.
- Ikon SVG elegan untuk setiap menu di `MAIN_NAVIGATION`.
- Efek item aktif: `bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]`.
- Floating hover tooltip yang menampilkan nama menu saat kursor diarahkan ke ikon.
- Bagian bawah: Indikator peran, avatar pengguna, dan tombol keluar form POST `/auth/keluar`.
- Mobile navigation bar di bagian bawah atau drawer ringkas.

- [ ] **Step 2: Perbarui `src/app/(dashboard)/layout.tsx`**
Ganti pembungkus utama dari `bg-slate-50` menjadi `bg-[#070605] text-[#fbf7f0] min-h-screen`. Tambahkan header atas kaca gelap dengan judul halaman, penanda periode aktif, dan waktu WIB.

- [ ] **Step 3: Verifikasi build dan render layout**
Run: `npm run build`
Expected: Build sukses tanpa error TypeScript dan tanpa peringatan hidrasi.

- [ ] **Step 4: Commit perubahan layout**
```bash
git add src/app/\(dashboard\)/layout.tsx src/components/layout/
git commit -m "feat(layout): implementasikan sidebar ramping Referensi 2 dan tema Sogan Obsidian"
```

---

### Task 3: Redesain Bento Kartu Metrik Finansial (`kartu-ringkasan.tsx`)

**Files:**
- Modify: `src/components/dashboard/kartu-ringkasan.tsx`

**Interfaces:**
- Consumes: Props `totalKasBank`, `pendapatanBulanIni`, `bebanBulanIni`, `labaBersihBulanIni`, `kasBankBreakdown`, `persentaseLaba`, `pengajuanMenungguCount`, `targetPeran`
- Produces: 5 kartu bento glassmorphism bergaya Referensi 1 & 2 dengan panah `↗`, breakdown kas/bank, dan format negatif dalam kurung `(Rp...)`.

- [ ] **Step 1: Perbarui komponen `KartuRingkasan`**
- Ubah kontainer dari style putih ke `.sogan-card` berlatar kaca arang gelap dengan border tembaga/amber tipis.
- Terapkan angka besar kontras tinggi (`text-2xl font-bold tracking-tight text-[#fdfaf6]`).
- Terapkan aturan format laba (rugi) negatif dalam kurung: jika nilai < 0, tampilkan `(Rp X.XXX.XXX)` dengan warna rose/amber terang.
- Tambahkan pill badge perubahan bulan lalu dengan panah sudut `↗`.
- Tambahkan kartu ke-5 untuk antrean pengajuan yang menunggu dengan highlight amber bersinar dan shortcut link ke `#antrean-pengajuan`.

- [ ] **Step 2: Verifikasi build**
Run: `npm run build`
Expected: Build sukses tanpa error TypeScript.

- [ ] **Step 3: Commit kartu metrik**
```bash
git add src/components/dashboard/kartu-ringkasan.tsx
git commit -m "feat(dashboard): perbarui kartu ringkasan finansial ke bento dark glass"
```

---

### Task 4: Redesain Grafik Batang Dual-Tone Bercahaya (`grafik-batang.tsx`)

**Files:**
- Modify: `src/components/dashboard/grafik-batang.tsx`

**Interfaces:**
- Consumes: `MonthlyFinancialData[]` (label bulan, pendapatan, beban)
- Produces: Visualisasi grafik batang 6 bulan dengan batang vertikal berpendar (emas vs bronze) dan tooltip gelap.

- [ ] **Step 1: Perbarui komponen `GrafikBatang`**
- Ubah kartu pembungkus menjadi `.sogan-card`.
- Ubah warna batang Pendapatan menjadi gradasi emas menyala (`#f59e0b` ke `#fbbf24`) dengan filter glow lembut.
- Ubah warna batang Beban menjadi gradasi bronze elegan (`#b45309` ke `#d97706`).
- Ubah garis grid latar belakang menjadi abu-abu tembaga sangat redup (`rgba(245, 158, 11, 0.08)`).
- Buat tooltip melayang dengan latar kaca gelap (`bg-[#161310]/95 border border-amber-900/40 text-[#fdfaf6] shadow-xl`).

- [ ] **Step 2: Verifikasi build**
Run: `npm run build`
Expected: Build sukses tanpa error TypeScript.

- [ ] **Step 3: Commit grafik batang**
```bash
git add src/components/dashboard/grafik-batang.tsx
git commit -m "feat(dashboard): perbarui grafik batang 6 bulan dengan tema dual-glow amber bronze"
```

---

### Task 5: Redesain Kartu Status Periode & Tabel Antrean Pengajuan

**Files:**
- Modify: `src/components/dashboard/status-periode-card.tsx`
- Modify: `src/components/dashboard/tabel-pengajuan-menunggu.tsx`

**Interfaces:**
- Consumes: `PeriodeStatusItem[]`, `PengajuanMenungguItem[]`
- Produces: Dark bento status periode card dengan warning draf jurnal & dark glass table pengajuan antrean dengan pill status dan tombol Tinjau.

- [ ] **Step 1: Perbarui `StatusPeriodeCard`**
- Berikan gaya `.sogan-card` beraksen emas.
- Tampilkan badge status periode (`Terbuka` hijau tembaga, `Ditutup` abu-abu gelap).
- Berikan alert khusus bernuansa amber menyala jika terdapat draf jurnal yang belum diposting (mematuhi BR-06).

- [ ] **Step 2: Perbarui `TabelPengajuanMenunggu`**
- Ubah tabel menjadi dark luxury table dengan pembatas baris halus `border-amber-900/20`.
- Terapkan pill status:
  - `diajukan`: amber glow
  - `menunggu_direktur`: purple glow
  - `disetujui`: emerald glow
- Tombol **Tinjau**: Tombol chamfer ramping beraksen emas dengan link ke `/pengajuan/[id]`.

- [ ] **Step 3: Verifikasi build**
Run: `npm run build`
Expected: Build sukses tanpa error TypeScript.

- [ ] **Step 4: Commit status periode dan tabel pengajuan**
```bash
git add src/components/dashboard/status-periode-card.tsx src/components/dashboard/tabel-pengajuan-menunggu.tsx
git commit -m "feat(dashboard): perbarui kartu status periode dan tabel pengajuan antrean ke dark theme"
```

---

### Task 6: Redesain Dashboard Staf Personal (`dashboard-staf.tsx`)

**Files:**
- Modify: `src/components/dashboard/dashboard-staf.tsx`

**Interfaces:**
- Consumes: `namaLengkap`, `jabatan`, `statusCounts`, `recentItems`, `totalSubmissions`
- Produces: Personal dashboard staf bertema Sogan Obsidian tanpa mengekspos data keuangan perusahaan (BR-11).

- [ ] **Step 1: Perbarui komponen `DashboardStaf`**
- Berikan sambutan hangat khas Sogan Batik dengan nama staf dan jabatannya.
- Bento cards funnel pengajuan: Total Pengajuan, Butuh Revisi (dengan aksen rose perhatian), Menunggu Verifikasi, dan Berhasil Dicairkan.
- Tombol aksi utama bercahaya emas: `+ Buat Pengajuan Baru` (menuju `/pengajuan/baru`).
- Tabel 10 pengajuan terakhir milik staf dengan status pill badges dan link ke detail pengajuan.

- [ ] **Step 2: Verifikasi build**
Run: `npm run build`
Expected: Build sukses tanpa error TypeScript.

- [ ] **Step 3: Commit dashboard staf**
```bash
git add src/components/dashboard/dashboard-staf.tsx
git commit -m "feat(dashboard): perbarui dashboard staf ke tema Sogan Obsidian"
```

---

### Task 7: Pengujian Menyeluruh (End-to-End) & Verifikasi PRD

**Files:**
- Review: Semua file yang dimodifikasi

- [ ] **Step 1: Jalankan build produksi Next.js**
Run: `npm run build`
Expected: 100% lulus kompilasi tanpa error atau warning.

- [ ] **Step 2: Validasi aturan PRD & Kepatuhan Bisnis**
- Pastikan format angka laba rugi negatif tetap dalam kurung.
- Pastikan form POST `/auth/keluar` bekerja normal.
- Pastikan aturan hak akses peran tidak berubah (Staf hanya melihat data sendiri).
- Pastikan tampilan responsif pada ukuran desktop dan mobile.

- [ ] **Step 3: Commit final dan penyelesaian**
```bash
git commit -m "chore: finalisasi integrasi tema Sogan Obsidian pada dashboard CV Batik Larasati"
```
