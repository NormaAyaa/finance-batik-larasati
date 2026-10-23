"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatTanggalWIB, PERAN_STYLES } from "./audit-helpers";
import { UbahPenggunaModal } from "./ubah-pengguna-modal";
import { getFriendlyErrorMessage } from "@/lib/utils/errors";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

interface DaftarPenggunaProps {
  initialUsers: ProfileRow[];
  currentUserId: string;
}

export function DaftarPengguna({ initialUsers, currentUserId }: DaftarPenggunaProps) {
  const [users, setUsers] = useState<ProfileRow[]>(initialUsers);
  const [selectedUser, setSelectedUser] = useState<ProfileRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshUsers = async () => {
    setIsRefreshing(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("peran", { ascending: true })
        .order("nama_lengkap", { ascending: true });

      if (error) {
        setErrorMessage(getFriendlyErrorMessage(error));
        return;
      }

      if (data) {
        setUsers(data);
      }
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEditClick = (user: ProfileRow) => {
    if (user.id === currentUserId) return;
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSuccess = (msg: string) => {
    setSuccessMessage(msg);
    refreshUsers();
  };

  return (
    <div className="space-y-4">
      {/* Alert Banner Sukses */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Alert Banner Error */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 font-bold ml-2 text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Penjelasan Penambahan Pengguna Baru (Informasi Operasional) */}
      <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800">Alur Penambahan Akun Pengguna Baru</h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Pembuatan akun login baru (kredensial email & kata sandi) dilakukan melalui{" "}
              <strong>Dashboard Supabase Auth</strong> oleh administrator teknis karena membutuhkan kunci admin/service role.
              Setelah akun autentikasi dibuat, profil pengguna ditambahkan ke tabel <code className="font-mono text-slate-700 bg-slate-200 px-1 py-0.5 rounded text-[11px]">profiles</code>.
              Di halaman ini, Direktur berwenang mengelola peran (Staf, Akuntan, Direktur) dan mengaktifkan/menonaktifkan akun yang sudah terdaftar.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={refreshUsers}
          disabled={isRefreshing}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          title="Muat ulang daftar pengguna"
        >
          <svg className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Segarkan</span>
        </button>
      </div>

      {/* Tampilan Desktop (Tabel) */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Jabatan</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4">Status Akun</th>
                <th className="py-3 px-4">Dibuat Pada</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isSelf = u.id === currentUserId;
                const roleMeta = PERAN_STYLES[u.peran] || {
                  label: u.peran,
                  badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
                };

                return (
                  <tr key={u.id} className={`hover:bg-slate-50/70 transition-colors ${isSelf ? "bg-amber-50/30" : ""}`}>
                    {/* Nama & Email */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-[11px]">
                          {u.nama_lengkap.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900">{u.nama_lengkap}</span>
                            {isSelf && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                                Akun Anda
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Jabatan */}
                    <td className="py-3 px-4 text-slate-700">{u.jabatan || "-"}</td>

                    {/* Peran */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${roleMeta.badgeClass}`}>
                        {roleMeta.label}
                      </span>
                    </td>

                    {/* Status Aktif: Teks + Ikon (bukan hanya warna) */}
                    <td className="py-3 px-4">
                      {u.aktif ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-300">
                          <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Nonaktif</span>
                        </span>
                      )}
                    </td>

                    {/* Dibuat Pada */}
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {formatTanggalWIB(u.dibuat_pada)}
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4 text-right">
                      {isSelf ? (
                        <div className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium italic" title="Direktur tidak boleh mengubah peran atau status akunnya sendiri (BR-12)">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span>Terkunci (BR-12)</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleEditClick(u)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Ubah Peran / Status</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tampilan Ponsel (Kartu Responsif) */}
      <div className="grid gap-3 md:hidden">
        {users.map((u) => {
          const isSelf = u.id === currentUserId;
          const roleMeta = PERAN_STYLES[u.peran] || {
            label: u.peran,
            badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
          };

          return (
            <div
              key={u.id}
              className={`p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3 ${
                isSelf ? "bg-amber-50/20 border-amber-200" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-sm font-semibold text-slate-900">{u.nama_lengkap}</h4>
                    {isSelf && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                        Akun Anda
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{u.email}</p>
                </div>
                {u.aktif ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Aktif</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-300 shrink-0">
                    <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Nonaktif</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 text-[11px] block">Jabatan</span>
                  <span className="text-slate-700 font-medium">{u.jabatan || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Peran (Role)</span>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${roleMeta.badgeClass}`}>
                    {roleMeta.label}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 text-[11px] block">Tanggal Dibuat</span>
                  <span className="text-slate-600 font-mono text-[11px]">{formatTanggalWIB(u.dibuat_pada)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                {isSelf ? (
                  <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-500 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Direktur tidak boleh mengubah peran atau status akunnya sendiri (BR-12)</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleEditClick(u)}
                    className="w-full py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Ubah Peran / Status</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Ubah Pengguna */}
      <UbahPenggunaModal
        isOpen={isModalOpen}
        user={selectedUser}
        currentUserId={currentUserId}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
