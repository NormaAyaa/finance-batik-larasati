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
  generateIdempotencyKey,
  sendSingleEmail,
  kirimNotifikasiPengajuan,
  parseEmailMapping,
  maskEmail,
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
      assert.equal(
        generateEmailSubject("PG-005", "diajukan", undefined, "akuntan_baru"),
        "[Larasati] Pengajuan PG-005 baru diajukan, menunggu verifikasi Anda"
      );
      assert.equal(
        generateEmailSubject("PG-006", "diajukan", undefined, "direktur_info"),
        "[Larasati] Pengajuan PG-006 (di atas Rp 1.000.000) diajukan, menunggu verifikasi Akuntan"
      );
      assert.equal(
        generateEmailSubject("PG-007", "disetujui", undefined, "akuntan_siap_bayar"),
        "[Larasati] Pengajuan PG-007 disetujui Direktur, siap dibayar"
      );
    });

    it("menambahkan awalan [UJI untuk: ...] saat mode redirect aktif", () => {
      const subject = generateEmailSubject(
        "PG-001",
        "perlu_revisi",
        "pengaju@mail-contoh.com"
      );
      assert.equal(
        subject,
        "[UJI untuk: pengaju@mail-contoh.com] [Larasati] Pengajuan PG-001 perlu revisi"
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

    it("menampilkan teks pembuka yang tepat untuk konteks akuntan_baru, direktur_info, dan akuntan_siap_bayar", () => {
      // akuntan_baru
      const resAkuntan = generateEmailContent({
        pengajuan: { ...mockPengajuan, status: "diajukan" },
        appBaseUrl: "https://larasati.com",
        context: "akuntan_baru",
      });
      assert.ok(
        resAkuntan.html.includes("menunggu verifikasi Anda") ||
          resAkuntan.text.includes("menunggu verifikasi Anda")
      );

      // direktur_info
      const resDirInfo = generateEmailContent({
        pengajuan: { ...mockPengajuan, status: "diajukan", jumlah: 1500000 },
        appBaseUrl: "https://larasati.com",
        context: "direktur_info",
      });
      assert.ok(
        resDirInfo.text.includes("menunggu verifikasi Akuntan terlebih dahulu") ||
          resDirInfo.html.includes("menunggu verifikasi Akuntan terlebih dahulu")
      );
      assert.ok(
        resDirInfo.text.includes("menerima notifikasi email kembali") ||
          resDirInfo.html.includes("menerima email kembali")
      );

      // akuntan_siap_bayar
      const resSiapBayar = generateEmailContent({
        pengajuan: { ...mockPengajuan, status: "disetujui" },
        appBaseUrl: "https://larasati.com",
        context: "akuntan_siap_bayar",
      });
      assert.ok(
        resSiapBayar.text.includes("disetujui oleh Direktur dan siap") ||
          resSiapBayar.html.includes("disetujui oleh Direktur dan")
      );
    });
  });

  describe("4. Pemilihan Penerima (filterEmailRecipients)", () => {
    const actorStafId = "user-staf-101";
    const actorAkuntanId = "user-akuntan-1";
    const actorDirekturId = "user-dir-1";

    const pengajuAktif: ProfileRecipient = {
      id: actorStafId,
      nama_lengkap: "Pengaju Fiktif",
      email: "pengaju@mail-contoh.com",
      aktif: true,
      peran: "staf",
    };
    const pengajuNonaktif: ProfileRecipient = {
      id: "user-staf-nonaktif",
      nama_lengkap: "Pengaju Nonaktif",
      email: "pengaju-nonaktif@mail-contoh.com",
      aktif: false,
      peran: "staf",
    };

    const akuntan1: ProfileRecipient = {
      id: "user-akuntan-1",
      nama_lengkap: "Akuntan Satu",
      email: "akuntan1@mail-contoh.com",
      aktif: true,
      peran: "akuntan",
    };
    const akuntan2: ProfileRecipient = {
      id: "user-akuntan-2",
      nama_lengkap: "Akuntan Dua",
      email: "akuntan2@mail-contoh.com",
      aktif: true,
      peran: "akuntan",
    };
    const akuntanNonaktif: ProfileRecipient = {
      id: "user-akuntan-3",
      nama_lengkap: "Akuntan Tiga Nonaktif",
      email: "akuntan3@mail-contoh.com",
      aktif: false,
      peran: "akuntan",
    };

    const direktur1: ProfileRecipient = {
      id: "user-dir-1",
      nama_lengkap: "Direktur Satu",
      email: "direktur1@mail-contoh.com",
      aktif: true,
      peran: "direktur",
    };
    const direktur2: ProfileRecipient = {
      id: "user-dir-2",
      nama_lengkap: "Direktur Dua",
      email: "direktur2@mail-contoh.com",
      aktif: true,
      peran: "direktur",
    };
    const direkturNonaktif: ProfileRecipient = {
      id: "user-dir-3",
      nama_lengkap: "Direktur Tiga Nonaktif",
      email: "direktur3@mail-contoh.com",
      aktif: false,
      peran: "direktur",
    };

    const dummyAkuntanList = [akuntan1, akuntan2, akuntanNonaktif];
    const dummyDirekturList = [direktur1, direktur2, direkturNonaktif];

    it("mengirim ke Pengaju untuk status perlu_revisi, ditolak, dan dibayar jika aktif dan bukan actor", () => {
      const resRevisi = filterEmailRecipients({
        statusBaru: "perlu_revisi",
        actorId: actorAkuntanId,
        pengaju: pengajuAktif,
      });
      assert.equal(resRevisi.length, 1);
      assert.equal(resRevisi[0].id, pengajuAktif.id);

      const resTolak = filterEmailRecipients({
        statusBaru: "ditolak",
        actorId: actorAkuntanId,
        pengaju: pengajuAktif,
      });
      assert.equal(resTolak.length, 1);

      const resBayar = filterEmailRecipients({
        statusBaru: "dibayar",
        actorId: actorAkuntanId,
        pengaju: pengajuAktif,
      });
      assert.equal(resBayar.length, 1);
    });

    it("MELEWATI Pengaju jika akunnya nonaktif", () => {
      const res = filterEmailRecipients({
        statusBaru: "perlu_revisi",
        actorId: actorAkuntanId,
        pengaju: pengajuNonaktif,
      });
      assert.equal(res.length, 0, "Pengaju nonaktif tidak boleh menerima email");
    });

    it("MELEWATI jika Pengaju adalah orang yang sama dengan pelaku perpindahan (actorId)", () => {
      const res = filterEmailRecipients({
        statusBaru: "perlu_revisi",
        actorId: pengajuAktif.id,
        pengaju: pengajuAktif,
      });
      assert.equal(res.length, 0, "Pelaku tidak boleh menerima email untuk aksinya sendiri");
    });

    it("mengirim ke seluruh Direktur aktif saat status menunggu_direktur", () => {
      const res = filterEmailRecipients({
        statusBaru: "menunggu_direktur",
        actorId: actorAkuntanId,
        direkturList: dummyDirekturList,
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
        actorId: direktur1.id,
        direkturList: [direktur1, direktur2],
      });
      assert.equal(res.length, 1, "Direktur pelaku harus dilewati");
      assert.equal(res[0].id, direktur2.id);
    });

    it("diajukan <= 1 jt hanya ke akuntan aktif", () => {
      const res = filterEmailRecipients({
        statusBaru: "diajukan",
        actorId: actorStafId,
        jumlah: 500_000,
        akuntanList: dummyAkuntanList,
        direkturList: dummyDirekturList,
      });
      assert.equal(res.length, 2, "Hanya 2 akuntan aktif yang menerima email");
      assert.deepEqual(
        res.map((r) => r.id),
        [akuntan1.id, akuntan2.id]
      );
      assert.equal(res[0].context, "akuntan_baru");
      assert.equal(res[1].context, "akuntan_baru");
    });

    it("diajukan tepat 1_000_000 hanya ke akuntan aktif (di atas 1 jt baru ke direktur)", () => {
      const res = filterEmailRecipients({
        statusBaru: "diajukan",
        actorId: actorStafId,
        jumlah: 1_000_000,
        akuntanList: dummyAkuntanList,
        direkturList: dummyDirekturList,
      });
      assert.equal(res.length, 2, "Tepat 1.000.000 tidak dikirim ke direktur");
      assert.deepEqual(
        res.map((r) => r.id),
        [akuntan1.id, akuntan2.id]
      );
    });

    it("diajukan 1_000_001 ke akuntan aktif dan direktur aktif", () => {
      const res = filterEmailRecipients({
        statusBaru: "diajukan",
        actorId: actorStafId,
        jumlah: 1_000_001,
        akuntanList: dummyAkuntanList,
        direkturList: dummyDirekturList,
      });
      assert.equal(res.length, 4, "2 akuntan aktif dan 2 direktur aktif");
      assert.deepEqual(
        res.map((r) => r.id),
        [akuntan1.id, akuntan2.id, direktur1.id, direktur2.id]
      );
      const akuntanRes = res.filter((r) => r.context === "akuntan_baru");
      const direkturRes = res.filter((r) => r.context === "direktur_info");
      assert.equal(akuntanRes.length, 2);
      assert.equal(direkturRes.length, 2);
    });

    it("diajukan melewati akuntan jika akuntan adalah pelaku (actorId)", () => {
      const res = filterEmailRecipients({
        statusBaru: "diajukan",
        actorId: akuntan1.id,
        jumlah: 500_000,
        akuntanList: dummyAkuntanList,
        direkturList: dummyDirekturList,
      });
      assert.equal(res.length, 1);
      assert.equal(res[0].id, akuntan2.id, "Akuntan pelaku harus dilewati");
    });

    it("disetujui oleh direktur (peran pelaku = direktur) dikirim ke pengaju dan akuntan aktif", () => {
      const res = filterEmailRecipients({
        statusBaru: "disetujui",
        actorId: actorDirekturId,
        actorRole: "direktur",
        jumlah: 500_000,
        pengaju: pengajuAktif,
        akuntanList: dummyAkuntanList,
      });
      assert.equal(res.length, 3, "Pengaju dan 2 akuntan aktif");
      assert.equal(res[0].id, pengajuAktif.id);
      assert.equal(res[0].context, "pengaju");
      assert.equal(res[1].id, akuntan1.id);
      assert.equal(res[1].context, "akuntan_siap_bayar");
      assert.equal(res[2].id, akuntan2.id);
      assert.equal(res[2].context, "akuntan_siap_bayar");
    });

    it("disetujui dengan jumlah > 1_000_000 dikirim ke pengaju dan akuntan aktif", () => {
      const res = filterEmailRecipients({
        statusBaru: "disetujui",
        actorId: actorDirekturId,
        jumlah: 2_000_000,
        pengaju: pengajuAktif,
        akuntanList: dummyAkuntanList,
      });
      assert.equal(res.length, 3);
      assert.equal(res[0].id, pengajuAktif.id);
      assert.equal(res[1].context, "akuntan_siap_bayar");
    });

    it("disetujui oleh akuntan langsung (jumlah <= 1_000_000) dikirim ke pengaju saja", () => {
      const res = filterEmailRecipients({
        statusBaru: "disetujui",
        actorId: actorAkuntanId,
        actorRole: "akuntan",
        jumlah: 750_000,
        pengaju: pengajuAktif,
        akuntanList: dummyAkuntanList,
      });
      assert.equal(res.length, 1, "Hanya pengaju yang menerima email");
      assert.equal(res[0].id, pengajuAktif.id);
      assert.equal(res[0].context, "pengaju");
    });

    it("menghapus duplikat berdasarkan ID dan email", () => {
      const duplicateAkuntanList = [
        akuntan1,
        { ...akuntan1, id: "different-id" }, // email sama
        { ...akuntan2, email: "duplicate-email@mail-contoh.com" },
        { ...akuntan2, id: akuntan2.id, email: "other@mail-contoh.com" }, // id sama
      ];
      const res = filterEmailRecipients({
        statusBaru: "diajukan",
        actorId: actorStafId,
        jumlah: 500_000,
        akuntanList: duplicateAkuntanList,
      });
      assert.equal(res.length, 2, "Duplikat ID atau email harus dieliminasi");
    });

    it("TIDAK mengirim email untuk status draf atau dibatalkan", () => {
      assert.equal(
        filterEmailRecipients({
          statusBaru: "draf",
          actorId: actorStafId,
          pengaju: pengajuAktif,
          akuntanList: dummyAkuntanList,
        }).length,
        0
      );
      assert.equal(
        filterEmailRecipients({
          statusBaru: "dibatalkan",
          actorId: actorStafId,
          pengaju: pengajuAktif,
          akuntanList: dummyAkuntanList,
        }).length,
        0
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
      assert.equal(isDummyDomain("user@mail-contoh.com"), false);
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
        "rina@larasati.test:pengaju@mail-contoh.com;dimas@larasati.test:tujuan1@mail-contoh.com;laras@larasati.test:tujuan2@mail-contoh.com"
      );
      assert.equal(mapping.get("rina@larasati.test"), "pengaju@mail-contoh.com");
      assert.equal(mapping.get("dimas@larasati.test"), "tujuan1@mail-contoh.com");
      assert.equal(mapping.get("laras@larasati.test"), "tujuan2@mail-contoh.com");
      assert.equal(mapping.get("unknown@larasati.test"), undefined);
    });
  });

  describe("8. Kasus Persetujuan Rina oleh Diimas & Penanganan Error", () => {
    const dimasActorId = "user-dimas-akuntan";
    const rinaPengaju: ProfileRecipient = {
      id: "user-rina-staf",
      nama_lengkap: "Rina Anggraini",
      email: "pengaju@mail-contoh.com",
      aktif: true,
    };
    const pengajuanDisetujui: PengajuanEmailData = {
      id: 47,
      nomor: "PG-202610-0047",
      jenis: "biaya",
      jumlah: 500000,
      status: "disetujui",
      catatan_peninjau: null,
    };

    it("Diimas menyetujui pengajuan milik Rina: email ditujukan kepada Rina", async () => {
      process.env.EMAIL_MODE = "log";
      (process.env as Record<string, string | undefined>).NODE_ENV = "development";

      // 1. Filter penerima memasukkan Rina
      const recipients = filterEmailRecipients({
        statusBaru: "disetujui",
        actorId: dimasActorId,
        pengaju: rinaPengaju,
      });
      assert.equal(recipients.length, 1);
      assert.equal(recipients[0].id, rinaPengaju.id);
      assert.equal(recipients[0].email, "pengaju@mail-contoh.com");

      // 2. Eksekusi pengiriman notifikasi pengajuan
      const result = await kirimNotifikasiPengajuan({
        pengajuan: pengajuanDisetujui,
        actorId: dimasActorId,
        pengajuProfile: rinaPengaju,
      });

      assert.equal(result.success, true);
      assert.equal(result.count, 1);
      assert.equal(result.notice, "Email terkirim ke pe***@mail-contoh.com");
    });

    it("Pengaju tidak ditemukan: kirimNotifikasiPengajuan mengembalikan success: false dengan notice yang jelas", async () => {
      const result = await kirimNotifikasiPengajuan({
        pengajuan: pengajuanDisetujui,
        actorId: dimasActorId,
        pengajuProfile: null,
      });

      assert.equal(result.success, false);
      assert.equal(result.count, 0);
      assert.ok(result.notice?.includes("Profil pengaju tidak ditemukan"));
    });

    it("Pengaju nonaktif: kirimNotifikasiPengajuan mengembalikan success: false dengan notice akun nonaktif", async () => {
      const rinaNonaktif: ProfileRecipient = {
        ...rinaPengaju,
        aktif: false,
      };

      const result = await kirimNotifikasiPengajuan({
        pengajuan: pengajuanDisetujui,
        actorId: dimasActorId,
        pengajuProfile: rinaNonaktif,
      });

      assert.equal(result.success, false);
      assert.equal(result.count, 0);
      assert.ok(result.notice?.includes("nonaktif"));
    });

    it("Pengaju dan penyetuju adalah orang yang sama: email dilewati tanpa error", async () => {
      const result = await kirimNotifikasiPengajuan({
        pengajuan: pengajuanDisetujui,
        actorId: rinaPengaju.id, // Rina pelaku transisi
        pengajuProfile: rinaPengaju,
      });

      assert.equal(result.success, true);
      assert.equal(result.count, 0);
      assert.equal(result.notice, undefined);
    });

    it("Email mode mati: sendSingleEmail memberi tahu bahwa email dinonaktifkan", async () => {
      process.env.EMAIL_MODE = "mati";

      const res = await sendSingleEmail({
        recipient: rinaPengaju,
        pengajuan: pengajuanDisetujui,
        appBaseUrl: "https://larasati.com",
      });

      assert.equal(res.status, "skipped");
      assert.ok(res.notice?.includes("EMAIL_MODE=mati"));
    });

    it("Konfigurasi belum lengkap (CONFIG_MISSING): mengembalikan failed dengan notice konfigurasi", async () => {
      process.env.EMAIL_MODE = "kirim";
      delete process.env.RESEND_API_KEY;
      delete process.env.EMAIL_PENGIRIM;
      delete process.env.EMAIL_FROM;

      const res = await sendSingleEmail({
        recipient: rinaPengaju,
        pengajuan: pengajuanDisetujui,
        appBaseUrl: "https://larasati.com",
      });

      assert.equal(res.status, "failed");
      assert.equal(res.errorType, "CONFIG_MISSING");
      assert.ok(res.notice?.includes("Konfigurasi"));
    });

    it("Resend mengembalikan error: sendSingleEmail mencatat error provider dan notice kegagalan", async () => {
      const origFetch = globalThis.fetch;
      try {
        process.env.EMAIL_MODE = "kirim";
        process.env.RESEND_API_KEY = "re_dummy_test_key";
        process.env.EMAIL_PENGIRIM = "notifikasi@mail-contoh.com";

        globalThis.fetch = async () =>
          new Response("Domain not verified", {
            status: 403,
            statusText: "Forbidden",
          });

        const res = await sendSingleEmail({
          recipient: rinaPengaju,
          pengajuan: pengajuanDisetujui,
          appBaseUrl: "https://larasati.com",
        });

        assert.equal(res.status, "failed");
        assert.equal(res.errorType, "PROVIDER_ERROR");
        assert.ok(res.notice?.includes("ditolak"));
      } finally {
        globalThis.fetch = origFetch;
      }
    });

    it("Resend rate limit (429): errorType RATE_LIMIT dan notice penundaan tercatat", async () => {
      const origFetch = globalThis.fetch;
      try {
        process.env.EMAIL_MODE = "kirim";
        process.env.RESEND_API_KEY = "re_dummy_test_key";
        process.env.EMAIL_PENGIRIM = "notifikasi@mail-contoh.com";

        globalThis.fetch = async () =>
          new Response("Too Many Requests", {
            status: 429,
            statusText: "Too Many Requests",
          });

        const res = await sendSingleEmail({
          recipient: rinaPengaju,
          pengajuan: pengajuanDisetujui,
          appBaseUrl: "https://larasati.com",
        });

        assert.equal(res.status, "failed");
        assert.equal(res.errorType, "RATE_LIMIT");
        assert.ok(res.notice?.includes("rate limit"));
      } finally {
        globalThis.fetch = origFetch;
      }
    });

    it("Resend sukses: status HTTP 200 dan message ID Resend tercatat dengan benar", async () => {
      const origFetch = globalThis.fetch;
      try {
        process.env.EMAIL_MODE = "kirim";
        process.env.RESEND_API_KEY = "re_dummy_test_key";
        process.env.EMAIL_PENGIRIM = "notifikasi@mail-contoh.com";

        globalThis.fetch = async () =>
          new Response(JSON.stringify({ id: "msg_resend_success_999" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });

        const result = await kirimNotifikasiPengajuan({
          pengajuan: pengajuanDisetujui,
          actorId: dimasActorId,
          pengajuProfile: rinaPengaju,
        });

        assert.equal(result.success, true);
        assert.equal(result.count, 1);
        assert.equal(result.details?.[0].status, "sent");
        assert.equal(result.details?.[0].messageId, "msg_resend_success_999");
        assert.equal(result.details?.[0].recipientEmail, "pengaju@mail-contoh.com");
        assert.equal(result.notice, "Email terkirim ke pe***@mail-contoh.com (ID: msg_rese)");
      } finally {
        globalThis.fetch = origFetch;
      }
    });

    it("Resend sukses dengan EMAIL_UJI_PETA: ringkasan notice memakai recipientEmail yang dialihkan dan disamarkan", async () => {
      const origFetch = globalThis.fetch;
      try {
        process.env.EMAIL_MODE = "kirim";
        process.env.RESEND_API_KEY = "re_dummy_test_key";
        process.env.EMAIL_PENGIRIM = "notifikasi@mail-contoh.com";
        process.env.EMAIL_UJI_PETA = "pengaju@mail-contoh.com:tujuan@mail-contoh.com";

        globalThis.fetch = async () =>
          new Response(JSON.stringify({ id: "msg_peta_success_12345" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });

        const result = await kirimNotifikasiPengajuan({
          pengajuan: pengajuanDisetujui,
          actorId: dimasActorId,
          pengajuProfile: rinaPengaju,
        });

        assert.equal(result.success, true);
        assert.equal(result.count, 1);
        assert.equal(result.details?.[0].status, "sent");
        assert.equal(result.details?.[0].recipientEmail, "tujuan@mail-contoh.com");
        assert.equal(
          result.notice,
          "Email terkirim ke tu***@mail-contoh.com (ID: msg_peta)"
        );
      } finally {
        globalThis.fetch = origFetch;
      }
    });
  });

  describe("9. Penyamaran Email (maskEmail)", () => {
    it("menampilkan 2 huruf pertama nama pengguna sebelum @ lalu *** dan domainnya", () => {
      assert.equal(maskEmail("pengaju@mail-contoh.com"), "pe***@mail-contoh.com");
      assert.equal(maskEmail("tujuan.testing@mail-contoh.com"), "tu***@mail-contoh.com");
      assert.equal(maskEmail("suci@perusahaan.co.id"), "su***@perusahaan.co.id");
    });

    it("menangani nama pengguna pendek (<= 2 huruf)", () => {
      assert.equal(maskEmail("ab@domain.com"), "ab***@domain.com");
      assert.equal(maskEmail("a@domain.com"), "a***@domain.com");
    });

    it("menangani string kosong atau format tanpa @", () => {
      assert.equal(maskEmail(""), "");
      assert.equal(maskEmail("plaintext"), "plaintext");
    });
  });

  describe("10. Pembuatan Kunci Idempotency (generateIdempotencyKey)", () => {
    it("menghasilkan hash SHA-256 heksadesimal dengan format pg-<hash> (67 karakter)", () => {
      const key = generateIdempotencyKey({
        pengajuanId: 42,
        status: "diajukan",
        context: "akuntan_baru",
        updatedAt: "2026-10-29T10:00:00Z",
        recipientEmail: "akuntan1@mail-contoh.com",
      });
      assert.ok(key.startsWith("pg-"), "Kunci harus berawalan pg-");
      assert.equal(key.length, 67, "3 karakter awalan + 64 karakter hash SHA-256");
      assert.match(key, /^pg-[a-f0-9]{64}$/);
    });

    it("menghasilkan kunci berbeda untuk penerima berbeda", () => {
      const key1 = generateIdempotencyKey({
        pengajuanId: 42,
        status: "diajukan",
        context: "akuntan_baru",
        updatedAt: "2026-10-29T10:00:00Z",
        recipientEmail: "akuntan1@mail-contoh.com",
      });
      const key2 = generateIdempotencyKey({
        pengajuanId: 42,
        status: "diajukan",
        context: "akuntan_baru",
        updatedAt: "2026-10-29T10:00:00Z",
        recipientEmail: "akuntan2@mail-contoh.com",
      });
      assert.notEqual(key1, key2);
    });

    it("menghasilkan kunci berbeda saat updated_at berubah (pengajuan diajukan ulang)", () => {
      const keyFirst = generateIdempotencyKey({
        pengajuanId: 42,
        status: "diajukan",
        context: "akuntan_baru",
        updatedAt: "2026-10-29T10:00:00Z",
        recipientEmail: "akuntan1@mail-contoh.com",
      });
      const keyRevisi = generateIdempotencyKey({
        pengajuanId: 42,
        status: "diajukan",
        context: "akuntan_baru",
        updatedAt: "2026-10-29T11:00:00Z",
        recipientEmail: "akuntan1@mail-contoh.com",
      });
      assert.notEqual(keyFirst, keyRevisi);
    });

    it("menghasilkan kunci berbeda untuk konteks berbeda", () => {
      const keyAkuntan = generateIdempotencyKey({
        pengajuanId: 42,
        status: "diajukan",
        context: "akuntan_baru",
        recipientEmail: "user@mail-contoh.com",
      });
      const keyDirektur = generateIdempotencyKey({
        pengajuanId: 42,
        status: "diajukan",
        context: "direktur_info",
        recipientEmail: "user@mail-contoh.com",
      });
      assert.notEqual(keyAkuntan, keyDirektur);
    });
  });

  describe("11. Pengajuan Buatan Akuntan (Status menunggu_direktur tanpa batas nominal)", () => {
    const akuntanPembuat: ProfileRecipient = {
      id: "user-dimas-akuntan",
      nama_lengkap: "Dimas Akuntan",
      email: "dimas.akuntan@mail-contoh.com",
      aktif: true,
      peran: "akuntan",
    };

    const akuntanLain: ProfileRecipient = {
      id: "user-akuntan-2",
      nama_lengkap: "Akuntan Rekan",
      email: "akuntan2@mail-contoh.com",
      aktif: true,
      peran: "akuntan",
    };

    const direktur1: ProfileRecipient = {
      id: "user-dir-1",
      nama_lengkap: "Direktur Satu",
      email: "direktur1@mail-contoh.com",
      aktif: true,
      peran: "direktur",
    };

    const direktur2: ProfileRecipient = {
      id: "user-dir-2",
      nama_lengkap: "Direktur Dua",
      email: "direktur2@mail-contoh.com",
      aktif: true,
      peran: "direktur",
    };

    const direkturNonaktif: ProfileRecipient = {
      id: "user-dir-3",
      nama_lengkap: "Direktur Nonaktif",
      email: "direktur3@mail-contoh.com",
      aktif: false,
      peran: "direktur",
    };

    const dummyAkuntanList = [akuntanPembuat, akuntanLain];
    const dummyDirekturList = [direktur1, direktur2, direkturNonaktif];

    it("pengajuan nominal kecil (Rp 50.000): semua Direktur aktif menerima email 'menunggu persetujuan Anda' tanpa batas ambang", () => {
      const res = filterEmailRecipients({
        statusBaru: "menunggu_direktur",
        actorId: akuntanPembuat.id,
        actorRole: "akuntan",
        jumlah: 50_000,
        pengaju: akuntanPembuat,
        akuntanList: dummyAkuntanList,
        direkturList: dummyDirekturList,
      });

      // Semua Direktur aktif (2 orang) menerima email, direktur nonaktif dilewati
      assert.equal(res.length, 2, "Hanya 2 direktur aktif yang menerima");
      assert.deepEqual(
        res.map((r) => r.id),
        [direktur1.id, direktur2.id]
      );
      assert.equal(res[0].context, "direktur_approval");
      assert.equal(res[1].context, "direktur_approval");

      // Subjek memuat 'menunggu persetujuan Anda'
      const subject = generateEmailSubject("PG-001", "menunggu_direktur", undefined, res[0].context);
      assert.equal(subject, "[Larasati] Pengajuan PG-001 menunggu persetujuan Anda");
    });

    it("pengajuan nominal besar (Rp 5.000.000): semua Direktur aktif menerima email yang sama persis", () => {
      const res = filterEmailRecipients({
        statusBaru: "menunggu_direktur",
        actorId: akuntanPembuat.id,
        actorRole: "akuntan",
        jumlah: 5_000_000,
        pengaju: akuntanPembuat,
        akuntanList: dummyAkuntanList,
        direkturList: dummyDirekturList,
      });

      assert.equal(res.length, 2);
      assert.deepEqual(
        res.map((r) => r.id),
        [direktur1.id, direktur2.id]
      );
      assert.equal(res[0].context, "direktur_approval");
      assert.equal(res[1].context, "direktur_approval");

      const subject = generateEmailSubject("PG-002", "menunggu_direktur", undefined, res[0].context);
      assert.equal(subject, "[Larasati] Pengajuan PG-002 menunggu persetujuan Anda");
    });

    it("jalur 'diajukan' tidak dipicu: Akuntan lain dan pengaju TIDAK menerima email, Direktur bukan 'direktur_info'", () => {
      const res = filterEmailRecipients({
        statusBaru: "menunggu_direktur",
        actorId: akuntanPembuat.id,
        actorRole: "akuntan",
        jumlah: 50_000,
        pengaju: akuntanPembuat,
        akuntanList: dummyAkuntanList,
        direkturList: dummyDirekturList,
      });

      // 1. Tidak ada penerima berkonteks 'akuntan_baru' (jalur status diajukan)
      assert.equal(
        res.some((r) => r.context === "akuntan_baru"),
        false,
        "Tidak boleh ada notifikasi akuntan_baru"
      );

      // 2. Akuntan rekan maupun pengaju sendiri tidak ada dalam daftar penerima
      assert.equal(
        res.some((r) => r.peran === "akuntan" || r.id === akuntanPembuat.id),
        false,
        "Akuntan tidak boleh menjadi penerima pada status menunggu_direktur"
      );

      // 3. Direktur menerima 'direktur_approval' (aksi langsung), BUKAN 'direktur_info' (menunggu akuntan)
      assert.equal(
        res.some((r) => r.context === "direktur_info"),
        false,
        "Direktur tidak menerima tembusan info melainkan permintaan persetujuan langsung"
      );
      assert.ok(res.every((r) => r.context === "direktur_approval"));
    });

    it("mock kirimNotifikasiPengajuan: mengirim email 'menunggu persetujuan Anda' ke Direktur untuk pengajuan akuntan Rp 50.000", async () => {
      const origFetch = globalThis.fetch;
      const sentPayloads: Array<{ to: string; subject: string; html: string }> = [];

      try {
        process.env.EMAIL_MODE = "kirim";
        process.env.RESEND_API_KEY = "re_dummy_test_key";
        process.env.EMAIL_PENGIRIM = "notifikasi@mail-contoh.com";

        globalThis.fetch = async (_url, options) => {
          const body = JSON.parse((options?.body as string) || "{}");
          sentPayloads.push({
            to: Array.isArray(body.to) ? body.to[0] : body.to,
            subject: body.subject,
            html: body.html,
          });
          return new Response(JSON.stringify({ id: `msg_mock_${sentPayloads.length}` }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        };

        const pengajuanKecil: PengajuanEmailData = {
          id: 88,
          nomor: "PG-202610-0088",
          jenis: "operasional",
          jumlah: 50_000,
          status: "menunggu_direktur",
          updated_at: "2026-10-29T10:00:00Z",
        };

        const result = await kirimNotifikasiPengajuan({
          pengajuan: pengajuanKecil,
          actorId: akuntanPembuat.id,
          actorRole: "akuntan",
          pengajuProfile: akuntanPembuat,
          akuntanProfiles: dummyAkuntanList,
          direkturProfiles: dummyDirekturList,
        });

        assert.equal(result.success, true);
        assert.equal(result.count, 2, "Harus mengirim tepat ke 2 direktur aktif");
        assert.equal(sentPayloads.length, 2);

        // Pastikan terkirim ke email direktur1 dan direktur2, bukan akuntan
        assert.equal(sentPayloads[0].to, "direktur1@mail-contoh.com");
        assert.equal(sentPayloads[1].to, "direktur2@mail-contoh.com");

        // Pastikan subjeknya memuat 'menunggu persetujuan Anda'
        assert.ok(
          sentPayloads[0].subject.includes("menunggu persetujuan Anda"),
          "Subjek harus menunggu persetujuan Anda"
        );
        assert.ok(
          sentPayloads[1].subject.includes("menunggu persetujuan Anda"),
          "Subjek harus menunggu persetujuan Anda"
        );

        // Pastikan teks body memuat 'memerlukan persetujuan Anda sebagai Direktur'
        assert.ok(
          sentPayloads[0].html.includes("memerlukan persetujuan Anda sebagai Direktur")
        );
      } finally {
        globalThis.fetch = origFetch;
      }
    });
  });
});
