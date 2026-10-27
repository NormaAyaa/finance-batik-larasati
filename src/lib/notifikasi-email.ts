import fs from "node:fs/promises";
import path from "node:path";
import { formatRupiah } from "@/lib/utils/formatters";
import type { StatusPengajuan } from "@/types/database";

export interface PengajuanEmailData {
  id: number;
  nomor: string | null;
  jenis: string;
  jumlah: number;
  status: StatusPengajuan;
  catatan_peninjau?: string | null;
}

export interface ProfileRecipient {
  id: string;
  nama_lengkap: string;
  email: string;
  aktif: boolean;
}

export type EmailSendStatus = "sent" | "logged" | "skipped" | "failed";

export interface EmailSendResult {
  status: EmailSendStatus;
  errorType?: "TIMEOUT" | "RATE_LIMIT" | "CONFIG_MISSING" | "DUMMY_DOMAIN" | "PROVIDER_ERROR" | "NETWORK_ERROR";
  notice?: string;
  messageId?: string;
  recipientEmail?: string;
}

export interface KirimNotifikasiResult {
  success: boolean;
  count: number;
  notice?: string;
  details?: EmailSendResult[];
}

/**
 * Normalisasi APP_BASE_URL:
 * - Menghilangkan trailing slash
 * - Hanya menerima protokol http:// atau https://
 * - Menggunakan nama persis APP_BASE_URL
 */
export function normalizeAppBaseUrl(rawUrl?: string): string {
  if (!rawUrl) return "";
  const trimmed = rawUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return "";
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return trimmed.replace(/\/+$/, "");
  } catch {
    return "";
  }
}

/**
 * Escape karakter HTML untuk mencegah XSS pada teks yang berasal dari pengguna.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Memeriksa apakah alamat email menggunakan domain contoh/pengujian
 * (.test, .example, .invalid, .localhost).
 */
export function isDummyDomain(email: string): boolean {
  if (!email) return false;
  const trimmed = email.trim().toLowerCase();
  return /\.(test|example|invalid|localhost)$/i.test(trimmed);
}

/**
 * Menyamarkan alamat email untuk tampilan UI / log:
 * Menampilkan 2 huruf pertama sebelum @ lalu "***", dan domainnya.
 * Contoh: "rinalrsti@gmail.com" -> "ri***@gmail.com"
 */
export function maskEmail(email: string): string {
  if (!email) return "";
  const trimmed = email.trim();
  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex <= 0) return trimmed;
  const user = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  const prefix = user.slice(0, 2);
  return `${prefix}***@${domain}`;
}

/**
 * Label status pengajuan dalam Bahasa Indonesia.
 */
export function getStatusLabel(status: StatusPengajuan): string {
  switch (status) {
    case "draf":
      return "Draf";
    case "diajukan":
      return "Diajukan";
    case "menunggu_direktur":
      return "Menunggu Persetujuan Direktur";
    case "disetujui":
      return "Disetujui";
    case "perlu_revisi":
      return "Perlu Revisi";
    case "ditolak":
      return "Ditolak";
    case "dibayar":
      return "Sudah Dibayar";
    case "dibatalkan":
      return "Dibatalkan";
    default:
      return status;
  }
}

/**
 * Membentuk subjek email berdasarkan status pengajuan.
 * Menghapus karakter baris baru (\r, \n) untuk mencegah email header injection.
 */
export function generateEmailSubject(
  nomor: string | null,
  statusBaru: StatusPengajuan,
  redirectOriginalRecipient?: string
): string {
  const nomorStr = nomor ? nomor.trim() : "-";
  let suffix = "";

  switch (statusBaru) {
    case "disetujui":
      suffix = "telah disetujui";
      break;
    case "perlu_revisi":
      suffix = "perlu revisi";
      break;
    case "ditolak":
      suffix = "ditolak";
      break;
    case "dibayar":
      suffix = "sudah dibayar";
      break;
    case "menunggu_direktur":
      suffix = "menunggu persetujuan Anda";
      break;
    default:
      suffix = statusBaru;
      break;
  }

  let subject = `[Larasati] Pengajuan ${nomorStr} ${suffix}`;

  if (redirectOriginalRecipient) {
    subject = `[UJI untuk: ${redirectOriginalRecipient}] ${subject}`;
  }

  // Buang karakter baris baru (CR & LF) dari subjek untuk cegah header injection
  return subject.replace(/[\r\n]+/g, " ").trim();
}

