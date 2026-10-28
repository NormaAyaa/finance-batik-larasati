import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluasiDuplikatPengajuan,
  formatPeringatanDuplikat,
  hitungSha256Buffer,
  type PengajuanDuplikatItem,
  type CekDuplikatPengajuanParams,
} from "@/lib/pengajuan/duplikat";

describe("Fitur Deteksi Pengajuan Duplikat - Unit Tests", () => {
  const mockUserId = "usr-111-staf";

  const sampleCandidates: PengajuanDuplikatItem[] = [
    {
      id: 27,
      nomor: "PG-202610-027",
      status: "diajukan",
      pengaju_id: mockUserId,
      tanggal_transaksi: "2026-10-27",
      jumlah: 770000,
      keterangan: "SURYA KENCANA - Kain Mori Primissima",
      bukti_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    },
    {
      id: 28,
      nomor: "PG-202610-028",
      status: "disetujui",
      pengaju_id: mockUserId,
      tanggal_transaksi: "2026-10-27",
      jumlah: 770000,
      keterangan: "SURYA KENCANA - Lilin & Canting",
      bukti_hash: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
    },
    {
      id: 25,
      nomor: "PG-202610-025",
      status: "ditolak",
      pengaju_id: mockUserId,
      tanggal_transaksi: "2026-10-25",
      jumlah: 500000,
      keterangan: "Pengajuan yang ditolak",
      bukti_hash: "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    },
    {
      id: 24,
      nomor: "PG-202610-024",
      status: "disetujui",
      pengaju_id: "other-user-uuid",
      tanggal_transaksi: "2026-10-24",
      jumlah: 300000,
      keterangan: "Milik staf lain",
      bukti_hash: "1111111111111111111111111111111111111111111111111111111111111111",
    },
  ];

  it("1. Mendeteksi Duplikat PASTI saat bukti_hash sama persis", () => {
    const params: CekDuplikatPengajuanParams = {
      buktiHash: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
      pengajuId: mockUserId,
      tanggalTransaksi: "2026-10-28", // berbeda tanggal tetap pasti karena hash sama
      jumlah: 150000,
    };

    const res = evaluasiDuplikatPengajuan(sampleCandidates, params);

    assert.equal(res.isDuplikat, true);
    assert.equal(res.jenisKecocokan, "pasti");
    assert.equal(res.pengajuan?.id, 28);
    assert.equal(res.pengajuan?.nomor, "PG-202610-028");
    assert.equal(res.pengajuan?.status, "disetujui");
    assert.match(res.pesanPeringatan || "", /Nota ini sudah dipakai pada PG-202610-028 \(Disetujui\)/);
  });

  it("2. Mendeteksi Duplikat KEMUNGKINAN saat tanggal dan jumlah sama, namun hash berbeda/belum ada", () => {
    const params: CekDuplikatPengajuanParams = {
      buktiHash: "different_or_new_hash_12345",
      pengajuId: mockUserId,
      tanggalTransaksi: "2026-10-27",
      jumlah: 770000,
    };

    const res = evaluasiDuplikatPengajuan(sampleCandidates, params);

    assert.equal(res.isDuplikat, true);
    assert.equal(res.jenisKecocokan, "kemungkinan");
    assert.equal(res.pengajuan?.tanggal_transaksi, "2026-10-27");
    assert.equal(res.pengajuan?.jumlah, 770000);
    assert.match(res.pesanPeringatan || "", /Pengajuan serupa dengan tanggal 2026-10-27 dan nominal Rp 770\.000/);
  });

  it("3. Prioritas: Duplikat PASTI mengalahkan duplikat KEMUNGKINAN jika keduanya memenuhi kriteria", () => {
    const params: CekDuplikatPengajuanParams = {
      buktiHash: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
      pengajuId: mockUserId,
      tanggalTransaksi: "2026-10-27",
      jumlah: 770000,
    };

    const res = evaluasiDuplikatPengajuan(sampleCandidates, params);

    assert.equal(res.isDuplikat, true);
    assert.equal(res.jenisKecocokan, "pasti");
    assert.equal(res.pengajuan?.nomor, "PG-202610-028");
  });

  it("4. Mengabaikan pengajuan yang berstatus 'ditolak'", () => {
    const params: CekDuplikatPengajuanParams = {
      buktiHash: "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      pengajuId: mockUserId,
      tanggalTransaksi: "2026-10-25",
      jumlah: 500000,
    };

    const res = evaluasiDuplikatPengajuan(sampleCandidates, params);

    // Karena id 25 berstatus ditolak, tidak boleh dianggap duplikat
    assert.equal(res.isDuplikat, false);
    assert.equal(res.jenisKecocokan, undefined);
  });

  it("5. Mengabaikan pengajuan yang cocok dengan excludeId (mode edit diri sendiri)", () => {
    const params: CekDuplikatPengajuanParams = {
      buktiHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      pengajuId: mockUserId,
      tanggalTransaksi: "2026-10-27",
      jumlah: 770000,
      excludeId: 27, // Sedang mengedit pengajuan #27
    };

    const res = evaluasiDuplikatPengajuan(sampleCandidates, params);

    // Baris #27 dilewati karena excludeId. Namun ada baris #28 yang punya tanggal & jumlah sama
    assert.equal(res.isDuplikat, true);
    assert.equal(res.jenisKecocokan, "kemungkinan");
    assert.equal(res.pengajuan?.id, 28);
  });

  it("6. Mengabaikan pengajuan milik pengguna lain (patuhi data milik pengguna sendiri)", () => {
    const params: CekDuplikatPengajuanParams = {
      buktiHash: "1111111111111111111111111111111111111111111111111111111111111111",
      pengajuId: mockUserId,
      tanggalTransaksi: "2026-10-24",
      jumlah: 300000,
    };

    const res = evaluasiDuplikatPengajuan(sampleCandidates, params);

    // Baris #24 milik 'other-user-uuid', bukan mockUserId
    assert.equal(res.isDuplikat, false);
  });

  it("7. Mengembalikan isDuplikat: false jika tidak ada data yang cocok", () => {
    const params: CekDuplikatPengajuanParams = {
      buktiHash: "unique_fresh_hash_99999",
      pengajuId: mockUserId,
      tanggalTransaksi: "2026-10-20",
      jumlah: 125000,
    };

    const res = evaluasiDuplikatPengajuan(sampleCandidates, params);

    assert.equal(res.isDuplikat, false);
    assert.equal(res.jenisKecocokan, undefined);
    assert.equal(res.pengajuan, undefined);
  });

  it("8. Fungsi formatPeringatanDuplikat memformat teks peringatan dengan rapi", () => {
    const item = {
      id: 28,
      nomor: "PG-202610-028",
      status: "disetujui" as const,
      tanggal_transaksi: "2026-10-27",
      jumlah: 770000,
    };

    const pesanPasti = formatPeringatanDuplikat("pasti", item);
    assert.equal(pesanPasti, "Nota ini sudah dipakai pada PG-202610-028 (Disetujui).");

    const itemDraf = {
      id: 15,
      nomor: null,
      status: "draf" as const,
      tanggal_transaksi: "2026-10-26",
      jumlah: 250000,
    };
    const pesanDraf = formatPeringatanDuplikat("pasti", itemDraf);
    assert.equal(pesanDraf, "Nota ini sudah dipakai pada Draf #15 (Draf).");
  });

  it("9. Menghitung hash SHA-256 berkas dengan benar", async () => {
    // String "Halo CV Batik Larasati" -> SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode("Halo CV Batik Larasati");
    const hash = await hitungSha256Buffer(data.buffer);

    assert.equal(typeof hash, "string");
    assert.equal(hash.length, 64);
    assert.equal(/^[a-f0-9]{64}$/.test(hash), true);
  });
});
