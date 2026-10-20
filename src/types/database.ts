export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PeranPengguna = "staf" | "akuntan" | "direktur";
export type StatusPeriode = "terbuka" | "ditutup";
export type TipeAkun = "aset" | "kewajiban" | "ekuitas" | "pendapatan" | "beban";
export type SaldoNormalAkun = "debit" | "kredit";
export type JenisPengajuan = "reimburse" | "pengeluaran";
export type StatusPengajuan =
  | "draf"
  | "diajukan"
  | "perlu_revisi"
  | "menunggu_direktur"
  | "disetujui"
  | "ditolak"
  | "dibayar"
  | "dibatalkan";
export type StatusJurnal = "draf" | "diposting" | "dibalik";
export type SumberJurnal = "saldo_awal" | "manual" | "pengajuan" | "pembalik" | "impor_bank" | "pembayaran_pengajuan";

// Backward-compatible alias
export type UserRole = PeranPengguna;
export type AccountType = TipeAkun;
export type NormalBalance = SaldoNormalAkun;
export type PeriodStatus = StatusPeriode;
export type JournalStatus = StatusJurnal;
export type JournalSource = SumberJurnal;
export type SubmissionStatus = StatusPengajuan;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nama_lengkap: string;
          email: string;
          peran: PeranPengguna;
          jabatan: string;
          aktif: boolean;
          dibuat_pada: string;
        };
        Insert: {
          id: string;
          nama_lengkap: string;
          email: string;
          peran?: PeranPengguna;
          jabatan: string;
          aktif?: boolean;
          dibuat_pada?: string;
        };
        Update: {
          id?: string;
          nama_lengkap?: string;
          email?: string;
          peran?: PeranPengguna;
          jabatan?: string;
          aktif?: boolean;
          dibuat_pada?: string;
        };
      };
      penomoran: {
        Row: {
          jenis: "JU" | "PG";
          tahun: number;
          bulan: number;
          nomor_terakhir: number;
        };
        Insert: {
          jenis: "JU" | "PG";
          tahun: number;
          bulan: number;
          nomor_terakhir?: number;
        };
        Update: {
          jenis?: "JU" | "PG";
          tahun?: number;
          bulan?: number;
          nomor_terakhir?: number;
        };
      };
      periode: {
        Row: {
          id: number;
          tahun: number;
          bulan: number;
          tanggal_mulai: string;
          status: StatusPeriode;
          ditutup_oleh: string | null;
          ditutup_pada: string | null;
          alasan_buka_ulang: string | null;
        };
        Insert: {
          id?: number;
          tahun: number;
          bulan: number;
          tanggal_mulai: string;
          status?: StatusPeriode;
          ditutup_oleh?: string | null;
          ditutup_pada?: string | null;
          alasan_buka_ulang?: string | null;
        };
        Update: {
          id?: number;
          tahun?: number;
          bulan?: number;
          tanggal_mulai?: string;
          status?: StatusPeriode;
          ditutup_oleh?: string | null;
          ditutup_pada?: string | null;
          alasan_buka_ulang?: string | null;
        };
      };
      akun: {
        Row: {
          id: number;
          kode: string;
          nama: string;
          tipe: TipeAkun;
          saldo_normal: SaldoNormalAkun;
          is_kas_bank: boolean;
          aktif: boolean;
          keterangan: string | null;
        };
        Insert: {
          id?: number;
          kode: string;
          nama: string;
          tipe: TipeAkun;
          saldo_normal: SaldoNormalAkun;
          is_kas_bank?: boolean;
          aktif?: boolean;
          keterangan?: string | null;
        };
        Update: {
          id?: number;
          kode?: string;
          nama?: string;
          tipe?: TipeAkun;
          saldo_normal?: SaldoNormalAkun;
          is_kas_bank?: boolean;
          aktif?: boolean;
          keterangan?: string | null;
        };
      };
      pengajuan: {
        Row: {
          id: number;
          nomor: string | null;
          pengaju_id: string;
          jenis: JenisPengajuan;
          tanggal_transaksi: string;
          akun_beban_id: number;
          jumlah: number;
          keterangan: string;
          bukti_path: string | null;
          status: StatusPengajuan;
          catatan_peninjau: string | null;
          diverifikasi_oleh: string | null;
          disetujui_oleh: string | null;
          akun_kas_id: number | null;
          dibayar_oleh: string | null;
          dibayar_pada: string | null;
        };
        Insert: {
          id?: number;
          nomor?: string | null;
          pengaju_id: string;
          jenis: JenisPengajuan;
          tanggal_transaksi: string;
          akun_beban_id: number;
          jumlah: number;
          keterangan: string;
          bukti_path?: string | null;
          status?: StatusPengajuan;
          catatan_peninjau?: string | null;
          diverifikasi_oleh?: string | null;
          disetujui_oleh?: string | null;
          akun_kas_id?: number | null;
          dibayar_oleh?: string | null;
          dibayar_pada?: string | null;
        };
        Update: {
          id?: number;
          nomor?: string | null;
          pengaju_id?: string;
          jenis?: JenisPengajuan;
          tanggal_transaksi?: string;
          akun_beban_id?: number;
          jumlah?: number;
          keterangan?: string;
          bukti_path?: string | null;
          status?: StatusPengajuan;
          catatan_peninjau?: string | null;
          diverifikasi_oleh?: string | null;
          disetujui_oleh?: string | null;
          akun_kas_id?: number | null;
          dibayar_oleh?: string | null;
          dibayar_pada?: string | null;
        };
      };
      jurnal: {
        Row: {
          id: number;
          nomor: string | null;
          tanggal: string;
          periode_id: number;
          keterangan: string;
          sumber: SumberJurnal;
          status: StatusJurnal;
          pengajuan_id: number | null;
          jurnal_dibalik_id: number | null;
          dibuat_oleh: string;
          diposting_oleh: string | null;
          diposting_pada: string | null;
        };
        Insert: {
          id?: number;
          nomor?: string | null;
          tanggal: string;
          periode_id: number;
          keterangan: string;
          sumber?: SumberJurnal;
          status?: StatusJurnal;
          pengajuan_id?: number | null;
          jurnal_dibalik_id?: number | null;
          dibuat_oleh: string;
          diposting_oleh?: string | null;
          diposting_pada?: string | null;
        };
        Update: {
          id?: number;
          nomor?: string | null;
          tanggal?: string;
          periode_id?: number;
          keterangan?: string;
          sumber?: SumberJurnal;
          status?: StatusJurnal;
          pengajuan_id?: number | null;
          jurnal_dibalik_id?: number | null;
          dibuat_oleh?: string;
          diposting_oleh?: string | null;
          diposting_pada?: string | null;
        };
      };
      jurnal_baris: {
        Row: {
          id: number;
          jurnal_id: number;
          urutan: number;
          akun_id: number;
          debit: number;
          kredit: number;
          keterangan: string | null;
        };
        Insert: {
          id?: number;
          jurnal_id: number;
          urutan?: number;
          akun_id: number;
          debit?: number;
          kredit?: number;
          keterangan?: string | null;
        };
        Update: {
          id?: number;
          jurnal_id?: number;
          urutan?: number;
          akun_id?: number;
          debit?: number;
          kredit?: number;
          keterangan?: string | null;
        };
      };
      audit_log: {
        Row: {
          id: number;
          waktu: string;
          pelaku_id: string | null;
          aksi: string;
          nama_tabel: string;
          id_data: string;
          data_lama: Json | null;
          data_baru: Json | null;
        };
        Insert: {
          id?: number;
          waktu?: string;
          pelaku_id?: string | null;
          aksi: string;
          nama_tabel: string;
          id_data: string;
          data_lama?: Json | null;
          data_baru?: Json | null;
        };
        Update: {
          id?: number;
          waktu?: string;
          pelaku_id?: string | null;
          aksi?: string;
          nama_tabel?: string;
          id_data?: string;
          data_lama?: Json | null;
          data_baru?: Json | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
}
