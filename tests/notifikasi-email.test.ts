import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {
  normalizeAppBaseUrl,
  escapeHtml,
  isDummyDomain,
  generateEmailSubject,
  generateEmailContent,
  filterEmailRecipients,
  sendSingleEmail,
  parseEmailMapping,
  type PengajuanEmailData,
  type ProfileRecipient,
} from "@/lib/notifikasi-email";

describe("Fitur Notifikasi Email - Unit Tests di Memori", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    // Bersihkan file uji di folder .outbox jika ada
    try {
      const outboxDir = path.join(process.cwd(), ".outbox");
      const files = await fs.readdir(outboxDir);
      for (const file of files) {
        if (file.includes("test-user") || file.includes("test_mock")) {
          await fs.unlink(path.join(outboxDir, file)).catch(() => {});
        }
      }
    } catch {
      // Abaikan jika folder belum ada
    }
  });

  describe("1. Normalisasi APP_BASE_URL", () => {
    it("harus membuang garis miring (trailing slash) di akhir URL", () => {
      assert.equal(
        normalizeAppBaseUrl("https://larasati.vercel.app/"),
        "https://larasati.vercel.app"
      );
      assert.equal(
        normalizeAppBaseUrl("https://larasati.vercel.app///"),
        "https://larasati.vercel.app"
      );
    });

    it("hanya menerima protokol http atau https", () => {
      assert.equal(normalizeAppBaseUrl("https://larasati.com"), "https://larasati.com");
      assert.equal(normalizeAppBaseUrl("http://localhost:3000"), "http://localhost:3000");
      assert.equal(normalizeAppBaseUrl("ftp://larasati.com"), "");
      assert.equal(normalizeAppBaseUrl("javascript:alert(1)"), "");
      assert.equal(normalizeAppBaseUrl(""), "");
      assert.equal(normalizeAppBaseUrl(undefined), "");
    });
  });

  describe("2. Sanitasi Subjek & Pencegahan Header Injection", () => {
    it("harus membuang semua karakter baris baru (\\r, \\n) dari subjek", () => {
      const subjectWithCrlf = generateEmailSubject(
        "PG-202610-0001\r\nBcc: evil@hacker.com\r\n",
        "perlu_revisi"
      );
      assert.ok(!subjectWithCrlf.includes("\r"), "Subjek tidak boleh memuat \\r");
      assert.ok(!subjectWithCrlf.includes("\n"), "Subjek tidak boleh memuat \\n");
      assert.equal(
        subjectWithCrlf,
        "[Larasati] Pengajuan PG-202610-0001 Bcc: evil@hacker.com perlu revisi"
      );
    });

    it("menghasilkan subjek yang sesuai untuk setiap jenis status", () => {
      assert.equal(
        generateEmailSubject("PG-001", "perlu_revisi"),
        "[Larasati] Pengajuan PG-001 perlu revisi"
      );
      assert.equal(
        generateEmailSubject("PG-002", "ditolak"),
        "[Larasati] Pengajuan PG-002 ditolak"
      );
      assert.equal(
        generateEmailSubject("PG-003", "dibayar"),
        "[Larasati] Pengajuan PG-003 sudah dibayar"
      );
      assert.equal(
        generateEmailSubject("PG-004", "menunggu_direktur"),
        "[Larasati] Pengajuan PG-004 menunggu persetujuan Anda"
      );
    });

    it("menambahkan awalan [UJI untuk: ...] saat mode redirect aktif", () => {
      const subject = generateEmailSubject(
        "PG-001",
        "perlu_revisi",
        "pengaju@batiklarasati.com"
      );
      assert.equal(
        subject,
        "[UJI untuk: pengaju@batiklarasati.com] [Larasati] Pengajuan PG-001 perlu revisi"
      );
    });
  });

  describe("3. Keamanan Isi Email: Escape HTML & Tanpa Data Sensitif", () => {
    const mockPengajuan: PengajuanEmailData = {
      id: 42,
      nomor: "PG-202610-0042",
      jenis: "reimburse",
      jumlah: 750000,
      status: "perlu_revisi",
      catatan_peninjau: "<script>alert('xss')</script> & Nota \"asli\" tidak jelas",
    };

    it("fungsi escapeHtml bekerja secara mandiri untuk karakter khusus", () => {
      assert.equal(
        escapeHtml(`<script>alert("xss") & test 'single'</script>`),
        "&lt;script&gt;alert(&quot;xss&quot;) &amp; test &#39;single&#39;&lt;/script&gt;"
      );
    });

    it("harus melakukan escape HTML pada catatan peninjau dan data input pengguna", () => {
      const { html, text } = generateEmailContent({
        pengajuan: mockPengajuan,
        appBaseUrl: "https://larasati.com",
      });

      // HTML harus ter-escape
      assert.ok(!html.includes("<script>alert('xss')</script>"), "HTML tidak boleh memuat tag skrip mentah");
      assert.ok(html.includes("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"), "Karakter <, >, ' harus di-escape");
      assert.ok(html.includes("&amp; Nota &quot;asli&quot; tidak jelas"), "Karakter & dan \" harus di-escape");

      // Plain text memuat teks asli tanpa tag HTML
      assert.ok(text.includes("<script>alert('xss')</script> & Nota \"asli\" tidak jelas"));
    });

    it("TIDAK boleh memuat bukti_path, URL bertanda tangan, saldo akun, nomor akun, atau data pengguna lain", () => {
      const { html, text } = generateEmailContent({
        pengajuan: mockPengajuan,
        appBaseUrl: "https://larasati.com",
      });

      const forbiddenKeywords = [
        "bukti_path",
        "bukti/",
        "storage/v1",
        "token=",
        "saldo",
        "nomor_rekening",
        "nomor_akun",
        "akun_kas",
      ];

      for (const kw of forbiddenKeywords) {
        assert.ok(!html.toLowerCase().includes(kw), `HTML tidak boleh mengandung kata: ${kw}`);
        assert.ok(!text.toLowerCase().includes(kw), `Teks tidak boleh mengandung kata: ${kw}`);
      }

      // Memuat informasi yang sah: nomor, format rupiah, dan tautan
      assert.ok(html.includes("PG-202610-0042"));
      assert.ok(html.includes("Rp&nbsp;750.000") || html.includes("750.000"));
      assert.ok(html.includes("https://larasati.com/pengajuan/42"));
      assert.ok(text.includes("https://larasati.com/pengajuan/42"));
    });
  });

  describe("4. Pemilihan Penerima (filterEmailRecipients)", () => {
    const actorId = "user-actor-123";
    const pengajuAktif: ProfileRecipient = {
      id: "user-pengaju-456",
      nama_lengkap: "Siti Staf",
      email: "siti@batiklarasati.com",
      aktif: true,
    };
    const pengajuNonaktif: ProfileRecipient = {
      id: "user-pengaju-789",
      nama_lengkap: "Budi Nonaktif",
      email: "budi@batiklarasati.com",
      aktif: false,
    };
    const direktur1: ProfileRecipient = {
      id: "user-dir-1",
      nama_lengkap: "Pak Direktur Utama",
      email: "dir1@batiklarasati.com",
      aktif: true,
    };
    const direktur2: ProfileRecipient = {
      id: "user-dir-2",
      nama_lengkap: "Ibu Direktur Ops",
      email: "dir2@batiklarasati.com",
      aktif: true,
    };
    const direkturNonaktif: ProfileRecipient = {
      id: "user-dir-3",
      nama_lengkap: "Mantan Direktur",
      email: "dir3@batiklarasati.com",
      aktif: false,
    };

    it("mengirim ke Pengaju untuk status perlu_revisi, ditolak, dan dibayar jika aktif dan bukan actor", () => {
      const resRevisi = filterEmailRecipients({
        statusBaru: "perlu_revisi",
        actorId,
        pengaju: pengajuAktif,
      });
      assert.equal(resRevisi.length, 1);
      assert.equal(resRevisi[0].id, pengajuAktif.id);

      const resTolak = filterEmailRecipients({
        statusBaru: "ditolak",
        actorId,
        pengaju: pengajuAktif,
      });
      assert.equal(resTolak.length, 1);

      const resBayar = filterEmailRecipients({
        statusBaru: "dibayar",
        actorId,
        pengaju: pengajuAktif,
      });
      assert.equal(resBayar.length, 1);
    });

    it("MELEWATI Pengaju jika akunnya nonaktif", () => {
      const res = filterEmailRecipients({
        statusBaru: "perlu_revisi",
        actorId,
        pengaju: pengajuNonaktif,
      });
      assert.equal(res.length, 0, "Pengaju nonaktif tidak boleh menerima email");
    });

    it("MELEWATI jika Pengaju adalah orang yang sama dengan pelaku perpindahan (actorId)", () => {
      const res = filterEmailRecipients({
        statusBaru: "perlu_revisi",
        actorId: pengajuAktif.id, // actor sama dengan pengaju
        pengaju: pengajuAktif,
      });
      assert.equal(res.length, 0, "Pelaku tidak boleh menerima email untuk aksinya sendiri");
    });

    it("mengirim ke seluruh Direktur aktif saat status menunggu_direktur", () => {
      const res = filterEmailRecipients({
        statusBaru: "menunggu_direktur",
        actorId,
        direkturList: [direktur1, direktur2, direkturNonaktif],
      });
      assert.equal(res.length, 2, "Hanya direktur aktif yang dipilih");
      assert.deepEqual(
        res.map((d) => d.id),
        [direktur1.id, direktur2.id]
      );
    });

    it("MELEWATI Direktur yang merupakan pelaku saat status menunggu_direktur", () => {
      const res = filterEmailRecipients({
        statusBaru: "menunggu_direktur",
        actorId: direktur1.id, // direktur 1 adalah pelaku pengajuan/verifikasi
        direkturList: [direktur1, direktur2],
      });
      assert.equal(res.length, 1, "Direktur pelaku harus dilewati");
      assert.equal(res[0].id, direktur2.id);
    });

    it("TIDAK mengirim email untuk status draf, diajukan, atau dibatalkan", () => {
      assert.equal(
        filterEmailRecipients({
          statusBaru: "diajukan",
          actorId,
          pengaju: pengajuAktif,
        }).length,
        0
      );
      assert.equal(
        filterEmailRecipients({
          statusBaru: "draf",
          actorId,
          pengaju: pengajuAktif,
        }).length,
        0
      );
      assert.equal(
        filterEmailRecipients({
          statusBaru: "dibatalkan",
          actorId,
          pengaju: pengajuAktif,
        }).length,
        0
      );
    });

    it("mengirim ke Pengaju saat status disetujui", () => {
      assert.equal(
        filterEmailRecipients({
          statusBaru: "disetujui",
          actorId,
          pengaju: pengajuAktif,
        }).length,
        1
      );
    });
  });

  describe("5. Deteksi Domain Contoh & Aturan Alamat .test", () => {
    it("mendeteksi domain contoh .test, .example, .invalid, .localhost dengan benar", () => {
      assert.equal(isDummyDomain("staf@larasati.test"), true);
      assert.equal(isDummyDomain("akuntan@perusahaan.example"), true);
      assert.equal(isDummyDomain("direktur@organisasi.invalid"), true);
      assert.equal(isDummyDomain("admin@server.localhost"), true);
      assert.equal(isDummyDomain("user@batiklarasati.com"), false);
      assert.equal(isDummyDomain("user@gmail.com"), false);
    });

    it("melewati pengiriman jika penerima memakai domain contoh tanpa alihan (mode kirim)", async () => {
      process.env.EMAIL_MODE = "kirim";
      delete process.env.EMAIL_TEST_REDIRECT;

      const dummyRecipient: ProfileRecipient = {
        id: "test-user-dummy",
        nama_lengkap: "Pengguna Dummy",
        email: "dummy@batiklarasati.test",
        aktif: true,
      };

      const result = await sendSingleEmail({
        recipient: dummyRecipient,
        pengajuan: {
          id: 10,
          nomor: "PG-0010",
          jenis: "biaya",
          jumlah: 100000,
          status: "perlu_revisi",
        },
        appBaseUrl: "https://larasati.com",
      });

      assert.equal(result.status, "skipped");
      assert.equal(result.errorType, "DUMMY_DOMAIN");
      assert.equal(result.notice, "Penerima memakai alamat contoh, email tidak dikirim.");
    });
  });

  describe("6. Mode Log (EMAIL_MODE='log')", () => {
    it("menulis file .html ke folder .outbox/ pada non-production dengan isi lengkap", async () => {
      process.env.EMAIL_MODE = "log";
      (process.env as Record<string, string | undefined>).NODE_ENV = "development";

      const mockRecipient: ProfileRecipient = {
        id: "test-user-mock-99",
        nama_lengkap: "Rina Penerima",
        email: "rina@batiklarasati.com",
        aktif: true,
      };

      const mockPengajuan: PengajuanEmailData = {
        id: 99,
        nomor: "PG-202610-0099",
        jenis: "reimburse",
        jumlah: 350000,
        status: "dibayar",
      };

      const result = await sendSingleEmail({
        recipient: mockRecipient,
        pengajuan: mockPengajuan,
        appBaseUrl: "https://larasati.com",
      });

      assert.equal(result.status, "logged");

      const outboxDir = path.join(process.cwd(), ".outbox");
      const files = await fs.readdir(outboxDir);
      const createdFile = files.find((f) => f.includes("dibayar") && f.endsWith(".html"));

      assert.ok(createdFile, "File outbox log harus terbuat di folder .outbox/");

      const fileContent = await fs.readFile(path.join(outboxDir, createdFile!), "utf-8");
      assert.ok(fileContent.includes("Penerima Asli: Rina Penerima <rina@batiklarasati.com>"));
      assert.ok(fileContent.includes("Subjek: [Larasati] Pengajuan PG-202610-0099 sudah dibayar"));
      assert.ok(fileContent.includes("PG-202610-0099"));
      assert.ok(fileContent.includes("Sudah Dibayar"));
      assert.ok(fileContent.includes("https://larasati.com/pengajuan/99"));
    });
  });

  describe("7. Mode Pengalihan (EMAIL_TEST_REDIRECT)", () => {
    it("menambahkan catatan uji ke subjek jika EMAIL_TEST_REDIRECT terpasang", () => {
      const subject = generateEmailSubject(
        "PG-007",
        "menunggu_direktur",
        "asli@batiklarasati.com"
      );
      assert.ok(subject.startsWith("[UJI untuk: asli@batiklarasati.com]"));
      assert.ok(subject.includes("menunggu persetujuan Anda"));
    });

    it("parseEmailMapping berhasil memetakan string format key:value terpisah titik koma", () => {
      const mapping = parseEmailMapping(
        "rina@larasati.test:rinalrsti@gmail.com;dimas@larasati.test:dimaslrst@gmail.com;laras@larasati.test:larasatiyw@gmail.com"
      );
      assert.equal(mapping.get("rina@larasati.test"), "rinalrsti@gmail.com");
      assert.equal(mapping.get("dimas@larasati.test"), "dimaslrst@gmail.com");
      assert.equal(mapping.get("laras@larasati.test"), "larasatiyw@gmail.com");
      assert.equal(mapping.get("unknown@larasati.test"), undefined);
    });
  });
});
