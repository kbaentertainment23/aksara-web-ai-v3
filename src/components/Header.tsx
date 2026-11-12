import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  Upload,
  Download,
  Zap,
  ShieldCheck,
  History,
  Lock,
  KeyRound,
  X,
  LogOut,
  AlertCircle,
  Eye,
  EyeOff,
  Settings,
  Shield,
  CheckCircle2,
} from 'lucide-react';

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenEthics: () => void;
  onOpenAuditLog: () => void;
  onExportProjectBackup: () => void;
  onImportProjectBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  savedCount: number;
  auditCount: number;
  isQuotaSaverMode?: boolean;
  onToggleQuotaSaverMode?: () => void;
  sticky?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  onOpenEthics,
  onOpenAuditLog,
  onExportProjectBackup,
  onImportProjectBackup,
  savedCount,
  auditCount,
  isQuotaSaverMode = true,
  onToggleQuotaSaverMode,
  sticky = true,
}) => {
  // Admin Authentication & Modal States
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('aksara_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isAdminPopupOpen, setIsAdminPopupOpen] = useState<boolean>(false);

  // Form Fields
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');

  // Handle click on Brand Logo div
  const handleLogoClick = () => {
    if (isAdminLoggedIn) {
      setIsAdminPopupOpen(true);
    } else {
      setLoginError('');
      setUsername('');
      setPassword('');
      setIsLoginModalOpen(true);
    }
  };

  // Handle Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'admin123' && password === 'admin123') {
      setIsAdminLoggedIn(true);
      try {
        sessionStorage.setItem('aksara_admin_auth', 'true');
      } catch {}
      setIsLoginModalOpen(false);
      setLoginError('');
      setUsername('');
      setPassword('');
      setIsAdminPopupOpen(true);
    } else {
      setLoginError('Username atau password salah! Gunakan user: admin123 dan password: admin123');
    }
  };

  // Handle Logout
  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    try {
      sessionStorage.removeItem('aksara_admin_auth');
    } catch {}
    setIsAdminPopupOpen(false);
  };

  return (
    <>
      <header className={`${sticky ? 'sticky top-0' : 'relative'} z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div
                onClick={handleLogoClick}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#1E3A5F] via-[#0284C7] to-[#38BDF8] flex items-center justify-center text-white shadow-md shadow-sky-100 shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all select-none relative group"
                title={isAdminLoggedIn ? 'Buka Panel Admin (Impor, Ekspor, Hemat Kuota)' : 'Klik untuk Login Admin'}
              >
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
                {isAdminLoggedIn && (
                  <span
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 border-2 border-white rounded-full flex items-center justify-center shadow-xs"
                    title="Admin Terotentikasi"
                  >
                    <span className="w-1.5 h-1.5 bg-amber-900 rounded-full"></span>
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-extrabold text-base sm:text-xl text-[#1E3A5F] tracking-tight truncate">
                    A K S A R A
                  </span>
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F0F9FF] text-[#0284C7] border border-sky-200 shrink-0">
                    <Sparkles className="w-3 h-3 text-[#38BDF8]" /> D3 – S3 Terpadu
                  </span>
                  {isAdminLoggedIn && (
                    <button
                      type="button"
                      onClick={() => setIsAdminPopupOpen(true)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
                      title="Buka Popup Admin"
                    >
                      <ShieldCheck className="w-3 h-3 text-amber-600" />
                      <span>Admin</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block truncate">
                  Aplikasi Kendali Skripsi, Tugas Akhir, & Riset Akademik
                </p>
              </div>
            </div>

            {/* Action Links */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* If Admin is logged in, show quick Admin Popup shortcut button */}
              {isAdminLoggedIn && (
                <button
                  type="button"
                  onClick={() => setIsAdminPopupOpen(true)}
                  className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold text-amber-900 bg-amber-100/90 hover:bg-amber-200 border border-amber-300 transition-all cursor-pointer shadow-2xs"
                  title="Panel Admin: Impor, Ekspor & Hemat Kuota"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-700" />
                  <span className="hidden sm:inline">Panel Admin</span>
                </button>
              )}

              <button
                onClick={onOpenAuditLog}
                type="button"
                className="inline-flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-sky-800 bg-sky-50/80 hover:bg-sky-100 border border-sky-200 transition-all cursor-pointer"
                title="Catatan integritas dan transparansi pemanggilan AI"
              >
                <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="hidden md:inline">Log AI</span>
                {auditCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-sky-200/80 text-sky-900">
                    {auditCount}
                  </span>
                )}
              </button>

              <button
                onClick={onOpenEthics}
                type="button"
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-[#1E3A5F] hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                title="Panduan etika penelitian dan standar Dikti"
              >
                <span>Etika Riset</span>
              </button>

              <button
                onClick={onOpenHistory}
                type="button"
                className="relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#1E3A5F] bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
              >
                <History className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="hidden xs:inline">Proyek</span>
                {savedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#1E3A5F] text-white">
                    {savedCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* FORM LOGIN ADMIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#1E3A5F] to-[#0284C7] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20">
                  <Lock className="w-5 h-5 text-sky-200" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg leading-tight">Login Admin</h3>
                  <p className="text-xs text-sky-100 mt-0.5">Akses panel kontrol sistem</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleLoginSubmit} className="p-5 space-y-4">
              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    autoFocus
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-sm text-slate-800 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-sm text-slate-800 outline-none transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1E3A5F] to-[#0284C7] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-sky-100 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-sky-200" />
                  <span>Masuk Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP ADMIN MODAL (Import, Export, Hemat Kuota) */}
      {isAdminPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#1E3A5F] via-[#0284C7] to-[#38BDF8] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white border border-white/20 shadow-inner">
                  <ShieldCheck className="w-5 h-5 text-sky-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg leading-tight">Panel Administrasi AKSARA</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-amber-950 border border-amber-300">
                      ADMIN
                    </span>
                  </div>
                  <p className="text-xs text-sky-100 mt-0.5">Kelola data cadangan dan optimasi kuota sistem</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminPopupOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/15 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 3 Fitur Utama (Import, Export, Hemat Kuota) */}
            <div className="p-5 space-y-4">
              {/* 1. Cadangan Proyek: Impor & Ekspor */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Manajemen Cadangan Data Proyek (.json)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* IMPOR TOMBOL */}
                  <label className="flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-sky-50/60 hover:border-sky-300 transition-all cursor-pointer group">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-800 block group-hover:text-sky-900">
                          Impor Cadangan
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Pulihkan proyek dari file JSON cadangan
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-semibold text-sky-700">
                      <span>Pilih File .json</span>
                      <span className="text-xs">→</span>
                    </div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        onImportProjectBackup(e);
                        setIsAdminPopupOpen(false);
                      }}
                      className="hidden"
                    />
                  </label>

                  {/* EKSPOR TOMBOL */}
                  <button
                    type="button"
                    onClick={onExportProjectBackup}
                    className="flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-sky-50/60 hover:border-sky-300 transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-800 block group-hover:text-emerald-900">
                          Ekspor Cadangan
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Simpan seluruh draf & riwayat ke file JSON
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-semibold text-emerald-700">
                      <span>Unduh File .json</span>
                      <span className="text-xs">↓</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Tombol Hemat Kuota */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Pengaturan Efisiensi AI
                </h4>

                <div
                  className={`p-4 rounded-xl border transition-all ${
                    isQuotaSaverMode
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isQuotaSaverMode
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        <Zap
                          className={`w-5 h-5 ${
                            isQuotaSaverMode ? 'fill-amber-300 text-amber-300' : 'text-slate-500'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-slate-800">
                            Efisiensi & Hemat Kuota AI
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isQuotaSaverMode
                                ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isQuotaSaverMode ? 'AKTIF (ON)' : 'NONAKTIF (OFF)'}
                          </span>
                          {isQuotaSaverMode && (
                            <>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Hemat ~80% Token
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                                Cache 24 Jam
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-600 mt-1">
                          {isQuotaSaverMode
                            ? 'Sistem menggunakan model ringan berkecepatan tinggi (Gemini Flash Lite), batas token presisi, dan cache cerdas agar kuota harian bertahan lama tanpa mengurangi kedalaman akademik.'
                            : 'Mode standar aktif: Menggunakan model analitis penuh untuk seluruh pemanggilan tanpa optimasi Lite.'}
                        </p>
                      </div>
                    </div>

                    {/* Interactive Switch */}
                    {onToggleQuotaSaverMode && (
                      <button
                        type="button"
                        onClick={onToggleQuotaSaverMode}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer shrink-0 shadow-xs ${
                          isQuotaSaverMode
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-800 text-white hover:bg-slate-700'
                        }`}
                      >
                        {isQuotaSaverMode ? 'Matikan' : 'Aktifkan'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Info Box */}
              <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl flex items-center gap-2 text-xs text-sky-800">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                <span>
                  Sesi Admin aktif sebagai <strong className="font-bold">admin123</strong>. Tombol ini diproteksi khusus untuk pengelola sistem.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleAdminLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                title="Keluar dari mode admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar Admin</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAdminPopupOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Tutup Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