/**
 * Membangun badan email versi Plain Text dan HTML.
 * HANYA memuat: nomor, jenis, jumlah (format rupiah), status baru, catatan peninjau (jika ada),
 * dan tautan APP_BASE_URL/pengajuan/<id>.
 * JANGAN memuat bukti, URL bertanda tangan, saldo, nomor akun, atau data pengguna lain.
 */
export function generateEmailContent(params: {
  pengajuan: PengajuanEmailData;
  appBaseUrl: string;
}): { text: string; html: string } {
  const { pengajuan, appBaseUrl } = params;

  const nomorBersih = pengajuan.nomor ? escapeHtml(pengajuan.nomor) : "-";
  const jenisBersih = escapeHtml(pengajuan.jenis);
  const statusLabel = getStatusLabel(pengajuan.status);
  const jumlahFormatted = formatRupiah(pengajuan.jumlah);

  const detailUrl = appBaseUrl
    ? `${appBaseUrl}/pengajuan/${pengajuan.id}`
    : `/pengajuan/${pengajuan.id}`;

  const catatanText = pengajuan.catatan_peninjau?.trim()
    ? `\nCatatan Peninjau: ${pengajuan.catatan_peninjau.trim()}\n`
    : "";

  const catatanHtml = pengajuan.catatan_peninjau?.trim()
    ? `<div style="margin: 16px 0; padding: 12px 16px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
        <strong style="color: #92400e;">Catatan Peninjau:</strong>
        <p style="margin: 4px 0 0 0; color: #78350f; white-space: pre-wrap;">${escapeHtml(pengajuan.catatan_peninjau.trim())}</p>
      </div>`
    : "";

  // Plain Text Body
  const text = `Halo,

Pemberitahuan perubahan status pengajuan keuangan CV Batik Larasati:

Nomor Pengajuan: ${pengajuan.nomor || "-"}
Jenis: ${pengajuan.jenis}
Jumlah: ${jumlahFormatted}
Status Baru: ${statusLabel}${catatanText}
Untuk melihat rincian pengajuan, buka tautan berikut:
${detailUrl}

--
Sistem Keuangan CV Batik Larasati
Email ini dikirim otomatis, mohon tidak membalas email ini.`;

  // HTML Body
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Notifikasi Pengajuan Keuangan</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
    <tr>
      <td style="padding: 24px; background-color: #78350f; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: bold; color: #ffffff;">CV Batik Larasati</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #fde68a;">Sistem Pengelolaan Keuangan Internal</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px;">
        <p style="margin-top: 0; font-size: 15px; color: #334155;">Pemberitahuan perubahan status pengajuan keuangan Anda:</p>
        
        <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="margin: 16px 0; border-collapse: collapse; font-size: 14px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="color: #64748b; width: 140px;">Nomor Pengajuan</td>
            <td style="font-weight: 600; color: #0f172a;">${nomorBersih}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="color: #64748b;">Jenis Pengajuan</td>
            <td style="font-weight: 500; text-transform: capitalize;">${jenisBersih}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="color: #64748b;">Jumlah</td>
            <td style="font-weight: 700; color: #0f172a;">${jumlahFormatted}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="color: #64748b;">Status Baru</td>
            <td style="font-weight: 600; color: #0369a1;">${statusLabel}</td>
          </tr>
        </table>

        ${catatanHtml}

        <div style="margin: 24px 0;">
          <a href="${detailUrl}" style="display: inline-block; background-color: #92400e; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px;">
            Buka Pengajuan
          </a>
        </div>

        <p style="font-size: 12px; color: #94a3b8; margin: 24px 0 0 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          Tautan langsung: <a href="${detailUrl}" style="color: #92400e; word-break: break-all;">${detailUrl}</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
        Email ini dikirim otomatis oleh Sistem Keuangan CV Batik Larasati. Harap tidak membalas email ini secara langsung.
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { text, html };
}

