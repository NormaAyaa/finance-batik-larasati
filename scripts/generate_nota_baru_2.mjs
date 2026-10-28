import path from "node:path";
import sharp from "sharp";

async function generateNotaWarnaAgung() {
  const width = 900;
  const height = 1280;

  const paperX = 175;
  const paperY = 55;
  const paperW = 550;
  const paperH = 1160;

  // Garis bergerigi (jagged edge)
  const zigZagStep = 10;
  let topPath = `M ${paperX} ${paperY}`;
  for (let x = paperX; x < paperX + paperW; x += zigZagStep) {
    topPath += ` L ${x + zigZagStep / 2} ${paperY - 5} L ${x + zigZagStep} ${paperY}`;
  }

  let bottomPath = `L ${paperX + paperW} ${paperY + paperH}`;
  for (let x = paperX + paperW; x > paperX; x -= zigZagStep) {
    bottomPath += ` L ${x - zigZagStep / 2} ${paperY + paperH + 5} L ${x - zigZagStep} ${paperY + paperH}`;
  }

  const paperPathD = `${topPath} ${bottomPath} Z`;

  // Barcode stripes (89920261027091)
  const barcodeX = paperX + 165;
  const barcodeY = paperY + 990;
  const barcodePattern = [
    3, 2, 4, 1, 3, 5, 2, 3, 2, 4, 1, 6, 2, 3, 2, 4, 1, 5, 3, 2, 4, 1, 5, 2, 4, 1, 5, 3, 4, 1, 3, 4, 2, 4, 3
  ];
  let curX = barcodeX;
  let barcodeRects = "";
  for (let i = 0; i < barcodePattern.length; i++) {
    const w = barcodePattern[i];
    if (i % 2 === 0) {
      barcodeRects += `<rect x="${curX}" y="${barcodeY}" width="${w}" height="42" fill="#151515" />`;
    }
    curX += w + 2;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <!-- Meja marmer / kayu gelap elegan (warm espresso dark oak) -->
      <linearGradient id="deskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#24140b"/>
        <stop offset="30%" stop-color="#341c10"/>
        <stop offset="60%" stop-color="#22130a"/>
        <stop offset="85%" stop-color="#381f12"/>
        <stop offset="100%" stop-color="#180d07"/>
      </linearGradient>

      <radialGradient id="vignette" cx="50%" cy="45%" r="65%">
        <stop offset="35%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.75"/>
      </radialGradient>

      <!-- Kertas thermal putih gading -->
      <linearGradient id="paperGrad" x1="0%" y1="0%" x2="2%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="50%" stop-color="#fdfcf9"/>
        <stop offset="100%" stop-color="#f8f6ee"/>
      </linearGradient>

      <!-- Bayangan kertas nota -->
      <filter id="shadow" x="-10%" y="-5%" width="125%" height="115%">
        <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.62"/>
        <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000000" flood-opacity="0.38"/>
      </filter>
    </defs>

    <!-- 1. Background Meja -->
    <rect width="${width}" height="${height}" fill="url(#deskGrad)"/>
    
    <!-- Serat meja halus -->
    <path d="M 0,180 Q 450,200 900,175" stroke="#140a05" stroke-width="3" opacity="0.4" fill="none"/>
    <path d="M 0,420 Q 450,440 900,410" stroke="#140a05" stroke-width="4" opacity="0.35" fill="none"/>
    <path d="M 0,700 Q 450,685 900,710" stroke="#140a05" stroke-width="4" opacity="0.4" fill="none"/>
    <path d="M 0,960 Q 450,980 900,950" stroke="#140a05" stroke-width="3" opacity="0.35" fill="none"/>

    <rect width="${width}" height="${height}" fill="url(#vignette)"/>

    <!-- 2. Kertas Nota Fisik dengan Drop Shadow (kemiringan natural 0.4 derajat) -->
    <path d="${paperPathD}" fill="url(#paperGrad)" filter="url(#shadow)" transform="rotate(0.4, 450, 600)"/>

    <!-- Grup Konten Nota -->
    <g transform="rotate(0.4, 450, 600)" font-family="monospace, Courier, 'Courier New'">
      
      <!-- HEADER TOKO -->
      <text x="${paperX + 275}" y="${paperY + 65}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="22" fill="#111111" text-anchor="middle" letter-spacing="0.5">TOKO BAHAN BATIK &amp; KIMIA</text>
      <text x="${paperX + 275}" y="${paperY + 95}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="24" fill="#b45309" text-anchor="middle" letter-spacing="1">"WARNA AGUNG JAYA"</text>
      <text x="${paperX + 275}" y="${paperY + 120}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="12" fill="#444444" text-anchor="middle">(Distributor Resmi Pewarna Remazol, Malam &amp; Fiksasi Batik)</text>
      <text x="${paperX + 275}" y="${paperY + 140}" font-family="Arial, Helvetica, sans-serif" font-size="11.5" fill="#555555" text-anchor="middle">Jl. Malioboro No. 88, Sosromenduran, Yogyakarta</text>
      <text x="${paperX + 275}" y="${paperY + 158}" font-family="Arial, Helvetica, sans-serif" font-size="11" fill="#666666" text-anchor="middle">Telp: (0274) 589234 / WhatsApp: 0812-8877-6655</text>

      <!-- JUDUL NOTA -->
      <text x="${paperX + 275}" y="${paperY + 195}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="15" fill="#111111" text-anchor="middle" letter-spacing="1.5">NOTA PENJUALAN RESMI</text>

      <line x1="${paperX + 30}" y1="${paperY + 210}" x2="${paperX + 520}" y2="${paperY + 210}" stroke="#111111" stroke-width="2"/>

      <!-- METADATA TRANSAKSI -->
      <text x="${paperX + 35}" y="${paperY + 235}" font-size="13" font-weight="bold" fill="#222222">No. Faktur : NT-20261027-091</text>
      <text x="${paperX + 35}" y="${paperY + 258}" font-size="13" font-weight="bold" fill="#222222">Tanggal    : 27/10/2026 11:20 WIB</text>
      <text x="${paperX + 35}" y="${paperY + 281}" font-size="12.5" fill="#333333">Kasir      : Bagus Prasetyo</text>
      <text x="${paperX + 35}" y="${paperY + 304}" font-size="12.5" fill="#333333">Pelanggan  : CV Batik Larasati (Rina Anggraini)</text>

      <line x1="${paperX + 30}" y1="${paperY + 320}" x2="${paperX + 520}" y2="${paperY + 320}" stroke="#333333" stroke-width="1.5" stroke-dasharray="4,3"/>

      <!-- HEADER TABEL -->
      <text x="${paperX + 35}" y="${paperY + 340}" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="bold" fill="#111111">RINCIAN BAHAN BAKU PRODUKSI</text>
      <text x="${paperX + 515}" y="${paperY + 340}" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="bold" fill="#111111" text-anchor="end">TOTAL (RP)</text>

      <line x1="${paperX + 30}" y1="${paperY + 352}" x2="${paperX + 520}" y2="${paperY + 352}" stroke="#333333" stroke-width="1.5" stroke-dasharray="4,3"/>

      <!-- ITEM 1: MALAM TEMBOK -->
      <text x="${paperX + 35}" y="${paperY + 380}" font-size="13" font-weight="bold" fill="#111111">1. Malam Lilin Batik Tembok Super</text>
      <text x="${paperX + 55}" y="${paperY + 402}" font-size="12" fill="#444444">3 kg @ Rp 45.000 / kg</text>
      <text x="${paperX + 515}" y="${paperY + 402}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">135.000</text>

      <!-- ITEM 2: PEWARNA REMAZOL -->
      <text x="${paperX + 35}" y="${paperY + 440}" font-size="13" font-weight="bold" fill="#111111">2. Pewarna Remazol Gold Yellow</text>
      <text x="${paperX + 55}" y="${paperY + 462}" font-size="12" fill="#444444">2 botol @ Rp 35.000</text>
      <text x="${paperX + 515}" y="${paperY + 462}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">70.000</text>

      <!-- ITEM 3: WATERGLASS FIKSASI -->
      <text x="${paperX + 35}" y="${paperY + 500}" font-size="13" font-weight="bold" fill="#111111">3. Waterglass Fiksasi Warna Batik</text>
      <text x="${paperX + 55}" y="${paperY + 522}" font-size="12" fill="#444444">5 liter jerigen @ Rp 22.000 / L</text>
      <text x="${paperX + 515}" y="${paperY + 522}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">110.000</text>

      <!-- ITEM 4: CANTING CAP TEMBAGA -->
      <text x="${paperX + 35}" y="${paperY + 560}" font-size="13" font-weight="bold" fill="#111111">4. Canting Cap Tembaga Motif Parang</text>
      <text x="${paperX + 55}" y="${paperY + 582}" font-size="12" fill="#444444">1 pcs cetakan tembaga asli</text>
      <text x="${paperX + 515}" y="${paperY + 582}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">165.000</text>

      <!-- GARIS PEMISAH SUBTOTAL -->
      <line x1="${paperX + 30}" y1="${paperY + 610}" x2="${paperX + 520}" y2="${paperY + 610}" stroke="#444444" stroke-width="1" stroke-dasharray="3,3"/>

      <!-- RINCIAN SUBTOTAL -->
      <text x="${paperX + 160}" y="${paperY + 635}" font-size="13" fill="#333333">Subtotal</text>
      <text x="${paperX + 330}" y="${paperY + 635}" font-size="13" fill="#333333">:</text>
      <text x="${paperX + 515}" y="${paperY + 635}" font-size="13" fill="#222222" text-anchor="end">Rp 480.000</text>

      <text x="${paperX + 160}" y="${paperY + 658}" font-size="13" fill="#333333">Potongan Toko</text>
      <text x="${paperX + 330}" y="${paperY + 658}" font-size="13" fill="#333333">:</text>
      <text x="${paperX + 515}" y="${paperY + 658}" font-size="13" fill="#222222" text-anchor="end">Rp 0</text>

      <text x="${paperX + 160}" y="${paperY + 681}" font-size="13" fill="#333333">PPN (11%)</text>
      <text x="${paperX + 330}" y="${paperY + 681}" font-size="13" fill="#333333">:</text>
      <text x="${paperX + 515}" y="${paperY + 681}" font-size="13" fill="#666666" text-anchor="end">Termasuk (Rp 0)</text>

      <!-- KOTAK TOTAL AKHIR -->
      <line x1="${paperX + 30}" y1="${paperY + 705}" x2="${paperX + 520}" y2="${paperY + 705}" stroke="#111111" stroke-width="2.5"/>
      <rect x="${paperX + 30}" y="${paperY + 707}" width="490" height="52" fill="#fef3c7" opacity="0.6"/>
      <text x="${paperX + 45}" y="${paperY + 742}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="20" fill="#111111">TOTAL AKHIR</text>
      <text x="${paperX + 505}" y="${paperY + 742}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="24" fill="#111111" text-anchor="end">Rp 480.000</text>
      <line x1="${paperX + 30}" y1="${paperY + 761}" x2="${paperX + 520}" y2="${paperY + 761}" stroke="#111111" stroke-width="2.5"/>

      <!-- TERBILANG -->
      <text x="${paperX + 275}" y="${paperY + 788}" font-size="12" font-style="italic" fill="#333333" text-anchor="middle">(Empat Ratus Delapan Puluh Ribu Rupiah)</text>

      <!-- DETAIL PEMBAYARAN -->
      <text x="${paperX + 160}" y="${paperY + 820}" font-size="13" font-weight="bold" fill="#222222">Bayar Tunai (Cash)</text>
      <text x="${paperX + 330}" y="${paperY + 820}" font-size="13" font-weight="bold" fill="#222222">:</text>
      <text x="${paperX + 515}" y="${paperY + 820}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">Rp 500.000</text>

      <text x="${paperX + 160}" y="${paperY + 845}" font-size="13" fill="#333333">Kembali (Change)</text>
      <text x="${paperX + 330}" y="${paperY + 845}" font-size="13" fill="#333333">:</text>
      <text x="${paperX + 515}" y="${paperY + 845}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">Rp 20.000</text>

      <text x="${paperX + 160}" y="${paperY + 870}" font-size="13" fill="#333333">Metode Transaksi</text>
      <text x="${paperX + 330}" y="${paperY + 870}" font-size="13" fill="#333333">:</text>
      <text x="${paperX + 515}" y="${paperY + 870}" font-size="13" font-weight="bold" fill="#15803d" text-anchor="end">TUNAI / LUNAS</text>

      <!-- CAP STEMPEL LUNAS -->
      <g transform="translate(${paperX + 340}, ${paperY + 885}) rotate(-10)">
        <rect x="0" y="0" width="135" height="42" rx="6" fill="none" stroke="#dc2626" stroke-width="2.5" opacity="0.75" stroke-dasharray="6,2"/>
        <text x="67" y="27" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="18" fill="#dc2626" text-anchor="middle" letter-spacing="3" opacity="0.8">L U N A S</text>
      </g>

      <line x1="${paperX + 30}" y1="${paperY + 950}" x2="${paperX + 520}" y2="${paperY + 950}" stroke="#555555" stroke-width="1" stroke-dasharray="3,3"/>

      <!-- BARCODE -->
      ${barcodeRects}
      <text x="${paperX + 275}" y="${paperY + 1045}" font-size="11.5" letter-spacing="3" fill="#333333" text-anchor="middle">89920261027091</text>

      <!-- FOOTER PESAN -->
      <text x="${paperX + 275}" y="${paperY + 1080}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="11.5" fill="#222222" text-anchor="middle">*** TERIMA KASIH ATAS KUNJUNGAN ANDA ***</text>
      <text x="${paperX + 275}" y="${paperY + 1100}" font-family="Arial, Helvetica, sans-serif" font-size="10.5" fill="#555555" text-anchor="middle">Mitra Pengrajin Kain &amp; Batik Berkualitas Yogyakarta</text>
      <text x="${paperX + 275}" y="${paperY + 1118}" font-family="Arial, Helvetica, sans-serif" font-size="9.5" font-style="italic" fill="#777777" text-anchor="middle">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</text>
    </g>
  </svg>`;

  const outPathRoot = path.join(process.cwd(), "CONTOH_NOTA_BARU.png");
  const outPathPublic = path.join(process.cwd(), "public", "CONTOH_NOTA_BARU.png");
  const outPathRoot2 = path.join(process.cwd(), "CONTOH_NOTA_WARNA_AGUNG.png");
  const outPathPublic2 = path.join(process.cwd(), "public", "CONTOH_NOTA_WARNA_AGUNG.png");

  const pngBuf = await sharp(Buffer.from(svg))
    .png({ compressionLevel: 8 })
    .toBuffer();

  await sharp(pngBuf).toFile(outPathRoot);
  await sharp(pngBuf).toFile(outPathPublic);
  await sharp(pngBuf).toFile(outPathRoot2);
  await sharp(pngBuf).toFile(outPathPublic2);

  console.log("Berhasil membuat nota baru di:");
  console.log("- " + outPathRoot);
  console.log("- " + outPathPublic);
  console.log("- " + outPathRoot2);
  console.log("- " + outPathPublic2);
}

generateNotaWarnaAgung().catch(console.error);
