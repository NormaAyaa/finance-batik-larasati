import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Script untuk menghasilkan gambar nota fisik realistis (thermal sales receipt)
 * di atas meja kayu gelap (dark wood desk) dengan detail tajam untuk demo sistem Larasati Finance.
 */
async function generateNotaBaru() {
  const width = 900;
  const height = 1280;

  // Koordinat kertas nota
  const paperX = 175;
  const paperY = 60;
  const paperW = 550;
  const paperH = 1150;

  // Garis bergerigi (jagged edge)
  const zigZagStep = 10;
  let topPath = `M ${paperX} ${paperY}`;
  for (let x = paperX; x < paperX + paperW; x += zigZagStep) {
    topPath += ` L ${x + zigZagStep / 2} ${paperY - 4} L ${x + zigZagStep} ${paperY}`;
  }

  let bottomPath = `L ${paperX + paperW} ${paperY + paperH}`;
  for (let x = paperX + paperW; x > paperX; x -= zigZagStep) {
    bottomPath += ` L ${x - zigZagStep / 2} ${paperY + paperH + 4} L ${x - zigZagStep} ${paperY + paperH}`;
  }

  const paperPathD = `${topPath} ${bottomPath} Z`;

  // Barcode stripes (dummy code 89920261027048)
  const barcodeX = paperX + 165;
  const barcodeY = paperY + 980;
  const barcodePattern = [
    3, 1, 4, 2, 1, 5, 2, 3, 1, 4, 2, 6, 2, 3, 1, 4, 2, 5, 3, 1, 4, 2, 6, 2, 3, 1, 5, 2, 4, 2, 3, 5, 2, 4, 3
  ];
  let curX = barcodeX;
  let barcodeRects = "";
  for (let i = 0; i < barcodePattern.length; i++) {
    const w = barcodePattern[i];
    if (i % 2 === 0) {
      barcodeRects += `<rect x="${curX}" y="${barcodeY}" width="${w}" height="42" fill="#181818" />`;
    }
    curX += w + 2;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <!-- Tekstur meja kayu (wood grain gradient) -->
      <linearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#2c1a10"/>
        <stop offset="25%" stop-color="#3d2417"/>
        <stop offset="50%" stop-color="#2a180e"/>
        <stop offset="75%" stop-color="#402619"/>
        <stop offset="100%" stop-color="#1f1109"/>
      </linearGradient>

      <!-- Radial lighting / vignette -->
      <radialGradient id="vignette" cx="50%" cy="45%" r="65%">
        <stop offset="40%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.75"/>
      </radialGradient>

      <!-- Kertas thermal off-white dengan gradasi halus -->
      <linearGradient id="paperGrad" x1="0%" y1="0%" x2="3%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="50%" stop-color="#fdfcf8"/>
        <stop offset="100%" stop-color="#f9f7f0"/>
      </linearGradient>

      <!-- Bayangan kertas nota (drop shadow) -->
      <filter id="shadow" x="-10%" y="-5%" width="125%" height="115%">
        <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000000" flood-opacity="0.6"/>
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.35"/>
      </filter>
    </defs>

    <!-- 1. Background Meja Kayu -->
    <rect width="${width}" height="${height}" fill="url(#woodGrad)"/>
    
    <!-- Serat kayu halus -->
    <path d="M 0,150 Q 450,165 900,145" stroke="#1d1008" stroke-width="3" opacity="0.4" fill="none"/>
    <path d="M 0,380 Q 450,400 900,370" stroke="#1d1008" stroke-width="4" opacity="0.35" fill="none"/>
    <path d="M 0,650 Q 450,635 900,660" stroke="#1d1008" stroke-width="4" opacity="0.45" fill="none"/>
    <path d="M 0,920 Q 450,940 900,910" stroke="#1d1008" stroke-width="3" opacity="0.4" fill="none"/>
    <path d="M 0,1150 Q 450,1160 900,1140" stroke="#1d1008" stroke-width="4" opacity="0.4" fill="none"/>

    <!-- Vignette meja -->
    <rect width="${width}" height="${height}" fill="url(#vignette)"/>

    <!-- 2. Kertas Nota Fisik dengan Drop Shadow -->
    <path d="${paperPathD}" fill="url(#paperGrad)" filter="url(#shadow)" transform="rotate(-0.35, 450, 600)"/>

    <!-- Grup Konten Teks Nota (dirotasi sedikit mengikuti kertas) -->
    <g transform="rotate(-0.35, 450, 600)" font-family="monospace, Courier, 'Courier New'">
      
      <!-- HEADER TOKO -->
      <text x="${paperX + 275}" y="${paperY + 65}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="22" fill="#111111" text-anchor="middle" letter-spacing="0.5">TOKO BAHAN BATIK &amp; KAIN</text>
      <text x="${paperX + 275}" y="${paperY + 95}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="24" fill="#a0521d" text-anchor="middle" letter-spacing="1">"PRIMA SARI"</text>
      <text x="${paperX + 275}" y="${paperY + 120}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="12" fill="#444444" text-anchor="middle">(Pusat Kain Mori, Lilin Malam &amp; Pewarna Tekstil)</text>
      <text x="${paperX + 275}" y="${paperY + 140}" font-family="Arial, Helvetica, sans-serif" font-size="11.5" fill="#555555" text-anchor="middle">Jl. Suryodiningratan No. 18, Mantrijeron, Yogyakarta</text>
      <text x="${paperX + 275}" y="${paperY + 158}" font-family="Arial, Helvetica, sans-serif" font-size="11" fill="#666666" text-anchor="middle">Telp: (0274) 374982 / WA: 0812-3498-7711</text>

      <!-- JUDUL NOTA -->
      <text x="${paperX + 275}" y="${paperY + 195}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="15" fill="#111111" text-anchor="middle" letter-spacing="1.5">NOTA PENJUALAN TUNAI</text>

      <!-- GARIS PEMBATAS TEBAL -->
      <line x1="${paperX + 30}" y1="${paperY + 210}" x2="${paperX + 520}" y2="${paperY + 210}" stroke="#111111" stroke-width="2"/>

      <!-- METADATA TRANSAKSI -->
      <text x="${paperX + 35}" y="${paperY + 235}" font-size="13" font-weight="bold" fill="#222222">No. Nota  : NOTA-20261027-048</text>
      <text x="${paperX + 35}" y="${paperY + 258}" font-size="13" font-weight="bold" fill="#222222">Tanggal   : 27/10/2026 09:30 WIB</text>
      <text x="${paperX + 35}" y="${paperY + 281}" font-size="12.5" fill="#333333">Kasir     : Dewi Lestari (K-02)</text>
      <text x="${paperX + 35}" y="${paperY + 304}" font-size="12.5" fill="#333333">Pelanggan : CV Batik Larasati (Ibu Rina)</text>

      <!-- GARIS PEMISAH HEADER TABEL -->
      <line x1="${paperX + 30}" y1="${paperY + 320}" x2="${paperX + 520}" y2="${paperY + 320}" stroke="#333333" stroke-width="1.5" stroke-dasharray="4,3"/>

      <!-- HEADER KOLOM -->
      <text x="${paperX + 35}" y="${paperY + 340}" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="bold" fill="#111111">DESKRIPSI BARANG / BAHAN</text>
      <text x="${paperX + 515}" y="${paperY + 340}" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="bold" fill="#111111" text-anchor="end">TOTAL (RP)</text>

      <line x1="${paperX + 30}" y1="${paperY + 352}" x2="${paperX + 520}" y2="${paperY + 352}" stroke="#333333" stroke-width="1.5" stroke-dasharray="4,3"/>

      <!-- ITEM 1: KAIN MORI -->
      <text x="${paperX + 35}" y="${paperY + 380}" font-size="13" font-weight="bold" fill="#111111">1. Kain Mori Primissima Cap Mahkota</text>
      <text x="${paperX + 55}" y="${paperY + 402}" font-size="12" fill="#444444">12 meter @ Rp 35.000 / m</text>
      <text x="${paperX + 515}" y="${paperY + 402}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">420.000</text>

      <!-- ITEM 2: MALAM LILIN BATIK -->
      <text x="${paperX + 35}" y="${paperY + 440}" font-size="13" font-weight="bold" fill="#111111">2. Malam / Lilin Batik Klowong Super</text>
      <text x="${paperX + 55}" y="${paperY + 462}" font-size="12" fill="#444444">2 kg @ Rp 45.000 / kg</text>
      <text x="${paperX + 515}" y="${paperY + 462}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">90.000</text>

      <!-- ITEM 3: PEWARNA REMAZOL -->
      <text x="${paperX + 35}" y="${paperY + 500}" font-size="13" font-weight="bold" fill="#111111">3. Pewarna Batik Remazol (Biru &amp; Kuning)</text>
      <text x="${paperX + 55}" y="${paperY + 522}" font-size="12" fill="#444444">2 botol @ Rp 40.000</text>
      <text x="${paperX + 515}" y="${paperY + 522}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">80.000</text>

      <!-- ITEM 4: CANTING TEMBAGA -->
      <text x="${paperX + 35}" y="${paperY + 560}" font-size="13" font-weight="bold" fill="#111111">4. Canting Tulis Tembaga No. 2 &amp; No. 3</text>
      <text x="${paperX + 55}" y="${paperY + 582}" font-size="12" fill="#444444">2 pcs @ Rp 17.500</text>
      <text x="${paperX + 515}" y="${paperY + 582}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">35.000</text>

      <!-- GARIS PEMISAH SUBTOTAL -->
      <line x1="${paperX + 30}" y1="${paperY + 610}" x2="${paperX + 520}" y2="${paperY + 610}" stroke="#444444" stroke-width="1" stroke-dasharray="3,3"/>

      <!-- RINCIAN SUBTOTAL -->
      <text x="${paperX + 160}" y="${paperY + 635}" font-size="13" fill="#333333">Subtotal</text>
      <text x="${paperX + 330}" y="${paperY + 635}" font-size="13" fill="#333333">:</text>
      <text x="${paperX + 515}" y="${paperY + 635}" font-size="13" fill="#222222" text-anchor="end">Rp 625.000</text>

      <text x="${paperX + 160}" y="${paperY + 658}" font-size="13" fill="#333333">Diskon</text>
      <text x="${paperX + 330}" y="${paperY + 658}" font-size="13" fill="#333333">:</text>
      <text x="${paperX + 515}" y="${paperY + 658}" font-size="13" fill="#222222" text-anchor="end">Rp 0</text>

      <text x="${paperX + 160}" y="${paperY + 681}" font-size="13" fill="#333333">PPN (11%)</text>
      <text x="${paperX + 330}" y="${paperY + 681}" font-size="13" fill="#333333">:</text>
      <text x="${paperX + 515}" y="${paperY + 681}" font-size="13" fill="#666666" text-anchor="end">Termasuk (Rp 0)</text>

      <!-- KOTAK TOTAL AKHIR -->
      <line x1="${paperX + 30}" y1="${paperY + 705}" x2="${paperX + 520}" y2="${paperY + 705}" stroke="#111111" stroke-width="2.5"/>
      <rect x="${paperX + 30}" y="${paperY + 707}" width="490" height="52" fill="#f2efe4" opacity="0.6"/>
      <text x="${paperX + 45}" y="${paperY + 742}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="20" fill="#111111">TOTAL AKHIR</text>
      <text x="${paperX + 505}" y="${paperY + 742}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="24" fill="#111111" text-anchor="end">Rp 625.000</text>
      <line x1="${paperX + 30}" y1="${paperY + 761}" x2="${paperX + 520}" y2="${paperY + 761}" stroke="#111111" stroke-width="2.5"/>

      <!-- TERBILANG -->
      <text x="${paperX + 275}" y="${paperY + 788}" font-size="12" font-style="italic" fill="#333333" text-anchor="middle">(Enam Ratus Dua Puluh Lima Ribu Rupiah)</text>

      <!-- DETAIL PEMBAYARAN -->
      <text x="${paperX + 160}" y="${paperY + 820}" font-size="13" font-weight="bold" fill="#222222">Bayar Tunai (Cash)</text>
      <text x="${paperX + 330}" y="${paperY + 820}" font-size="13" font-weight="bold" fill="#222222">:</text>
      <text x="${paperX + 515}" y="${paperY + 820}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">Rp 650.000</text>

      <text x="${paperX + 160}" y="${paperY + 845}" font-size="13" fill="#333333">Kembali (Change)</text>
      <text x="${paperX + 330}" y="${paperY + 845}" font-size="13" fill="#333333">:</text>
      <text x="${paperX + 515}" y="${paperY + 845}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">Rp 25.000</text>

      <text x="${paperX + 160}" y="${paperY + 870}" font-size="13" fill="#333333">Metode Bayar</text>
      <text x="${paperX + 330}" y="${paperY + 870}" font-size="13" fill="#333333">:</text>
      <text x="${paperX + 515}" y="${paperY + 870}" font-size="13" font-weight="bold" fill="#15803d" text-anchor="end">TUNAI / LUNAS</text>

      <!-- CAP STEMPEL LUNAS (SEMI-TRANSPARAN) -->
      <g transform="translate(${paperX + 340}, ${paperY + 885}) rotate(-12)">
        <rect x="0" y="0" width="135" height="42" rx="6" fill="none" stroke="#dc2626" stroke-width="2.5" opacity="0.68" stroke-dasharray="6,2"/>
        <text x="67" y="27" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="18" fill="#dc2626" text-anchor="middle" letter-spacing="3" opacity="0.75">L U N A S</text>
      </g>

      <!-- GARIS PEMISAH FOOTER -->
      <line x1="${paperX + 30}" y1="${paperY + 945}" x2="${paperX + 520}" y2="${paperY + 945}" stroke="#555555" stroke-width="1" stroke-dasharray="3,3"/>

      <!-- BARCODE -->
      ${barcodeRects}
      <text x="${paperX + 275}" y="${paperY + 1040}" font-size="11.5" letter-spacing="3" fill="#333333" text-anchor="middle">89920261027048</text>

      <!-- FOOTER PESAN -->
      <text x="${paperX + 275}" y="${paperY + 1075}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="11.5" fill="#222222" text-anchor="middle">*** TERIMA KASIH ATAS KUNJUNGAN ANDA ***</text>
      <text x="${paperX + 275}" y="${paperY + 1095}" font-family="Arial, Helvetica, sans-serif" font-size="10.5" fill="#555555" text-anchor="middle">Semoga Sukses Selalu untuk Pengrajin Batik Larasati</text>
      <text x="${paperX + 275}" y="${paperY + 1113}" font-family="Arial, Helvetica, sans-serif" font-size="9.5" font-style="italic" fill="#777777" text-anchor="middle">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</text>
    </g>
  </svg>`;

  const outPathRoot = path.join(process.cwd(), "CONTOH_NOTA_BARU.png");
  const outPathPublic = path.join(process.cwd(), "public", "CONTOH_NOTA_BARU.png");
  const outPathBahanBaku = path.join(process.cwd(), "CONTOH_NOTA_BARU_BAHAN_BAKU.png");

  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 8 })
    .toFile(outPathRoot);

  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 8 })
    .toFile(outPathPublic);

  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 8 })
    .toFile(outPathBahanBaku);

  console.log(`Berhasil membuat nota baru Bahan Baku di:\n1. ${outPathRoot}\n2. ${outPathPublic}\n3. ${outPathBahanBaku}`);

  // Buat juga Nota ke-2: Perlengkapan Kantor / ATK
  await generateNotaATK();
}

async function generateNotaATK() {
  const width = 900;
  const height = 1280;
  const paperX = 175;
  const paperY = 60;
  const paperW = 550;
  const paperH = 1150;

  const zigZagStep = 10;
  let topPath = `M ${paperX} ${paperY}`;
  for (let x = paperX; x < paperX + paperW; x += zigZagStep) {
    topPath += ` L ${x + zigZagStep / 2} ${paperY - 4} L ${x + zigZagStep} ${paperY}`;
  }

  let bottomPath = `L ${paperX + paperW} ${paperY + paperH}`;
  for (let x = paperX + paperW; x > paperX; x -= zigZagStep) {
    bottomPath += ` L ${x - zigZagStep / 2} ${paperY + paperH + 4} L ${x - zigZagStep} ${paperY + paperH}`;
  }

  const paperPathD = `${topPath} ${bottomPath} Z`;

  const barcodeX = paperX + 165;
  const barcodeY = paperY + 980;
  const barcodePattern = [
    2, 2, 4, 1, 3, 4, 2, 3, 1, 5, 2, 4, 3, 2, 1, 5, 2, 4, 3, 1, 4, 3, 5, 2, 3, 2, 4, 2, 3, 4, 2, 5, 3
  ];
  let curX = barcodeX;
  let barcodeRects = "";
  for (let i = 0; i < barcodePattern.length; i++) {
    const w = barcodePattern[i];
    if (i % 2 === 0) {
      barcodeRects += `<rect x="${curX}" y="${barcodeY}" width="${w}" height="42" fill="#181818" />`;
    }
    curX += w + 2;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="deskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="40%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#090d16"/>
      </linearGradient>

      <radialGradient id="vignetteDesk" cx="50%" cy="45%" r="65%">
        <stop offset="40%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.8"/>
      </radialGradient>

      <linearGradient id="paperGrad2" x1="0%" y1="0%" x2="3%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="50%" stop-color="#fafaf7"/>
        <stop offset="100%" stop-color="#f5f3eb"/>
      </linearGradient>

      <filter id="shadow2" x="-10%" y="-5%" width="125%" height="115%">
        <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000000" flood-opacity="0.65"/>
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.4"/>
      </filter>
    </defs>

    <rect width="${width}" height="${height}" fill="url(#deskGrad)"/>
    <rect width="${width}" height="${height}" fill="url(#vignetteDesk)"/>

    <path d="${paperPathD}" fill="url(#paperGrad2)" filter="url(#shadow2)" transform="rotate(0.3, 450, 600)"/>

    <g transform="rotate(0.3, 450, 600)" font-family="monospace, Courier, 'Courier New'">
      <!-- HEADER TOKO -->
      <text x="${paperX + 275}" y="${paperY + 65}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="22" fill="#111111" text-anchor="middle" letter-spacing="0.5">TOKO BUKU &amp; ATK</text>
      <text x="${paperX + 275}" y="${paperY + 95}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="24" fill="#0284c7" text-anchor="middle" letter-spacing="1">"SUBUR MAKMUR"</text>
      <text x="${paperX + 275}" y="${paperY + 120}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="12" fill="#444444" text-anchor="middle">(Pusat Perlengkapan Alat Tulis &amp; Operasional Kantor)</text>
      <text x="${paperX + 275}" y="${paperY + 140}" font-family="Arial, Helvetica, sans-serif" font-size="11.5" fill="#555555" text-anchor="middle">Jl. Malioboro No. 64, Danurejan, Yogyakarta</text>
      <text x="${paperX + 275}" y="${paperY + 158}" font-family="Arial, Helvetica, sans-serif" font-size="11" fill="#666666" text-anchor="middle">Telp: (0274) 554321 / WA: 0819-8765-4321</text>

      <text x="${paperX + 275}" y="${paperY + 195}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="15" fill="#111111" text-anchor="middle" letter-spacing="1.5">NOTA KASIR PEMBELIAN</text>

      <line x1="${paperX + 30}" y1="${paperY + 210}" x2="${paperX + 520}" y2="${paperY + 210}" stroke="#111111" stroke-width="2"/>

      <text x="${paperX + 35}" y="${paperY + 235}" font-size="13" font-weight="bold" fill="#222222">No. Struk : SMK-20261027-019</text>
      <text x="${paperX + 35}" y="${paperY + 258}" font-size="13" font-weight="bold" fill="#222222">Tanggal   : 27/10/2026 14:10 WIB</text>
      <text x="${paperX + 35}" y="${paperY + 281}" font-size="12.5" fill="#333333">Kasir     : Hendra Kurniawan</text>
      <text x="${paperX + 35}" y="${paperY + 304}" font-size="12.5" fill="#333333">Pelanggan : CV Batik Larasati (Rina)</text>

      <line x1="${paperX + 30}" y1="${paperY + 320}" x2="${paperX + 520}" y2="${paperY + 320}" stroke="#333333" stroke-width="1.5" stroke-dasharray="4,3"/>

      <text x="${paperX + 35}" y="${paperY + 340}" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="bold" fill="#111111">NAMA BARANG PERLENGKAPAN</text>
      <text x="${paperX + 515}" y="${paperY + 340}" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="bold" fill="#111111" text-anchor="end">TOTAL (RP)</text>

      <line x1="${paperX + 30}" y1="${paperY + 352}" x2="${paperX + 520}" y2="${paperY + 352}" stroke="#333333" stroke-width="1.5" stroke-dasharray="4,3"/>

      <!-- ITEM 1: KERTAS HVS -->
      <text x="${paperX + 35}" y="${paperY + 380}" font-size="13" font-weight="bold" fill="#111111">1. Kertas HVS PaperOne A4 80gr</text>
      <text x="${paperX + 55}" y="${paperY + 402}" font-size="12" fill="#444444">2 Rim @ Rp 55.000 / rim</text>
      <text x="${paperX + 515}" y="${paperY + 402}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">110.000</text>

      <!-- ITEM 2: TINTA EPSON -->
      <text x="${paperX + 35}" y="${paperY + 440}" font-size="13" font-weight="bold" fill="#111111">2. Tinta Printer Epson 003 Black Original</text>
      <text x="${paperX + 55}" y="${paperY + 462}" font-size="12" fill="#444444">1 Botol @ Rp 75.000</text>
      <text x="${paperX + 515}" y="${paperY + 462}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">75.000</text>

      <!-- ITEM 3: LAKBAN PACKING -->
      <text x="${paperX + 35}" y="${paperY + 500}" font-size="13" font-weight="bold" fill="#111111">3. Lakban Cokelat Packing Fragile Daimaru</text>
      <text x="${paperX + 55}" y="${paperY + 522}" font-size="12" fill="#444444">2 Roll @ Rp 15.000</text>
      <text x="${paperX + 515}" y="${paperY + 522}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">30.000</text>

      <!-- ITEM 4: PULPEN & MAP -->
      <text x="${paperX + 35}" y="${paperY + 560}" font-size="13" font-weight="bold" fill="#111111">4. Pulpen Gel Joyko &amp; Stopmap Folio (1 Pack)</text>
      <text x="${paperX + 55}" y="${paperY + 582}" font-size="12" fill="#444444">1 Pack Bundling</text>
      <text x="${paperX + 515}" y="${paperY + 582}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">25.000</text>

      <line x1="${paperX + 30}" y1="${paperY + 610}" x2="${paperX + 520}" y2="${paperY + 610}" stroke="#444444" stroke-width="1" stroke-dasharray="3,3"/>

      <text x="${paperX + 160}" y="${paperY + 635}" font-size="13" fill="#333333">Subtotal</text>
      <text x="${paperX + 330}" y="${paperY + 635}" font-size="13" fill="#333333">:</text>
      <text x="${paperX + 515}" y="${paperY + 635}" font-size="13" fill="#222222" text-anchor="end">Rp 240.000</text>

      <text x="${paperX + 160}" y="${paperY + 658}" font-size="13" fill="#333333">Diskon Member</text>
      <text x="${paperX + 330}" y="${paperY + 658}" font-size="13" fill="#333333">:</text>
      <text x="${paperX + 515}" y="${paperY + 658}" font-size="13" fill="#16a34a" text-anchor="end">- Rp 15.000</text>

      <text x="${paperX + 160}" y="${paperY + 681}" font-size="13" fill="#333333">PPN (11%)</text>
      <text x="${paperX + 330}" y="${paperY + 681}" font-size="13" fill="#333333">:</text>
      <text x="${paperX + 515}" y="${paperY + 681}" font-size="13" fill="#666666" text-anchor="end">Termasuk (Rp 0)</text>

      <line x1="${paperX + 30}" y1="${paperY + 705}" x2="${paperX + 520}" y2="${paperY + 705}" stroke="#111111" stroke-width="2.5"/>
      <rect x="${paperX + 30}" y="${paperY + 707}" width="490" height="52" fill="#eff6ff" opacity="0.6"/>
      <text x="${paperX + 45}" y="${paperY + 742}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="20" fill="#111111">TOTAL AKHIR</text>
      <text x="${paperX + 505}" y="${paperY + 742}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="24" fill="#111111" text-anchor="end">Rp 225.000</text>
      <line x1="${paperX + 30}" y1="${paperY + 761}" x2="${paperX + 520}" y2="${paperY + 761}" stroke="#111111" stroke-width="2.5"/>

      <text x="${paperX + 275}" y="${paperY + 788}" font-size="12" font-style="italic" fill="#333333" text-anchor="middle">(Dua Ratus Dua Puluh Lima Ribu Rupiah)</text>

      <text x="${paperX + 160}" y="${paperY + 820}" font-size="13" font-weight="bold" fill="#222222">Bayar Tunai (Cash)</text>
      <text x="${paperX + 330}" y="${paperY + 820}" font-size="13" font-weight="bold" fill="#222222">:</text>
      <text x="${paperX + 515}" y="${paperY + 820}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">Rp 250.000</text>

      <text x="${paperX + 160}" y="${paperY + 845}" font-size="13" fill="#333333">Kembali (Change)</text>
      <text x="${paperX + 330}" y="${paperY + 845}" font-size="13" fill="#333333">:</text>
      <text x="${paperX + 515}" y="${paperY + 845}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">Rp 25.000</text>

      <text x="${paperX + 160}" y="${paperY + 870}" font-size="13" fill="#333333">Metode Bayar</text>
      <text x="${paperX + 330}" y="${paperY + 870}" font-size="13" fill="#333333">:</text>
      <text x="${paperX + 515}" y="${paperY + 870}" font-size="13" font-weight="bold" fill="#15803d" text-anchor="end">TUNAI / LUNAS</text>

      <g transform="translate(${paperX + 340}, ${paperY + 885}) rotate(-8)">
        <rect x="0" y="0" width="135" height="42" rx="6" fill="none" stroke="#15803d" stroke-width="2.5" opacity="0.72" stroke-dasharray="6,2"/>
        <text x="67" y="27" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="18" fill="#15803d" text-anchor="middle" letter-spacing="3" opacity="0.8">L U N A S</text>
      </g>

      <line x1="${paperX + 30}" y1="${paperY + 945}" x2="${paperX + 520}" y2="${paperY + 945}" stroke="#555555" stroke-width="1" stroke-dasharray="3,3"/>

      ${barcodeRects}
      <text x="${paperX + 275}" y="${paperY + 1040}" font-size="11.5" letter-spacing="3" fill="#333333" text-anchor="middle">89920261027019</text>

      <text x="${paperX + 275}" y="${paperY + 1075}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="11.5" fill="#222222" text-anchor="middle">*** TERIMA KASIH TELAH BERBELANJA ***</text>
      <text x="${paperX + 275}" y="${paperY + 1095}" font-family="Arial, Helvetica, sans-serif" font-size="10.5" fill="#555555" text-anchor="middle">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</text>
      <text x="${paperX + 275}" y="${paperY + 1113}" font-family="Arial, Helvetica, sans-serif" font-size="9.5" font-style="italic" fill="#777777" text-anchor="middle">Simpan struk ini sebagai bukti pembayaran yang sah</text>
    </g>
  </svg>`;

  const outPathATK = path.join(process.cwd(), "CONTOH_NOTA_BARU_ATK.png");
  const outPathATKPublic = path.join(process.cwd(), "public", "CONTOH_NOTA_BARU_ATK.png");

  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 8 })
    .toFile(outPathATK);

  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 8 })
    .toFile(outPathATKPublic);

  console.log(`Berhasil membuat nota baru ATK di:\n1. ${outPathATK}\n2. ${outPathATKPublic}`);
}

generateNotaBaru().catch((err) => {
  console.error("Gagal membuat nota:", err);
  process.exit(1);
});