/**
 * Memilih penerima email yang sah sesuai aturan bisnis:
 * (a) Ke PENGAJU saat status menjadi 'perlu_revisi', 'ditolak', atau 'dibayar'.
 * (b) Ke seluruh DIREKTUR aktif saat status masuk 'menunggu_direktur'.
 * - Jangan mengirim ke akun nonaktif.
 * - Jangan mengirim ke orang yang sama dengan pelaku perpindahan (actorId).
 *
 * CATATAN: status 'disetujui' kini juga mengirim email ke pengaju.
 */
export function filterEmailRecipients(params: {
  statusBaru: StatusPengajuan;
  actorId: string;
  pengaju?: ProfileRecipient | null;
  direkturList?: ProfileRecipient[];
}): ProfileRecipient[] {
  const { statusBaru, actorId, pengaju, direkturList = [] } = params;

  if (
    statusBaru === "disetujui" ||
    statusBaru === "perlu_revisi" ||
    statusBaru === "ditolak" ||
    statusBaru === "dibayar"
  ) {
    if (!pengaju) {
      console.log("[email] dilewati: profil pengaju tidak ada", { status: statusBaru });
      return [];
    }
    if (!pengaju.aktif) {
      console.log("[email] dilewati: akun pengaju nonaktif", { status: statusBaru });
      return [];
    }
    if (pengaju.id === actorId) {
      console.log("[email] dilewati: pelaku sama dengan pengaju", { status: statusBaru });
      return [];
    }
    return [pengaju];
  }

  if (statusBaru === "menunggu_direktur") {
    return direkturList.filter((d) => d.aktif && d.id !== actorId);
  }

  console.log("[email] dilewati: status tidak memicu email", { status: statusBaru });
  return [];
}

/**
 * Membaca pemetaan email uji (EMAIL_UJI_PETA)
 * Format: dummy1@larasati.test:real1@gmail.com;dummy2@larasati.test:real2@gmail.com
 */
export function parseEmailMapping(rawPeta?: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!rawPeta) return map;
  const pairs = rawPeta.split(/[;,]/);
  for (const pair of pairs) {
    const parts = pair.split(":");
    if (parts.length >= 2) {
      const fromEmail = parts[0].trim().toLowerCase();
      const toEmail = parts.slice(1).join(":").trim();
      if (fromEmail && toEmail) {
        map.set(fromEmail, toEmail);
      }
    }
  }
  return map;
}

/**
 * Pengiriman satu email: menangani mode 'kirim', 'log', atau 'mati',
 * aturan alamat dummy (.test dsb.), pengalihan EMAIL_TEST_REDIRECT / EMAIL_UJI_PETA,
 * dan timeout ~4 detik ke REST API Resend.
 */
