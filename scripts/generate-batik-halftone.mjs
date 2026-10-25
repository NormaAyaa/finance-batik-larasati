import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Script untuk membuat aset halftone dot-matrix dengan nuansa sinar matahari golden hour
 * (Warm Sunset Golden-Orange) dari motif batik burung merak & parang (batik-login-source.jpg).
 *
 * Ciri khas warna:
 * - Bernuansa emas-oranye hangat seperti tersorot cahaya matahari golden hour
 * - Highlight: Emas matahari terbenam (Warm Golden Sunbeam Highlight, #ffc043)
 * - Midtone: Oranye keemasan menyala (Golden Hour Amber-Orange, #f59118)
 * - Shadow: Amber perunggu tua hangat (Deep Sunlit Bronze, #bf5b0c)
 * - Latar belakang hitam pekat chiaroscuro
 */
async function generateBatikHalftone() {
  const inputPath = path.join(process.cwd(), "public", "images", "batik-login-source.jpg");
  const outputPath = path.join(process.cwd(), "public", "images", "batik-golden-hour.webp");
  const fallbackPath = path.join(process.cwd(), "public", "images", "batik-gold-halftone.webp");

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Berkas input tidak ditemukan: ${inputPath}`);
  }

  // Dimensi kartu login desktop (640 x 720 px)
  const outWidth = 640;
  const outHeight = 720;
  const step = 8;
  const cols = Math.floor(outWidth / step); // 80
  const rows = Math.floor(outHeight / step); // 90

  // Resize gambar batik berwarna dengan fokus tengah pada burung merak & ornamen parang
  const { data } = await sharp(inputPath)
    .resize(cols, rows, { fit: "cover", position: "center" })
    .sharpen({ sigma: 1.2 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const maxRadius = (step / 2) * 0.95;
  let circles = "";
  let dotCount = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = (r * cols + c) * 3;
      const rawR = data[idx];
      const rawG = data[idx + 1];
      const rawB = data[idx + 2];

      const lum = 0.299 * rawR + 0.587 * rawG + 0.114 * rawB;

      // Abaikan area hitam pekat (threshold 20)
      if (lum < 20) continue;

      // Normalisasi nilai terang
      const linearNorm = Math.max(0, Math.min(1, (lum - 20) / 185));
      const norm = Math.pow(linearNorm, 0.82);
      const radius = norm * maxRadius;

      if (radius >= 0.55) {
        // Efek sorotan sinar matahari golden hour dari sudut kanan atas
        // cNorm: 0 (kiri) -> 1 (kanan); rNorm: 0 (atas) -> 1 (bawah)
        const cNorm = c / cols;
        const rNorm = 1 - (r / rows);
        const sunAngleFactor = (cNorm * 0.6 + rNorm * 0.4); // 0 sampai 1 (maksimal di kanan atas)

        // Hitung warna oranye keemasan matahari golden hour
        let dotR = 0;
        let dotG = 0;
        let dotB = 0;

        if (norm < 0.6) {
          // Area shadow & midtone gelap: Amber-oranye tembaga hangat
          const t = norm / 0.6;
          dotR = Math.round(200 + t * 40);             // 200 -> 240
          dotG = Math.round(90 + t * 50 + sunAngleFactor * 15); // 90 -> 140
          dotB = Math.round(8 + t * 12);               // 8 -> 20
        } else {
          // Area highlight & midtone terang: Oranye-emas matahari terbenam menyala
          const t = (norm - 0.6) / 0.4;
          dotR = Math.min(255, Math.round(240 + t * 15));       // 240 -> 255
          dotG = Math.round(140 + t * 45 + sunAngleFactor * 15); // 140 -> 185
          dotB = Math.round(20 + t * 30 + sunAngleFactor * 15);  // 20 -> 50
        }

        const cx = (c * step + step / 2).toFixed(1);
        const cy = (r * step + step / 2).toFixed(1);
        const radStr = radius.toFixed(1);
        circles += `<circle cx="${cx}" cy="${cy}" r="${radStr}" fill="rgb(${dotR},${dotG},${dotB})" />`;
        dotCount++;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${outWidth}" height="${outHeight}" viewBox="0 0 ${outWidth} ${outHeight}">${circles}</svg>`;

  // Simpan format WebP transparan untuk batik-golden-hour.webp
  await sharp(Buffer.from(svg))
    .webp({ quality: 88, effort: 6 })
    .toFile(outputPath);

  // Simpan juga ke fallbackPath
  await sharp(Buffer.from(svg))
    .webp({ quality: 88, effort: 6 })
    .toFile(fallbackPath);

  const stats = fs.statSync(outputPath);
  const sizeKB = stats.size / 1024;

  console.log("=== Hasil Pembuatan Halftone Batik Golden Hour ===");
  console.log(`Lokasi: ${outputPath}`);
  console.log(`Dimensi: ${outWidth} x ${outHeight} px`);
  console.log(`Titik emas-oranye: ${dotCount}`);
  console.log(`Ukuran: ${stats.size} bytes (${sizeKB.toFixed(2)} KB)`);

  if (stats.size > 300 * 1024) {
    throw new Error(`Ukuran berkas (${sizeKB.toFixed(2)} KB) melebihi batas 300 KB!`);
  } else {
    console.log("Status: LULUS verifikasi ukuran di bawah 300 KB.");
  }
}

generateBatikHalftone().catch((err) => {
  console.error("Gagal membuat aset:", err);
  process.exit(1);
});
