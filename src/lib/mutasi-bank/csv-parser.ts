import type { CsvParseResult, ParsedCsvRow } from "./types";

/**
 * Batasan CSV Sesuai PRD Bagian 11 & Spesifikasi Mutasi Bank:
 * - Ukuran maksimal 1 MB (1.048.576 byte)
 * - Jumlah maksimal 1.000 baris data transaksi
 */
export const MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1 MB
export const MAX_ROWS_LIMIT = 1000;

/**
 * Parsing konten CSV murni tanpa library eksternal.
 * Mendukung:
 * - UTF-8 dengan atau tanpa BOM (\uFEFF)
 * - Pemisah koma (,) atau titik koma (;) otomatis
 * - Nilai berkutip ("...") dengan koma/titik koma/baris baru di dalamnya
 * - Escaped double quotes ("")
 * - Pemisah baris Windows (\r\n) maupun Unix (\n)
 */
export function parseRawCsvText(text: string): string[][] {
  // 1. Hapus UTF-8 BOM jika ada
  let content = text;
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }

  // 2. Deteksi pemisah (koma atau titik koma) dari baris pertama
  const firstLine = content.split(/\r\n|\n|\r/)[0] || "";
  let commaCount = 0;
  let semiCount = 0;
  let inQuote = false;

  for (let i = 0; i < firstLine.length; i++) {
    const char = firstLine[i];
    if (char === '"') {
      inQuote = !inQuote;
    } else if (!inQuote) {
      if (char === ",") commaCount++;
      if (char === ";") semiCount++;
    }
  }

  const delimiter = semiCount > commaCount ? ";" : ",";

  // 3. Tokenizer state-machine
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuotes = false;
  let i = 0;

  while (i < content.length) {
    const char = content[i];

    if (insideQuotes) {
      if (char === '"') {
        if (i + 1 < content.length && content[i + 1] === '"') {
          // Escaped quote "" -> "
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Tutup quote
          insideQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
        i++;
        continue;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = "";
        i++;
        continue;
      } else if (char === "\r") {
        if (i + 1 < content.length && content[i + 1] === "\n") {
          i++; // skip \n pada \r\n
        }
        currentRow.push(currentField.trim());
        currentField = "";
        // Baris selesai
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else if (char === "\n") {
        currentRow.push(currentField.trim());
        currentField = "";
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Sisa field di akhir berkas
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalisasi dan validasi tanggal kalender nyata.
 * Format yang didukung:
 * - YYYY-MM-DD
 * - DD/MM/YYYY
 * Mengembalikan string ISO YYYY-MM-DD jika kalender valid, atau null jika tanggal palsu (misal 2026-02-31).
 */
export function parseAndValidateDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let y: number;
  let m: number;
  let d: number;

  // Cek pola YYYY-MM-DD atau YYYY/MM/DD
  const isoMatch = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(trimmed);
  if (isoMatch) {
    y = parseInt(isoMatch[1], 10);
    m = parseInt(isoMatch[2], 10);
    d = parseInt(isoMatch[3], 10);
  } else {
    // Cek pola DD/MM/YYYY atau DD-MM-YYYY
    const dmyMatch = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(trimmed);
    if (dmyMatch) {
      d = parseInt(dmyMatch[1], 10);
      m = parseInt(dmyMatch[2], 10);
      y = parseInt(dmyMatch[3], 10);
    } else {
      return null;
    }
  }

  // Validasi rentang dasar tahun, bulan, hari
  if (y < 2000 || y > 2100) return null;
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;

  // Cek kalender nyata via Date.UTC (mendeteksi roll-over seperti 31 Februari -> 3 Maret)
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  if (
    dateObj.getUTCFullYear() !== y ||
    dateObj.getUTCMonth() !== m - 1 ||
    dateObj.getUTCDate() !== d
  ) {
    return null;
  }

  const mmStr = String(m).padStart(2, "0");
  const ddStr = String(d).padStart(2, "0");
  return `${y}-${mmStr}-${ddStr}`;
}

/**
 * Normalisasi dan validasi bilangan bulat rupiah.
 * Aturan ketat:
 * - Bilangan bulat rupiah murni (boleh tanda minus di depan atau tanda kurung)
 * - Boleh pemisah ribuan standar (misal 1.000.000 atau 1,000,000)
 * - TOLAK desimal (misal 1.000.000,50 atau 50.00 atau 50,00)
 * - TOLAK notasi ilmiah/eksponen (misal 1e6)
 * - TOLAK teks non-angka
 * - Jumlah tidak boleh 0 (jika isRequired = true)
 * - Saldo boleh kosong / null (jika isRequired = false)
 */
export function parseAndValidateAmount(
  raw: string,
  options: { isRequired?: boolean; allowZero?: boolean } = {}
): { value: number | null; error: string | null } {
  const { isRequired = true, allowZero = false } = options;
  const trimmed = raw.trim();

  if (!trimmed) {
    if (isRequired) {
      return { value: null, error: "Nilai jumlah tidak boleh kosong." };
    }
    return { value: null, error: null };
  }

  // Bersihkan teks mata uang seperti "Rp", "IDR", dan spasi
  let cleaned = trimmed.replace(/^(rp|idr)\.?\s*/i, "").trim();

  // Tolak scientific notation (misal "1e6", "2E5")
  if (/[eE]/.test(cleaned)) {
    return {
      value: null,
      error: `Format angka "${trimmed}" tidak valid (notasi eksponen/ilmiah ditolak).`,
    };
  }

  // Deteksi tanda minus (tanda minus di awal atau dalam kurung)
  let isNegative = false;
  if (cleaned.startsWith("-")) {
    isNegative = true;
    cleaned = cleaned.slice(1).trim();
  } else if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    isNegative = true;
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Tolak desimal: periksa apakah ada pemisah desimal seperti ,50 atau .50 atau desimal lainnya
  // Contoh: "1.000.000,50", "1000.50", "1000,5", "50,00", "50.00"
  if (/[.,]\d{1,2}$/.test(cleaned) || /[.,]\d{4,}$/.test(cleaned)) {
    return {
      value: null,
      error: `Pecahan/desimal pada "${trimmed}" ditolak. Sistem hanya menerima bilangan bulat rupiah.`,
    };
  }

  // Jika ada pemisah titik atau koma, pastikan sesuai pola ribuan 3 digit standar
  if (/[.,]/.test(cleaned)) {
    const isValidDotThousands = /^\d{1,3}(\.\d{3})+$/.test(cleaned);
    const isValidCommaThousands = /^\d{1,3}(,\d{3})+$/.test(cleaned);

    if (isValidDotThousands) {
      cleaned = cleaned.replace(/\./g, "");
    } else if (isValidCommaThousands) {
      cleaned = cleaned.replace(/,/g, "");
    } else {
      return {
        value: null,
        error: `Format angka "${trimmed}" tidak valid. Sistem hanya menerima bilangan bulat rupiah.`,
      };
    }
  }

  // Harus hanya berupa digit angka
  if (!/^\d+$/.test(cleaned)) {
    return {
      value: null,
      error: `Format angka "${trimmed}" tidak valid.`,
    };
  }

  const numVal = Number(cleaned);
  if (!Number.isSafeInteger(numVal)) {
    return { value: null, error: `Nilai angka "${trimmed}" melebihi batas bilangan bulat aman.` };
  }

  const finalAmount = isNegative ? -numVal : numVal;

  if (finalAmount === 0 && !allowZero) {
    return { value: null, error: "Jumlah mutasi tidak boleh bernilai 0." };
  }

  return { value: finalAmount, error: null };
}

/**
 * Mencocokkan nama kolom CSV dengan kolom target.
 * Toleran huruf besar/kecil dan normalisasi karakter.
 */
function findColumnIndex(headers: string[], candidates: string[]): number {
  const normalizedHeaders = headers.map((h) =>
    h.toLowerCase().trim().replace(/[^a-z0-9]/g, "")
  );

  for (const cand of candidates) {
    const target = cand.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    const idx = normalizedHeaders.findIndex((h) => h === target);
    if (idx !== -1) return idx;
  }

  return -1;
}

/**
 * Parse seluruh berkas CSV mutasi bank dengan aturan:
 * - Header wajib: tanggal, deskripsi, jumlah, saldo (urutan bebas)
 * - Header duplikat ditolak
 * - Maksimal 1 MB dan 1.000 baris data
 * - Baris kosong di akhir diabaikan
 * - Semua atau tidak sama sekali: jika ada satu baris cacat, kembalikan daftar error lengkap dengan nomor baris
 */
export function parseMutasiBankCsv(csvText: string): CsvParseResult {
  if (!csvText || !csvText.trim()) {
    return {
      totalBaris: 0,
      barisValid: 0,
      barisInvalid: 0,
      barisKembarBerkas: 0,
      baris: [],
      globalError: "Berkas CSV kosong atau tidak memiliki data.",
    };
  }

  const rawRows = parseRawCsvText(csvText);
  if (rawRows.length === 0) {
    return {
      totalBaris: 0,
      barisValid: 0,
      barisInvalid: 0,
      barisKembarBerkas: 0,
      baris: [],
      globalError: "Berkas CSV tidak memuat baris data yang terbaca.",
    };
  }

  // Baris pertama sebagai header
  const headers = rawRows[0];
  const dataRowsRaw = rawRows.slice(1);

  // 1. Cek duplikasi kolom pada header
  const seenHeaderNorms = new Set<string>();
  const duplicateHeaderNames: string[] = [];

  for (const h of headers) {
    const norm = h.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    if (!norm) continue;
    if (seenHeaderNorms.has(norm)) {
      duplicateHeaderNames.push(h.trim());
    } else {
      seenHeaderNorms.add(norm);
    }
  }

  if (duplicateHeaderNames.length > 0) {
    return {
      totalBaris: dataRowsRaw.length,
      barisValid: 0,
      barisInvalid: dataRowsRaw.length,
      barisKembarBerkas: 0,
      baris: [],
      globalError: `Header CSV memuat kolom duplikat: "${duplicateHeaderNames.join('", "')}". Setiap kolom harus unik.`,
    };
  }

  // 2. Abaikan baris-baris kosong di bagian akhir berkas
  let lastNonEmptyIdx = dataRowsRaw.length - 1;
  while (
    lastNonEmptyIdx >= 0 &&
    dataRowsRaw[lastNonEmptyIdx].every((cell) => !cell || cell.trim() === "")
  ) {
    lastNonEmptyIdx--;
  }

  const dataRows = dataRowsRaw.slice(0, lastNonEmptyIdx + 1);

  if (dataRows.length === 0) {
    return {
      totalBaris: 0,
      barisValid: 0,
      barisInvalid: 0,
      barisKembarBerkas: 0,
      baris: [],
      globalError: "Berkas CSV hanya memiliki header tanpa baris data transaksi.",
    };
  }

  // 3. Batas maksimal 1.000 baris data
  if (dataRows.length > MAX_ROWS_LIMIT) {
    return {
      totalBaris: dataRows.length,
      barisValid: 0,
      barisInvalid: dataRows.length,
      barisKembarBerkas: 0,
      baris: [],
      globalError: `Jumlah baris data (${dataRows.length.toLocaleString("id-ID")}) melebihi batas maksimal ${MAX_ROWS_LIMIT.toLocaleString("id-ID")} baris.`,
    };
  }

  // 4. Petakan indeks kolom wajib
  const idxTanggal = findColumnIndex(headers, ["tanggal", "date", "tgl"]);
  const idxDeskripsi = findColumnIndex(headers, ["deskripsi", "keterangan", "uraian", "description"]);
  const idxJumlah = findColumnIndex(headers, ["jumlah", "amount", "nominal", "mutasi"]);
  const idxSaldo = findColumnIndex(headers, ["saldo", "balance"]);

  const missingColumns: string[] = [];
  if (idxTanggal === -1) missingColumns.push("tanggal");
  if (idxDeskripsi === -1) missingColumns.push("deskripsi");
  if (idxJumlah === -1) missingColumns.push("jumlah");
  if (idxSaldo === -1) missingColumns.push("saldo");

  if (missingColumns.length > 0) {
    return {
      totalBaris: dataRows.length,
      barisValid: 0,
      barisInvalid: dataRows.length,
      barisKembarBerkas: 0,
      baris: [],
      globalError: `Kolom wajib tidak ditemukan di berkas CSV: ${missingColumns.join(", ")}. Kolom yang wajib ada: tanggal, deskripsi, jumlah, saldo. Kolom yang terdeteksi: [${headers.join(", ")}].`,
    };
  }

  // 5. Validasi tidak ada benturan indeks
  const mappedIndices = [idxTanggal, idxDeskripsi, idxJumlah, idxSaldo];
  const uniqueIndices = new Set(mappedIndices);
  if (uniqueIndices.size < mappedIndices.length) {
    return {
      totalBaris: dataRows.length,
      barisValid: 0,
      barisInvalid: dataRows.length,
      barisKembarBerkas: 0,
      baris: [],
      globalError: "Terjadi konflik pemetaan kolom header. Pastikan nama kolom tanggal, deskripsi, jumlah, dan saldo berbeda satu sama lain.",
    };
  }

  const parsedList: ParsedCsvRow[] = [];
  let validCount = 0;
  let invalidCount = 0;
  let kembarCount = 0;

  // Pelacakan baris unik di dalam berkas CSV (cegah duplikat internal berkas)
  const seenFileKeys = new Map<string, number>();

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const barisKe = i + 2; // Baris ke-1 adalah header
    const rawTanggal = (row[idxTanggal] || "").trim();
    const rawDeskripsi = (row[idxDeskripsi] || "").trim();
    const rawJumlah = (row[idxJumlah] || "").trim();
    const rawSaldo = (row[idxSaldo] || "").trim();

    const errors: string[] = [];

    // 1. Validasi Tanggal (harus tanggal kalender nyata)
    const parsedDate = parseAndValidateDate(rawTanggal);
    if (!parsedDate) {
      errors.push(`Tanggal "${rawTanggal}" tidak valid (gunakan format tanggal kalender nyata YYYY-MM-DD atau DD/MM/YYYY).`);
    }

    // 2. Validasi Deskripsi (teks biasa tanpa HTML, tidak mengeksekusi rumus)
    const plainDeskripsi = rawDeskripsi.replace(/<[^>]*>?/gm, "").trim();
    if (!plainDeskripsi) {
      errors.push("Deskripsi / keterangan transaksi wajib diisi.");
    }

    // 3. Validasi Jumlah (bilangan bulat rupiah, tidak boleh 0, tolak desimal/eksponen)
    const parsedAmount = parseAndValidateAmount(rawJumlah, {
      isRequired: true,
      allowZero: false,
    });
    if (parsedAmount.error) {
      errors.push(parsedAmount.error);
    }

    // 4. Validasi Saldo (opsional/nullable, jika diisi harus bilangan bulat rupiah)
    let finalSaldo: number | null = null;
    if (rawSaldo) {
      const parsedSaldo = parseAndValidateAmount(rawSaldo, {
        isRequired: false,
        allowZero: true,
      });
      if (parsedSaldo.error) {
        errors.push(`Saldo: ${parsedSaldo.error}`);
      } else {
        finalSaldo = parsedSaldo.value;
      }
    }

    // 5. Cek Duplikasi Dalam Berkas (Kembar dalam Berkas)
    let isKembar = false;
    let kembarAsal: number | undefined;

    if (errors.length === 0 && parsedDate && plainDeskripsi && parsedAmount.value !== null) {
      const saldoKey = finalSaldo === null ? "NULL" : String(finalSaldo);
      const rowKey = `${parsedDate}|${plainDeskripsi.toLowerCase()}|${parsedAmount.value}|${saldoKey}`;

      if (seenFileKeys.has(rowKey)) {
        isKembar = true;
        kembarAsal = seenFileKeys.get(rowKey);
        kembarCount++;
        errors.push(`Kembar dalam berkas: Transaksi ini duplikat identik dengan baris ke-${kembarAsal}.`);
      } else {
        seenFileKeys.set(rowKey, barisKe);
      }
    }

    const isValid = errors.length === 0 && !isKembar;
    if (isValid) {
      validCount++;
    } else {
      invalidCount++;
    }

    parsedList.push({
      barisKe,
      rawTanggal,
      rawDeskripsi: plainDeskripsi,
      rawJumlah,
      rawSaldo,
      tanggal: parsedDate || undefined,
      deskripsi: plainDeskripsi || undefined,
      jumlah: parsedAmount.value ?? undefined,
      saldo: finalSaldo,
      isValid,
      errors,
      isKembarBerkas: isKembar,
      kembarDenganBaris: kembarAsal,
    });
  }

  // Syarat "Semua atau Tidak Sama Sekali": jika ada minimal satu baris yang tidak valid,
  // laporkan globalError ringkasan kesalahan
  let globalError: string | undefined;
  if (invalidCount > 0) {
    const errorDetails = parsedList
      .filter((r) => !r.isValid)
      .map((r) => `Baris ${r.barisKe}: ${r.errors.join("; ")}`);
    globalError = `Terdapat ${invalidCount} baris data cacat dari total ${dataRows.length} baris. Seluruh impor dibatalkan (Semua atau Tidak Sama Sekali).\n` +
      errorDetails.slice(0, 10).join("\n") +
      (errorDetails.length > 10 ? `\n...dan ${errorDetails.length - 10} baris lainnya.` : "");
  }

  return {
    totalBaris: dataRows.length,
    barisValid: invalidCount === 0 ? validCount : 0,
    barisInvalid: invalidCount,
    barisKembarBerkas: kembarCount,
    baris: parsedList,
    globalError,
  };
}

/**
 * Contoh template teks CSV untuk disalin atau diunduh oleh pengguna.
 */
export const CONTOH_CSV_TEMPLATE = `tanggal,deskripsi,jumlah,saldo
2026-10-01,PENGISIAN KAS KECIL BULAN 10/2026,-500000,132751000
2026-10-02,PENJUALAN BATIK TULIS KE RESELLER NUSA DUA,8750000,141501000
2026-10-05,SEWA TEMPAT PRODUKSI DAN TOKO BULAN 10/2026,-6000000,135501000
2026-10-05,PEMBAYARAN PG-202610-002: PEWARNA INDIGO ALAM,-1000000,134501000
2026-10-08,PENJUALAN BATIK TULIS KE TOKO ONLINE BATIKITA,4400000,138901000
2026-10-12,PENJUALAN BATIK TULIS KE PENGUNJUNG TOKO,4950000,143851000
2026-10-12,"TAGIHAN LISTRIK, PDAM, DAN INTERNET",-1270000,142581000
2026-10-12,BIAYA ADMINISTRASI BULANAN,-15000,142566000
2026-10-14,TRSF MASUK DARI GALERI KAWUNG YOGYA,3250000,145816000`;