export async function sendSingleEmail(params: {
  recipient: ProfileRecipient;
  pengajuan: PengajuanEmailData;
  appBaseUrl: string;
}): Promise<EmailSendResult> {
  const { recipient, pengajuan, appBaseUrl } = params;

  // Buang tanda kutip yang mungkin ikut tersimpan di nilai env (mis. dari .env atau Netlify)
  const stripQuotes = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, "").trim();

  const mode = (stripQuotes(process.env.EMAIL_MODE) || "mati").toLowerCase();

  console.log("[email] mulai", {
    mode,
    status: pengajuan.status,
    pengajuanId: pengajuan.id,
    penerimaId: recipient.id,
  });

  if (mode === "mati") {
    console.log("[email] dilewati: EMAIL_MODE=mati atau belum disetel di server");
    return {
      status: "skipped",
      notice: "Notifikasi email dinonaktifkan (EMAIL_MODE=mati)",
    };
  }

  // Cek pemetaan email per penerima (EMAIL_UJI_PETA) terlebih dahulu
  const emailPeta = parseEmailMapping(stripQuotes(process.env.EMAIL_UJI_PETA));
  const mappedTarget = emailPeta.get(recipient.email.trim().toLowerCase());
  const isOriginalDummy = isDummyDomain(recipient.email);

  // Pengalihan umum:
  // - EMAIL_TEST_REDIRECT: pengalihan paksa global (jika sengaja dipasang untuk staging)
  // - EMAIL_UJI_PENERIMA: fallback khusus HANYA jika penerima adalah domain contoh/dummy (.test) yang belum terdaftar di EMAIL_UJI_PETA
  const globalRedirect = stripQuotes(process.env.EMAIL_TEST_REDIRECT);
  const fallbackDummy = isOriginalDummy ? stripQuotes(process.env.EMAIL_UJI_PENERIMA) : undefined;
  const redirectTarget = mappedTarget || globalRedirect || fallbackDummy;

  console.log("[email] tujuan", {
    penerimaAsli: recipient.email,
    adaPemetaan: !!mappedTarget,
    adaRedirect: !!redirectTarget,
    penerimaDummy: isOriginalDummy,
  });

  // Jika mode kirim dan tidak ada redirect, cek domain dummy penerima
  if (mode === "kirim" && !redirectTarget && isOriginalDummy) {
    console.warn("[email] dilewati: penerima domain dummy dan tidak ada redirect/pemetaan");
    return {
      status: "skipped",
      errorType: "DUMMY_DOMAIN",
      notice: "Penerima memakai alamat contoh, email tidak dikirim.",
    };
  }

  // Tentukan subjek dan penerima aktual
  const activeRecipient = redirectTarget || recipient.email;
  const redirectNoticeRecipient = redirectTarget ? recipient.email : undefined;

  // Jangan pernah mengirim ke domain dummy bahkan jika redirectTarget yang dipasang salah ketik
  if (isDummyDomain(activeRecipient)) {
    console.warn("[email] dilewati: alamat tujuan akhir berdomain dummy");
    return {
      status: "skipped",
      errorType: "DUMMY_DOMAIN",
      notice: "Penerima memakai alamat contoh, email tidak dikirim.",
    };
  }

  const subject = generateEmailSubject(
    pengajuan.nomor,
    pengajuan.status,
    redirectNoticeRecipient
  );

  const { text, html } = generateEmailContent({ pengajuan, appBaseUrl });

  // Mode "log": simpan sebagai file HTML di folder .outbox/ (hanya non-production)
  if (mode === "log") {
    if (process.env.NODE_ENV === "production") {
      console.log("[email] dilewati: mode log tidak berlaku di production");
      return { status: "skipped", notice: "Mode log tidak berlaku di production" };
    }

    try {
      const outboxDir = path.join(process.cwd(), ".outbox");
      await fs.mkdir(outboxDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const safeId = recipient.id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 8);
      const filename = `${timestamp}_${pengajuan.status}_${safeId}.html`;
      const filePath = path.join(outboxDir, filename);

      const fileContent = `<!-- OUTBOX LOG
Penerima Asli: ${recipient.nama_lengkap} <${recipient.email}>
Penerima Terkirim: ${activeRecipient}
Subjek: ${subject}
Tanggal: ${new Date().toISOString()}
Status Kejadian: ${pengajuan.status}
Pengajuan ID: ${pengajuan.id}
-->
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body>
<div style="background:#f1f5f9;padding:12px;margin-bottom:16px;border-bottom:1px solid #cbd5e1;font-family:monospace;font-size:12px;">
  <p><strong>Penerima Asli:</strong> ${escapeHtml(recipient.email)} (${escapeHtml(recipient.nama_lengkap)})</p>
  <p><strong>Subjek:</strong> ${escapeHtml(subject)}</p>
  <p><strong>Mode:</strong> LOG (Tidak dikirim ke internet)</p>
</div>
${html}
<hr style="margin:30px 0;">
<h3>Versi Teks Polos:</h3>
<pre style="background:#f8fafc;padding:16px;border:1px solid #e2e8f0;white-space:pre-wrap;">${escapeHtml(text)}</pre>
</body>
</html>`;

      await fs.writeFile(filePath, fileContent, "utf-8");
      return { status: "logged", recipientEmail: activeRecipient };
    } catch {
      console.error("Gagal menulis berkas outbox log: FILE_WRITE_ERROR");
      return { status: "failed", errorType: "PROVIDER_ERROR", notice: "Gagal menulis file log outbox" };
    }
  }

  // Mode "kirim": kirim ke REST API Resend
  if (mode === "kirim") {
    const apiKey = stripQuotes(process.env.RESEND_API_KEY);
    const emailFrom = stripQuotes(
      process.env.EMAIL_FROM || process.env.EMAIL_PENGIRIM
    );

    if (!apiKey || !emailFrom) {
      console.error("[email] Konfigurasi email tidak lengkap di server (RESEND_API_KEY atau EMAIL_PENGIRIM kosong)", {
        adaApiKey: !!apiKey,
        adaEmailFrom: !!emailFrom,
      });
      return {
        status: "failed",
        errorType: "CONFIG_MISSING",
        notice: "Konfigurasi pengiriman email belum lengkap di server",
      };
    }

    // Idempotency-Key: terbentuk dari pengajuan id, status baru, dan penerima (maks 256 karakter)
    const rawIdempotency = `pg-${pengajuan.id}-${pengajuan.status}-${activeRecipient}`
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_")
      .slice(0, 255);

    const controller = new AbortController();
    // Timeout dinaikkan ke 8 detik karena cold start serverless bisa lambat
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      console.log("[email] Mengirim notifikasi via Resend REST API ke:", activeRecipient);
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": rawIdempotency,
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [activeRecipient],
          subject,
          html,
          text,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "(tidak bisa membaca body)");
        console.error("[email] Resend menolak pengiriman:", {
          status: response.status,
          detail,
        });

        if (response.status === 429) {
          console.error("Gagal mengirim notifikasi email: RATE_LIMIT");
          return {
            status: "failed",
            errorType: "RATE_LIMIT",
            notice: "Batas pengiriman provider tercapai (rate limit)",
          };
        }

        console.error("Gagal mengirim notifikasi email: PROVIDER_ERROR");
        return {
          status: "failed",
          errorType: "PROVIDER_ERROR",
          notice: "Pengiriman ditolak oleh provider email (periksa domain pengirim / API key)",
        };
      }

      let messageId: string | undefined = undefined;
      try {
        const resJson = (await response.json()) as { id?: string } | null;
        if (resJson?.id) {
          messageId = resJson.id;
        }
      } catch {
        // response might not be JSON
      }

      console.log("[email] Berhasil diterima Resend API:", {
        status: response.status,
        messageId: messageId || "-",
        penerima: activeRecipient,
      });

      return {
        status: "sent",
        messageId,
        recipientEmail: activeRecipient,
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        console.error("Gagal mengirim notifikasi email: TIMEOUT");
        return {
          status: "failed",
          errorType: "TIMEOUT",
          notice: "Pengiriman email melebihi batas waktu (timeout)",
        };
      }

      console.error(
        "Gagal mengirim notifikasi email: NETWORK_ERROR",
        err instanceof Error ? err.message : err
      );
      return {
        status: "failed",
        errorType: "NETWORK_ERROR",
        notice: "Gagal terhubung ke layanan email",
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  console.warn("[email] dilewati: nilai EMAIL_MODE tidak dikenali:", mode);
  return {
    status: "skipped",
    notice: `Nilai EMAIL_MODE tidak valid: ${mode}`,
  };
}

