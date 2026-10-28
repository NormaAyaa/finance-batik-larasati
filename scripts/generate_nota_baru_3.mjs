import path from "node:path";
import sharp from "sharp";

async function generateNotaSuryaKencana() {
  const width = 900;
  const height = 1280;

  const paperX = 175;
  const paperY = 55;
  const paperW = 550;
  const paperH = 1160;

  // Garis bergerigi (perforated jagged edge)
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

  // Barcode (89920261027145)
  const barcodeX = paperX + 165;
  const barcodeY = paperY + 990;
  const barcodePattern = [
    3, 1, 4, 2, 2, 5, 2, 4, 1, 3, 2, 5, 2, 4, 1, 3, 2, 6, 2, 1, 4, 2, 5, 1, 3, 2, 5, 2, 4, 1, 3, 5, 2, 4, 3
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
      <!-- Meja kayu jati tua cokelat hangat bertekstur (warm teak desk) -->
      <linearGradient id="deskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1f140e"/>
        <stop offset="25%" stop-color="#2c1a11"/>
        <stop offset="50%" stop-color="#1e130d"/>
        <stop offset="75%" stop-color="#321d13"/>
        <stop offset="100%" stop-color="#170d08"/>
      </linearGradient>

      <radialGradient id="vignette" cx="50%" cy="45%" r="65%">
        <stop offset="35%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.75"/>
      </radialGradient>

      <!-- Kertas thermal putih tulang bersih -->
      <linearGradient id="paperGrad" x1="0%" y1="0%" x2="2%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="50%" stop-color="#fdfcf8"/>
        <stop offset="100%" stop-color="#f8f6ec"/>
      </linearGradient>

      <!-- Bayangan kertas nota fisik -->
      <filter id="shadow" x="-10%" y="-5%" width="125%" height="115%">
        <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.62"/>
        <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000000" flood-opacity="0.38"/>
      </filter>
    </defs>

    <!-- 1. Background Meja -->
    <rect width="${width}" height="${height}" fill="url(#deskGrad)"/>
    
    <!-- Pola serat kayu natural -->
    <path d="M 0,160 Q 450,180 900,150" stroke="#120a06" stroke-width="3" opacity="0.4" fill="none"/>
    <path d="M 0,400 Q 450,420 900,390" stroke="#120a06" stroke-width="4" opacity="0.35" fill="none"/>
    <path d="M 0,680 Q 450,660 900,690" stroke="#120a06" stroke-width="4" opacity="0.4" fill="none"/>
    <path d="M 0,950 Q 450,970 900,940" stroke="#120a06" stroke-width="3" opacity="0.35" fill="none"/>

    <rect width="${width}" height="${height}" fill="url(#vignette)"/>

    <!-- 2. Kertas Nota Fisik dengan Drop Shadow (kemiringan natural -0.45 derajat) -->
    <path d="${paperPathD}" fill="url(#paperGrad)" filter="url(#shadow)" transform="rotate(-0.45, 450, 600)"/>

    <!-- Grup Konten Nota -->
    <g transform="rotate(-0.45, 450, 600)" font-family="monospace, Courier, 'Courier New'">
      
      <!-- HEADER TOKO -->
      <text x="${paperX + 275}" y="${paperY + 65}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="22" fill="#111111" text-anchor="middle" letter-spacing="0.5">TOKO KAIN &amp; PERLENGKAPAN BATIK</text>
      <text x="${paperX + 275}" y="${paperY + 95}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="24" fill="#c2410c" text-anchor="middle" letter-spacing="1">"SURYA KENCANA"</text>
      <text x="${paperX + 275}" y="${paperY + 120}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="12" fill="#444444" text-anchor="middle">(Pusat Kain Mori Gamelan, Malam Klowong &amp; Alat Canting)</text>
      <text x="${paperX + 275}" y="${paperY + 140}" font-family="Arial, Helvetica, sans-serif" font-size="11.5" fill="#555555" text-anchor="middle">Jl. Kauman No. 15, Ngupasan, Gondomanan, Yogyakarta</text>
      <text x="${paperX + 275}" y="${paperY + 158}" font-family="Arial, Helvetica, sans-serif" font-size="11" fill="#666666" text-anchor="middle">Telp: (0274) 371902 / WhatsApp: 0813-2876-9012</text>

      <!-- JUDUL STRUK -->
      <text x="${paperX + 275}" y="${paperY + 195}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="15" fill="#111111" text-anchor="middle" letter-spacing="1.5">NOTA STRUK PEMBELIAN</text>

      <line x1="${paperX + 30}" y1="${paperY + 210}" x2="${paperX + 520}" y2="${paperY + 210}" stroke="#111111" stroke-width="2"/>

      <!-- METADATA TRANSAKSI -->
      <text x="${paperX + 35}" y="${paperY + 235}" font-size="13" font-weight="bold" fill="#222222">No. Transaksi : STR-20261027-0145</text>
      <text x="${paperX + 35}" y="${paperY + 258}" font-size="13" font-weight="bold" fill="#222222">Tanggal       : 27/10/2026 13:45 WIB</text>
      <text x="${paperX + 35}" y="${paperY + 281}" font-size="12.5" fill="#333333">Kasir         : Nurul Hidayah (K-01)</text>
      <text x="${paperX + 35}" y="${paperY + 304}" font-size="12.5" fill="#333333">Pelanggan     : CV Batik Larasati (Rina Anggraini)</text>

      <line x1="${paperX + 30}" y1="${paperY + 320}" x2="${paperX + 520}" y2="${paperY + 320}" stroke="#333333" stroke-width="1.5" stroke-dasharray="4,3"/>

      <!-- HEADER TABEL -->
      <text x="${paperX + 35}" y="${paperY + 340}" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="bold" fill="#111111">NAMA BARANG / BAHAN BAKU</text>
      <text x="${paperX + 515}" y="${paperY + 340}" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="bold" fill="#111111" text-anchor="end">TOTAL (RP)</text>

      <line x1="${paperX + 30}" y1="${paperY + 352}" x2="${paperX + 520}" y2="${paperY + 352}" stroke="#333333" stroke-width="1.5" stroke-dasharray="4,3"/>

      <!-- ITEM 1: KAIN MORI GAMELAN -->
      <text x="${paperX + 35}" y="${paperY + 380}" font-size="13" font-weight="bold" fill="#111111">1. Kain Mori Primissima Cap Gamelan</text>
      <text x="${paperX + 55}" y="${paperY + 402}" font-size="12" fill="#444444">15 meter @ Rp 36.000 / m</text>
      <text x="${paperX + 515}" y="${paperY + 402}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">540.000</text>

      <!-- ITEM 2: MALAM LILIN ALAMI -->
      <text x="${paperX + 35}" y="${paperY + 440}" font-size="13" font-weight="bold" fill="#111111">2. Lilin Malam Klowong Alami Super</text>
      <text x="${paperX + 55}" y="${paperY + 462}" font-size="12" fill="#444444">2 kg @ Rp 45.000 / kg</text>
      <text x="${paperX + 515}" y="${paperY + 462}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">90.000</text>

      <!-- ITEM 3: PEWARNA INDIGOSOL & REMAZOL -->
      <text x="${paperX + 35}" y="${paperY + 500}" font-size="13" font-weight="bold" fill="#111111">3. Pewarna Batik Indigosol Biru &amp; Remazol</text>
      <text x="${paperX + 55}" y="${paperY + 522}" font-size="12" fill="#444444">2 botol @ Rp 40.000</text>
      <text x="${paperX + 515}" y="${paperY + 522}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">80.000</text>

      <!-- ITEM 4: WAJAN & KOMPOR MINYAK BATIK -->
      <text x="${paperX + 35}" y="${paperY + 560}" font-size="13" font-weight="bold" fill="#111111">4. Wajan Kecil &amp; Kompor Minyak Batik (Set)</text>
      <text x="${paperX + 55}" y="${paperY + 582}" font-size="12" fill="#444444">1 set perlengkapan membatik</text>
      <text x="${paperX + 515}" y="${paperY + 582}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">85.000</text>

      <!-- GARIS PEMISAH SUBTOTAL -->
      <line x1="${paperX + 30}" y1="${paperY + 610}" x2="${paperX + 520}" y2="${paperY + 610}" stroke="#444444" stroke-width="1" stroke-dasharray="3,3"/>

      <!-- RINCIAN SUBTOTAL -->
      <text x="${paperX + 160}" y="${paperY + 635}" font-size="13" fill="#333333">Subtotal</text>
      <text x="${paperX + 330}" y="${paperY + 635}" font-size="13" fill="#333333">:</text>
      <text x="${paperX + 515}" y="${paperY + 635}" font-size="13" fill="#222222" text-anchor="end">Rp 795.000</text>

      <text x="${paperX + 160}" y="${paperY + 658}" font-size="13" fill="#333333">Diskon Pelanggan</text>
      <text x="${paperX + 330}" y="${paperY + 658}" font-size="13" fill="#333333">:</text>
      <text x="${paperX + 515}" y="${paperY + 658}" font-size="13" fill="#16a34a" text-anchor="end">- Rp 25.000</text>

      <text x="${paperX + 160}" y="${paperY + 681}" font-size="13" fill="#333333">PPN (11%)</text>
      <text x="${paperX + 330}" y="${paperY + 681}" font-size="13" fill="#333333">:</text>
      <text x="${paperX + 515}" y="${paperY + 681}" font-size="13" fill="#666666" text-anchor="end">Termasuk (Rp 0)</text>

      <!-- KOTAK TOTAL AKHIR -->
      <line x1="${paperX + 30}" y1="${paperY + 705}" x2="${paperX + 520}" y2="${paperY + 705}" stroke="#111111" stroke-width="2.5"/>
      <rect x="${paperX + 30}" y="${paperY + 707}" width="490" height="52" fill="#fffbeb" opacity="0.7"/>
      <text x="${paperX + 45}" y="${paperY + 742}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="20" fill="#111111">TOTAL AKHIR</text>
      <text x="${paperX + 505}" y="${paperY + 742}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="24" fill="#111111" text-anchor="end">Rp 770.000</text>
      <line x1="${paperX + 30}" y1="${paperY + 761}" x2="${paperX + 520}" y2="${paperY + 761}" stroke="#111111" stroke-width="2.5"/>

      <!-- TERBILANG -->
      <text x="${paperX + 275}" y="${paperY + 788}" font-size="12" font-style="italic" fill="#333333" text-anchor="middle">(Tujuh Ratus Tujuh Puluh Ribu Rupiah)</text>

      <!-- DETAIL PEMBAYARAN -->
      <text x="${paperX + 160}" y="${paperY + 820}" font-size="13" font-weight="bold" fill="#222222">Bayar Tunai (Cash)</text>
      <text x="${paperX + 330}" y="${paperY + 820}" font-size="13" font-weight="bold" fill="#222222">:</text>
      <text x="${paperX + 515}" y="${paperY + 820}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">Rp 800.000</text>

      <text x="${paperX + 160}" y="${paperY + 845}" font-size="13" fill="#333333">Kembali (Change)</text>
      <text x="${paperX + 330}" y="${paperY + 845}" font-size="13" fill="#333333">:</text>
      <text x="${paperX + 515}" y="${paperY + 845}" font-size="13.5" font-weight="bold" fill="#111111" text-anchor="end">Rp 30.000</text>

      <text x="${paperX + 160}" y="${paperY + 870}" font-size="13" fill="#333333">Metode Bayar</text>
      <text x="${paperX + 330}" y="${paperY + 870}" font-size="13" fill="#333333">:</text>
      <text x="${paperX + 515}" y="${paperY + 870}" font-size="13" font-weight="bold" fill="#15803d" text-anchor="end">TUNAI / LUNAS</text>

      <!-- CAP STEMPEL LUNAS (SEMI-TRANSPARAN) -->
      <g transform="translate(${paperX + 340}, ${paperY + 885}) rotate(-8)">
        <rect x="0" y="0" width="135" height="42" rx="6" fill="none" stroke="#dc2626" stroke-width="2.5" opacity="0.75" stroke-dasharray="6,2"/>
        <text x="67" y="27" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="18" fill="#dc2626" text-anchor="middle" letter-spacing="3" opacity="0.8">L U N A S</text>
      </g>

      <line x1="${paperX + 30}" y1="${paperY + 950}" x2="${paperX + 520}" y2="${paperY + 950}" stroke="#555555" stroke-width="1" stroke-dasharray="3,3"/>

      <!-- BARCODE -->
      ${barcodeRects}
      <text x="${paperX + 275}" y="${paperY + 1045}" font-size="11.5" letter-spacing="3" fill="#333333" text-anchor="middle">89920261027145</text>

      <!-- FOOTER PESAN -->
      <text x="${paperX + 275}" y="${paperY + 1080}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="11.5" fill="#222222" text-anchor="middle">*** TERIMA KASIH TELAH BERBELANJA ***</text>
      <text x="${paperX + 275}" y="${paperY + 1100}" font-family="Arial, Helvetica, sans-serif" font-size="10.5" fill="#555555" text-anchor="middle">Mendukung Mahakarya Batik Tulis &amp; Cap Nusantara</text>
      <text x="${paperX + 275}" y="${paperY + 1118}" font-family="Arial, Helvetica, sans-serif" font-size="9.5" font-style="italic" fill="#777777" text-anchor="middle">Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan</text>
    </g>
  </svg>`;

  const outPathRoot = path.join(process.cwd(), "CONTOH_NOTA_BARU.png");
  const outPathPublic = path.join(process.cwd(), "public", "CONTOH_NOTA_BARU.png");
  const outPathRoot3 = path.join(process.cwd(), "CONTOH_NOTA_SURYA_KENCANA.png");
  const outPathPublic3 = path.join(process.cwd(), "public", "CONTOH_NOTA_SURYA_KENCANA.png");

  const pngBuf = await sharp(Buffer.from(svg))
    .png({ compressionLevel: 8 })
    .toBuffer();

  await sharp(pngBuf).toFile(outPathRoot);
  await sharp(pngBuf).toFile(outPathPublic);
  await sharp(pngBuf).toFile(outPathRoot3);
  await sharp(pngBuf).toFile(outPathPublic3);

  console.log("Berhasil membuat nota baru Surya Kencana di:");
  console.log("- " + outPathRoot);
  console.log("- " + outPathPublic);
  console.log("- " + outPathRoot3);
  console.log("- " + outPathPublic3);
}

generateNotaSuryaKencana().catch(console.error);
