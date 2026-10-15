import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Calendar,
  BarChart3,
  Layers,
  GraduationCap,
  Sparkles,
  Crown,
} from 'lucide-react';
import { SimopLogo } from '../ui/SimopLogo';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Silakan masukkan Email atau NPP Anda.');
      return;
    }
    if (!password) {
      setErrorMessage('Silakan masukkan Password Anda.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(identifier, password, rememberMe);
    setIsSubmitting(false);

    if (!result.success && result.error) {
      setErrorMessage(result.error);
    }
  };

  const setQuickUser = (npp: string) => {
    setIdentifier(npp);
    setPassword('password123');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white via-sky-50/30 to-emerald-50/20 text-slate-800 flex flex-col justify-between relative overflow-x-hidden">
      {/* Dynamic Background Wave Ribbons matching the reference image */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft radial glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[32rem] h-[32rem] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 w-[36rem] h-64 bg-teal-400/10 rounded-full blur-3xl" />

        {/* Bottom stylized ribbon waves */}
        <svg
          className="absolute -bottom-6 left-0 right-0 w-full h-36 md:h-52 opacity-85 preserve-3d"
          viewBox="0 0 1440 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-40 200C220 120 480 220 780 160C1080 100 1260 210 1480 130V260H-40V200Z"
            fill="url(#wave-gradient-1)"
          />
          <path
            d="M-20 220C260 160 540 230 840 180C1140 130 1320 200 1500 160V260H-20V220Z"
            fill="url(#wave-gradient-2)"
          />
          <defs>
            <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#0284c7" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="wave-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.65" />
              <stop offset="55%" stopColor="#06b6d4" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-3 flex items-center justify-between">
        {/* Brand Logo matching user reference image */}
        <div className="flex items-center gap-3">
          <SimopLogo size="md" variant="horizontal" showSubtitle={true} />
        </div>

        {/* Cursive slogan on the top right from the reference image */}
        <div className="hidden md:flex flex-col items-end text-right">
          <span className="text-sm lg:text-base font-extrabold italic text-slate-800 tracking-wide font-serif leading-tight">
            Bersama Menuju Layanan
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm lg:text-base font-extrabold italic text-emerald-600 tracking-wide font-serif leading-tight">
              Yang Lebih Baik
            </span>
            <div className="w-8 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column (Hero Content & Visual Showcase from Reference Image) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Headline matching user image */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-slate-900">
                <span className="block text-[#0b2545]">Satu Sistem,</span>
                <span className="block bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  Kerja Lebih Mudah
                </span>
              </h1>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl pt-1">
                SIMOP Terpadu hadir untuk mendukung pengelolaan jadwal, monitoring, dan layanan
                operasional petugas secara terintegrasi, efisien, dan real-time.
              </p>
            </div>

            {/* Pill Tags: [✓] Terintegrasi | Efisien | Real-time */}
            <div className="inline-flex items-center gap-2 sm:gap-3 px-4 py-2 bg-emerald-50/90 border border-emerald-200/80 rounded-full shadow-2xs text-xs sm:text-sm font-bold text-emerald-900">
              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className="hover:text-emerald-700 transition">Terintegrasi</span>
              <span className="text-emerald-300">|</span>
              <span className="hover:text-emerald-700 transition">Efisien</span>
              <span className="text-emerald-300">|</span>
              <span className="hover:text-emerald-700 transition">Real-time</span>
            </div>

            {/* Hero Banner / Laptop Mockup Showcase */}
            <div className="relative pt-2 group">
              <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-slate-200/80 border border-slate-200/80 bg-white">
                <img
                  src="/simop_hero_banner.jpg"
                  alt="SIMOP Terpadu Dashboard Showcase"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-cover max-h-[300px] sm:max-h-[340px]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/src/assets/images/simop_hero_banner_1790746658146.jpg';
                  }}
                />

                {/* Subtle Interactive Floating Overlays matching reference image icons */}
                <div className="absolute top-4 right-4 hidden sm:flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm animate-pulse">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[11px] font-bold text-slate-700">Sistem Online &amp; Terkoneksi</span>
                </div>
              </div>

              {/* Mini feature indicators */}
              <div className="grid grid-cols-3 gap-2.5 pt-3">
                <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">Jadwal Shift</div>
                    <div className="text-[10px] text-slate-400">Petugas, TL, QA</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">Kategori Senada</div>
                    <div className="text-[10px] text-slate-400">Sinkronisasi Realtime</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">Uji Pemahaman</div>
                    <div className="text-[10px] text-slate-400">PG &amp; Soal Essay</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Clean, Pristine Login Card */}
          <div className="lg:col-span-5">
            <div className="w-full bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/80 border border-slate-200/80 relative">
              {/* Card top badge */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Portal Masuk Petugas
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                  Resmi v2.6
                </span>
              </div>

              <div className="mb-5">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Masuk ke Akun
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Masukkan NPP (Nomor Pokok Petugas) atau Email instansi Anda
                </p>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-shake">
                  <div className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email atau NPP
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="Contoh: KOR001, TL001, atau email"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition"
                      disabled={isSubmitting || isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi akun"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition"
                      disabled={isSubmitting || isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-600">Ingat Saya</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Default: <strong className="text-slate-600 font-mono">password123</strong>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting || isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Masuk ke Sistem</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Login Role Pills for Testing & Simulation */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Akses Cepat Pengujian Role (1-Klik):
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </div>
                {/* Special Master Owner Account */}
                <div className="mb-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('bcmubarok@gmail.com');
                      setPassword('password123');
                      setErrorMessage('');
                    }}
                    className="w-full text-left p-2.5 rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 shadow-sm transition flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white flex items-center justify-center font-bold shadow-xs">
                        <Crown className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-amber-950">
                            B.C. Mubarok (Master / Pemilik)
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-200 text-amber-900 border border-amber-300 uppercase">
                            Super Owner
                          </span>
                        </div>
                        <div className="text-[10px] text-amber-800 font-medium">
                          Email: <strong>bcmubarok@gmail.com</strong> &bull; NPP: MASTER001
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-900 px-2 py-1 rounded-lg bg-white/80 border border-amber-300 group-hover:bg-white transition">
                      Pilih Akun &rarr;
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickUser('KOR001')}
                    className="text-left p-2 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 transition flex flex-col cursor-pointer"
                  >
                    <span className="text-[11px] font-extrabold text-purple-900">KOORDINATOR</span>
                    <span className="text-[10px] text-purple-700">NPP: KOR001 (Admin)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickUser('TL001')}
                    className="text-left p-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 transition flex flex-col cursor-pointer"
                  >
                    <span className="text-[11px] font-extrabold text-blue-900">TEAM LEADER (TL 1)</span>
                    <span className="text-[10px] text-blue-700">NPP: TL001 (Admin)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickUser('TL002')}
                    className="text-left p-2 rounded-xl border border-cyan-200 bg-cyan-50/70 hover:bg-cyan-100 transition flex flex-col cursor-pointer"
                  >
                    <span className="text-[11px] font-extrabold text-cyan-900">TEAM LEADER (TL 2)</span>
                    <span className="text-[10px] text-cyan-700">NPP: TL002 (Admin)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickUser('QA001')}
                    className="text-left p-2 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100 transition flex flex-col cursor-pointer"
                  >
                    <span className="text-[11px] font-extrabold text-teal-900">QUALITY ASSURANCE</span>
                    <span className="text-[10px] text-teal-700">NPP: QA001 (User)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickUser('PET001')}
                    className="text-left p-2 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 transition flex flex-col cursor-pointer"
                  >
                    <span className="text-[11px] font-extrabold text-emerald-900">PETUGAS (Tim 1)</span>
                    <span className="text-[10px] text-emerald-700">NPP: PET001 (User)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickUser('PET002')}
                    className="text-left p-2 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 transition flex flex-col cursor-pointer"
                  >
                    <span className="text-[11px] font-extrabold text-emerald-900">PETUGAS (Tim 2)</span>
                    <span className="text-[10px] text-emerald-700">NPP: PET002 (User)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-200/50">
        <div className="flex items-center gap-2">
          <SimopLogo size="sm" variant="mark-only" className="w-5 h-5" />
          <span className="font-semibold text-slate-700">SIMOP TERPADU</span>
          <span>&bull;</span>
          <span>Sistem Informasi Operasional Petugas</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Hak Cipta Terlindungi &copy; {new Date().getFullYear()} &bull; Layanan Terintegrasi
        </div>
      </footer>
    </div>
  );
};