/**
 * Orkestrasi pengiriman notifikasi pengajuan:
 * - Menentukan penerima yang valid
 * - Mengirim secara berurutan (sequential)
 * - Mengembalikan catatan non-blok jika ada kegagalan atau alamat contoh dilewati
 */
export async function kirimNotifikasiPengajuan(params: {
  pengajuan: PengajuanEmailData;
  actorId: string;
  pengajuProfile?: ProfileRecipient | null;
  direkturProfiles?: ProfileRecipient[];
}): Promise<KirimNotifikasiResult> {
  const { pengajuan, actorId, pengajuProfile, direkturProfiles = [] } = params;

  console.log("[email] kirimNotifikasiPengajuan dipanggil:", {
    pengajuanId: pengajuan.id,
    nomor: pengajuan.nomor,
    status: pengajuan.status,
    actorId,
    adaPengaju: !!pengajuProfile,
    pengajuAktif: pengajuProfile?.aktif ?? false,
    jumlahDirektur: direkturProfiles.length,
  });

  const isPengajuTarget =
    pengajuan.status === "disetujui" ||
    pengajuan.status === "perlu_revisi" ||
    pengajuan.status === "ditolak" ||
    pengajuan.status === "dibayar";

  if (isPengajuTarget) {
    if (!pengajuProfile) {
      console.warn("[email] Profil pengaju tidak ditemukan untuk pengajuan:", pengajuan.id);
      return {
        success: false,
        count: 0,
        notice: "Profil pengaju tidak ditemukan, email notifikasi tidak dikirim",
      };
    }

    if (!pengajuProfile.aktif) {
      console.warn("[email] Akun pengaju nonaktif:", pengajuProfile.id);
      return {
        success: false,
        count: 0,
        notice: "Akun pengaju nonaktif, email notifikasi dilewati",
      };
    }

    if (pengajuProfile.id === actorId) {
      console.log("[email] Pelaku sama dengan pengaju, notifikasi dilewati");
      return {
        success: true,
        count: 0,
      };
    }
  }

  if (pengajuan.status === "menunggu_direktur") {
    const activeDirektur = direkturProfiles.filter((d) => d.aktif && d.id !== actorId);
    if (activeDirektur.length === 0) {
      console.warn("[email] Tidak ada direktur aktif selain pelaku untuk menerima notifikasi");
      return {
        success: false,
        count: 0,
        notice: "Tidak ada direktur aktif yang menerima notifikasi",
      };
    }
  }

  const recipients = filterEmailRecipients({
    statusBaru: pengajuan.status,
    actorId,
    pengaju: pengajuProfile,
    direkturList: direkturProfiles,
  });

  console.log("[email] Jumlah penerima setelah filter:", recipients.length);

  if (recipients.length === 0) {
    return { success: true, count: 0 };
  }

  const appBaseUrl = normalizeAppBaseUrl(
    process.env.APP_BASE_URL?.trim().replace(/^["']+|["']+$/g, "")
  );

  let successCount = 0;
  let notice: string | undefined = undefined;
  const details: EmailSendResult[] = [];

  // Kirim berurutan (bukan paralel) untuk menjaga kestabilan Netlify serverless & rate-limit
  for (const recipient of recipients) {
    const result = await sendSingleEmail({
      recipient,
      pengajuan,
      appBaseUrl,
    });

    details.push(result);

    console.log("[email] Hasil kirim penerima:", {
      penerima: recipient.email,
      status: result.status,
      errorType: result.errorType ?? "-",
      messageId: result.messageId ?? "-",
    });

    if (result.status === "sent" || result.status === "logged") {
      successCount++;
    }

    if (result.notice && !notice) {
      notice = result.notice;
    }
  }

  const anyFailed = details.some((d) => d.status === "failed");

  let successNotice: string | undefined = undefined;
  if (successCount > 0) {
    const successItems = details
      .filter((d) => d.status === "sent" || d.status === "logged")
      .map((d) => {
        const email = d.recipientEmail || "";
        const masked = maskEmail(email);
        const idPart = d.messageId ? ` (ID: ${d.messageId.slice(0, 8)})` : "";
        return `${masked}${idPart}`;
      });

    if (successItems.length > 0) {
      successNotice = `Email terkirim ke ${successItems.join(", ")}`;
    }
  }

  return {
    success: successCount > 0 && !anyFailed,
    count: successCount,
    notice:
      successCount > 0
        ? successNotice
        : notice || (recipients.length === 0 ? undefined : "Notifikasi email tidak terkirim"),
    details,
  };
}