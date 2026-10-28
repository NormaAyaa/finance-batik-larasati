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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "periode_ditutup_oleh_fkey";
            columns: ["ditutup_oleh"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [];
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
          bukti_hash: string | null;
          status: StatusPengajuan;
          catatan_peninjau: string | null;
          diverifikasi_oleh: string | null;
          diverifikasi_pada: string | null;
          disetujui_oleh: string | null;
          disetujui_pada: string | null;
          akun_kas_id: number | null;
          dibayar_oleh: string | null;
          dibayar_pada: string | null;
          dibuat_pada: string;
          diajukan_pada: string | null;
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
          bukti_hash?: string | null;
          status?: StatusPengajuan;
          catatan_peninjau?: string | null;
          diverifikasi_oleh?: string | null;
          diverifikasi_pada?: string | null;
          disetujui_oleh?: string | null;
          disetujui_pada?: string | null;
          akun_kas_id?: number | null;
          dibayar_oleh?: string | null;
          dibayar_pada?: string | null;
          dibuat_pada?: string;
          diajukan_pada?: string | null;
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
          bukti_hash?: string | null;
          status?: StatusPengajuan;
          catatan_peninjau?: string | null;
          diverifikasi_oleh?: string | null;
          diverifikasi_pada?: string | null;
          disetujui_oleh?: string | null;
          disetujui_pada?: string | null;
          akun_kas_id?: number | null;
          dibayar_oleh?: string | null;
          dibayar_pada?: string | null;
          dibuat_pada?: string;
          diajukan_pada?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pengajuan_pengaju_id_fkey";
            columns: ["pengaju_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pengajuan_akun_beban_id_fkey";
            columns: ["akun_beban_id"];
            isOneToOne: false;
            referencedRelation: "akun";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pengajuan_diverifikasi_oleh_fkey";
            columns: ["diverifikasi_oleh"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pengajuan_disetujui_oleh_fkey";
            columns: ["disetujui_oleh"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pengajuan_akun_kas_id_fkey";
            columns: ["akun_kas_id"];
            isOneToOne: false;
            referencedRelation: "akun";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pengajuan_dibayar_oleh_fkey";
            columns: ["dibayar_oleh"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "jurnal_periode_id_fkey";
            columns: ["periode_id"];
            isOneToOne: false;
            referencedRelation: "periode";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jurnal_pengajuan_id_fkey";
            columns: ["pengajuan_id"];
            isOneToOne: false;
            referencedRelation: "pengajuan";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jurnal_jurnal_dibalik_id_fkey";
            columns: ["jurnal_dibalik_id"];
            isOneToOne: false;
            referencedRelation: "jurnal";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jurnal_dibuat_oleh_fkey";
            columns: ["dibuat_oleh"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jurnal_diposting_oleh_fkey";
            columns: ["diposting_oleh"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "jurnal_baris_jurnal_id_fkey";
            columns: ["jurnal_id"];
            isOneToOne: false;
            referencedRelation: "jurnal";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jurnal_baris_akun_id_fkey";
            columns: ["akun_id"];
            isOneToOne: false;
            referencedRelation: "akun";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "audit_log_pelaku_id_fkey";
            columns: ["pelaku_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      mutasi_bank: {
        Row: {
          id: number;
          akun_bank_id: number;
          tanggal: string;
          deskripsi: string;
          jumlah: number;
          saldo: number | null;
          nama_file: string;
          jurnal_id: number | null;
          diimpor_oleh: string;
          diimpor_pada: string;
        };
        Insert: {
          id?: number;
          akun_bank_id: number;
          tanggal: string;
          deskripsi: string;
          jumlah: number;
          saldo?: number | null;
          nama_file: string;
          jurnal_id?: number | null;
          diimpor_oleh?: string;
          diimpor_pada?: string;
        };
        Update: {
          id?: number;
          akun_bank_id?: number;
          tanggal?: string;
          deskripsi?: string;
          jumlah?: number;
          saldo?: number | null;
          nama_file?: string;
          jurnal_id?: number | null;
          diimpor_oleh?: string;
          diimpor_pada?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mutasi_bank_akun_bank_id_fkey";
            columns: ["akun_bank_id"];
            isOneToOne: false;
            referencedRelation: "akun";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mutasi_bank_jurnal_id_fkey";
            columns: ["jurnal_id"];
            isOneToOne: false;
            referencedRelation: "jurnal";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mutasi_bank_diimpor_oleh_fkey";
            columns: ["diimpor_oleh"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      transisi_status_pengajuan: {
        Args: {
          p_pengajuan_id: number;
          p_status_baru: StatusPengajuan;
          p_catatan?: string | null;
        };
        Returns: Database["public"]["Tables"]["pengajuan"]["Row"];
      };
      bayar_pengajuan: {
        Args: {
          p_pengajuan_id: number;
          p_akun_kas_id: number;
          p_tanggal_bayar: string;
        };
        Returns: Database["public"]["Tables"]["pengajuan"]["Row"];
      };
      tutup_periode: {
        Args: {
          p_periode_id: number;
        };
        Returns: Database["public"]["Tables"]["periode"]["Row"];
      };
      buka_kembali_periode: {
        Args: {
          p_periode_id: number;
          p_alasan: string;
        };
        Returns: Database["public"]["Tables"]["periode"]["Row"];
      };
      posting_jurnal: {
        Args: {
          p_jurnal_id: number;
        };
        Returns: Database["public"]["Tables"]["jurnal"]["Row"];
      };
      buat_jurnal_pembalik: {
        Args: {
          p_jurnal_id: number;
          p_tanggal_pembalik: string;
          p_keterangan: string;
        };
        Returns: Database["public"]["Tables"]["jurnal"]["Row"];
      };
      simpan_jurnal_draf: {
        Args: {
          p_jurnal_id?: number | null;
          p_tanggal: string;
          p_keterangan: string;
          p_baris: Json;
        };
        Returns: Database["public"]["Tables"]["jurnal"]["Row"];
      };
      saldo_akun_per_tanggal: {
        Args: {
          p_sampai: string;
        };
        Returns: {
          akun_id: number;
          kode: string;
          nama: string;
          tipe: TipeAkun;
          saldo_normal: SaldoNormalAkun;
          total_debit: number;
          total_kredit: number;
        }[];
      };
      mutasi_akun_rentang: {
        Args: {
          p_dari: string;
          p_sampai: string;
        };
        Returns: {
          akun_id: number;
          kode: string;
          nama: string;
          tipe: TipeAkun;
          saldo_normal: SaldoNormalAkun;
          total_debit: number;
          total_kredit: number;
        }[];
      };
      impor_mutasi_bank: {
        Args: {
          p_akun_bank_id: number;
          p_nama_file: string;
          p_baris: Json;
        };
        Returns: {
          baru: number;
          duplikat: number;
        };
      };
      buat_draf_dari_mutasi: {
        Args: {
          p_mutasi_id: number;
          p_akun_lawan_id: number;
        };
        Returns: Database["public"]["Tables"]["jurnal"]["Row"];
      };
    };
  };
}
