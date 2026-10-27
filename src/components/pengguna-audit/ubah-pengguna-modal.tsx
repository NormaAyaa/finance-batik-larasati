"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getFriendlyErrorMessage } from "@/lib/utils/errors";
import { PERAN_STYLES } from "./audit-helpers";
import type { Database, PeranPengguna } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

interface UbahPenggunaModalProps {
  isOpen: boolean;
  user: ProfileRow | null;
  currentUserId: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function UbahPenggunaModal(props: UbahPenggunaModalProps) {
  if (!props.isOpen || !props.user) return null;

  return <UbahPenggunaFormContent key={props.user.id} {...props} user={props.user} />;
}

function UbahPenggunaFormContent({
  user,
  currentUserId,
  onClose,
  onSuccess,
}: Omit<UbahPenggunaModalProps, "isOpen"> & { user: ProfileRow }) {
  const [peran, setPeran] = useState<PeranPengguna>(user.peran);
  const [aktif, setAktif] = useState<boolean>(user.aktif);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSelf = user.id === currentUserId;

  const isRoleChanged = peran !== user.peran;
  const isActiveChanged = aktif !== user.aktif;
  const hasChanges = isRoleChanged || isActiveChanged;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSelf) {
      setErrorMessage("Direktur tidak boleh mengubah peran atau status akunnya sendiri (BR-12).");
      return;
    }
    if (!hasChanges) {
      onClose();
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();

      // Memperbarui peran dan status via client Supabase pengguna login (Direktur)
      // Memakai .select() untuk memastikan bahwa tepat 1 baris benar-benar berhasil diubah,
      // karena kebijakan RLS yang menolak tidak mengembalikan pesan error melainkan 0 baris (data: []).
      const { data, error } = await supabase
        .from("profiles")
        .update({
          peran,
          aktif,
        })
        .eq("id", user.id)
        .select("id, peran, aktif");

      if (error) {
        setErrorMessage(getFriendlyErrorMessage(error));
        setLoading(false);
        return;
      }

      // Validasi baris yang terpengaruh
      if (!data || data.length === 0) {
        setErrorMessage(
          "Perubahan gagal disimpan: Permintaan ditolak oleh kebijakan keamanan basis data (RLS atau BR-12). Tidak ada baris yang diperbarui."
        );
        setLoading(false);
        return;
      }

      if (data.length > 1) {
        setErrorMessage(
          "Terjadi anomali pembaruan data: Lebih dari satu baris terpengaruh."
        );
        setLoading(false);
        return;
      }

      onSuccess(
        `Perubahan akun ${user.nama_lengkap} berhasil disimpan (Peran: ${PERAN_STYLES[peran]?.label || peran}, Status: ${
          aktif ? "Aktif" : "Nonaktif"
        }).`
      );
      onClose();
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="sogan-card bg-[#0e0c0a] border border-amber-500/25 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#fdfaf6]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-amber-900/20 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#fdfaf6]">
              Ubah Peran & Status Pengguna
            </h3>
            <p className="text-xs text-[#a89f91] mt-0.5">
              Kelola hak akses dan status operasional akun pengguna
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-[#a89f91] hover:text-[#fdfaf6] rounded-xl hover:bg-amber-950/40 transition disabled:opacity-50"
            aria-label="Tutup modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Info Pengguna */}
          <div className="p-3.5 bg-[#141210] rounded-xl border border-amber-900/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#8a7e72] uppercase tracking-wider">Nama Pengguna</span>
              <span className="text-xs text-amber-400 font-mono">{user.email}</span>
            </div>
            <p className="text-sm font-bold text-[#fdfaf6]">{user.nama_lengkap}</p>
            <p className="text-xs text-[#a89f91]">{user.jabatan}</p>
          </div>

          {/* BR-12 Warning if self */}
          {isSelf && (
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-xs">
                <p className="font-bold text-amber-300">Pembatasan Integritas BR-12</p>
                <p className="mt-0.5 text-amber-200/80">
                  Direktur tidak boleh mengubah peran atau status akunnya sendiri (BR-12). Hubungi administrator basis data jika diperlukan rotasi peran.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
              <svg className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Pilihan Peran */}
          <div className="space-y-1.5">
            <label htmlFor="pilih-peran" className="block text-xs font-bold text-[#d6cfc7]">
              Peran Pengguna (Role)
            </label>
            <select
              id="pilih-peran"
              value={peran}
              onChange={(e) => setPeran(e.target.value as PeranPengguna)}
              disabled={loading || isSelf}
              className="w-full text-xs sm:text-sm rounded-xl border border-amber-900/30 bg-[#141210] px-3.5 py-2.5 text-[#fdfaf6] focus:border-amber-500/80 focus:outline-none focus:ring-1 focus:ring-amber-500/50 disabled:opacity-50"
            >
              <option value="staf" className="bg-[#141210] text-[#fdfaf6]">Staf (Pengajuan belanja kas kecil & dashboard)</option>
              <option value="akuntan" className="bg-[#141210] text-[#fdfaf6]">Akuntan (Posting jurnal, tutup buku, verifikasi/bayar pengajuan)</option>
              <option value="direktur" className="bg-[#141210] text-[#fdfaf6]">Direktur (Persetujuan pengajuan, buka buku, manajemen pengguna & audit)</option>
            </select>
            <p className="text-xs text-[#a89f91] mt-1">
              {PERAN_STYLES[peran]?.desc}
            </p>
          </div>

          {/* Pilihan Status Aktif */}
          <div className="space-y-1.5">
            <span className="block text-xs font-bold text-[#d6cfc7]">
              Status Akun
            </span>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                  aktif
                    ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-200"
                    : "border-amber-900/30 bg-[#141210] text-[#a89f91] hover:bg-[#1c1815]"
                } ${isSelf ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <input
                  type="radio"
                  name="status_aktif"
                  checked={aktif === true}
                  onChange={() => setAktif(true)}
                  disabled={loading || isSelf}
                  className="text-emerald-500 focus:ring-emerald-400 bg-[#0e0c0a] border-amber-900/50"
                />
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Aktif</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                  !aktif
                    ? "border-rose-500/50 bg-rose-950/40 text-rose-200"
                    : "border-amber-900/30 bg-[#141210] text-[#a89f91] hover:bg-[#1c1815]"
                } ${isSelf ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <input
                  type="radio"
                  name="status_aktif"
                  checked={aktif === false}
                  onChange={() => setAktif(false)}
                  disabled={loading || isSelf}
                  className="text-rose-500 focus:ring-rose-400 bg-[#0e0c0a] border-amber-900/50"
                />
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Nonaktif</span>
                </div>
              </label>
            </div>
            {!aktif && (
              <p className="text-xs text-rose-400 mt-1">
                ⚠️ Pengguna nonaktif akan langsung ditolak saat mencoba login atau membuka menu sistem.
              </p>
            )}
          </div>

          {/* Kotak Dampak Perubahan */}
          {hasChanges && !isSelf && (
            <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs space-y-1">
              <p className="font-bold text-amber-300">Ringkasan Dampak Perubahan:</p>
              <ul className="list-disc list-inside text-amber-200/90 space-y-0.5">
                {isRoleChanged && (
                  <li>
                    Peran diubah dari <strong className="capitalize">{user.peran}</strong> menjadi{" "}
                    <strong className="capitalize">{peran}</strong>. Hak akses menu dan wewenang transaksi akan berubah seketika.
                  </li>
                )}
                {isActiveChanged && (
                  <li>
                    Status diubah dari <strong>{user.aktif ? "Aktif" : "Nonaktif"}</strong> menjadi{" "}
                    <strong>{aktif ? "Aktif" : "Nonaktif"}</strong>.
                  </li>
                )}
                <li>
                  Tindakan ini akan dicatat secara otomatis dalam <strong>audit_log</strong> (tabel immutable).
                </li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-amber-900/20">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-3d-dark px-4 py-2 text-xs font-semibold disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || isSelf || !hasChanges}
              className="btn-3d-gold px-5 py-2 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin text-[#070605]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
