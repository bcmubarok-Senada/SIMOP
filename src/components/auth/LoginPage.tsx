import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  ArrowRight,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles,
  Crown,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Zap,
  Users,
  Sun,
  Sunset,
  Moon,
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
  const [activeTab, setActiveTab] = useState<'form' | 'quick'>('form');

  // Real-time clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Time-based dynamic greeting
  const greeting = (() => {
    const hour = currentTime.getHours();
    if (hour >= 4 && hour < 11) {
      return { text: 'Selamat Pagi', icon: <Sun className="w-4 h-4 text-amber-400" /> };
    } else if (hour >= 11 && hour < 15) {
      return { text: 'Selamat Siang', icon: <Sun className="w-4 h-4 text-yellow-400" /> };
    } else if (hour >= 15 && hour < 18) {
      return { text: 'Selamat Sore', icon: <Sunset className="w-4 h-4 text-orange-400" /> };
    } else {
      return { text: 'Selamat Malam', icon: <Moon className="w-4 h-4 text-indigo-300" /> };
    }
  })();

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

  const handleQuickLogin = async (id: string, pass: string = 'password123') => {
    setIdentifier(id);
    setPassword(pass);
    setErrorMessage('');
    setIsSubmitting(true);
    const result = await login(id, pass, rememberMe);
    setIsSubmitting(false);
    if (!result.success && result.error) {
      setErrorMessage(result.error);
    }
  };

  const setFormQuickUser = (npp: string) => {
    setIdentifier(npp);
    setPassword('password123');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen w-full bg-[#070e1b] text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      {/* Dynamic Background Atmosphere (Not just plain white - rich navy cyber aurora) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Subtle radial aurora glows */}
        <div className="absolute -top-40 -left-40 w-[38rem] h-[38rem] bg-cyan-600/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/4 right-0 w-[42rem] h-[42rem] bg-blue-600/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-20 left-1/3 w-[36rem] h-[36rem] bg-emerald-500/15 rounded-full blur-[130px]" />

        {/* Ambient Grid Matrix Lines */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #38bdf8 1px, transparent 0)`,
            backgroundSize: '36px 36px',
          }}
        />

        {/* Dynamic Stylized Ribbon Wave Slices at bottom */}
        <svg
          className="absolute -bottom-4 left-0 right-0 w-full h-44 sm:h-64 opacity-50 preserve-3d"
          viewBox="0 0 1440 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-40 210C220 130 480 230 780 170C1080 110 1260 220 1480 140V270H-40V210Z"
            fill="url(#wave-dynamic-1)"
          />
          <path
            d="M-20 230C260 170 540 240 840 190C1140 140 1320 210 1500 170V270H-20V230Z"
            fill="url(#wave-dynamic-2)"
          />
          <defs>
            <linearGradient id="wave-dynamic-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.45" />
            </linearGradient>
            <linearGradient id="wave-dynamic-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0369a1" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.65" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-3 flex items-center justify-between">
        {/* Brand Logo with light variant */}
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-lg shadow-cyan-950/30">
            <SimopLogo size="md" variant="horizontal" showSubtitle={true} textColor="light" />
          </div>
        </div>

        {/* Live Clock & Operational Status */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Live System Uptime Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold backdrop-blur-md shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 -ml-3" />
            <span>Sistem Operasional Aktif</span>
          </div>

          {/* Real-time Digital Clock */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/60 border border-white/10 text-xs font-mono text-cyan-200 backdrop-blur-md shadow-xs">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column (Hero Content, Showcase & Feature Pills) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Dynamic Greeting & Operational Title */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-800/80 border border-white/10 text-xs font-medium text-slate-300 backdrop-blur-md">
                {greeting.icon}
                <span>{greeting.text}, Rekan Petugas</span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-emerald-400 font-semibold">Portal Layanan Terpadu</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.12]">
                <span className="block text-white">Satu Sistem,</span>
                <span className="block bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                  Kerja Lebih Mudah &amp; Terukur
                </span>
              </h1>

              <p className="text-slate-300/90 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
                SIMOP Terpadu menyatukan manajemen jadwal piket shift, monitoring presensi petugas,
                sinkronisasi layanan Senada, dan pengujian kompetensi dalam satu platform terpusat.
              </p>
            </div>

            {/* Interactive Feature Pills */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-950/50 border border-sky-500/30 text-sky-300 font-medium backdrop-blur-md">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Jadwal Lengkap Petugas</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 font-medium backdrop-blur-md">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Referensi Shift Dinamis</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 font-medium backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Multi-Role RBAC Terintegrasi</span>
              </div>
            </div>

            {/* Visual Hero Showcase Card */}
            <div className="relative pt-1 group">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-cyan-950/40 border border-white/10 bg-slate-900/60 backdrop-blur-md">
                <img
                  src="/simop_hero_banner.jpg"
                  alt="SIMOP Terpadu Dashboard Showcase"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-cover max-h-[260px] sm:max-h-[300px] brightness-95 group-hover:scale-[1.01] transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/src/assets/images/simop_hero_banner_1790746658146.jpg';
                  }}
                />

                {/* Live telemetry floating badge */}
                <div className="absolute top-3 right-3 hidden sm:flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-xs text-white shadow-lg">
                  <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="font-semibold text-[11px]">Real-time Roster Sync</span>
                </div>
              </div>

              {/* 3 Quick Modules Info Cards */}
              <div className="grid grid-cols-3 gap-2.5 pt-3">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-md flex items-center gap-2.5 hover:border-cyan-500/40 transition">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">Jadwal Shift</div>
                    <div className="text-[10px] text-slate-400 truncate">Roster Keseluruhan</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-md flex items-center gap-2.5 hover:border-emerald-500/40 transition">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">Kategori Senada</div>
                    <div className="text-[10px] text-slate-400 truncate">Monitoring Piket</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-md flex items-center gap-2.5 hover:border-purple-500/40 transition">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">Uji Pemahaman</div>
                    <div className="text-[10px] text-slate-400 truncate">PG &amp; Essay Otomatis</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sleek Glassmorphism Login Terminal */}
          <div className="lg:col-span-5">
            <div className="w-full bg-slate-900/80 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl shadow-2xl shadow-blue-950/60 border border-white/15 relative">
              {/* Card Header & Dynamic Tab Switcher */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                    Portal Masuk Petugas
                  </span>
                </div>
                <div className="flex bg-slate-950/60 p-1 rounded-xl border border-white/10 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('form')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      activeTab === 'form'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Masuk Akun
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('quick')}
                    className={`px-3 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                      activeTab === 'quick'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Akses Cepat</span>
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <div className="mb-5">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {activeTab === 'form' ? 'Autentikasi Akun' : 'Pilih Akun Simulasi / Demo'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {activeTab === 'form'
                    ? 'Masukkan NPP (Nomor Pokok Petugas) atau Email kedinasan'
                    : 'Pilih role akun di bawah untuk langsung masuk dalam 1-klik'}
                </p>
              </div>

              {/* Error Toast */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-rose-400 mt-1 shrink-0 animate-ping" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* TAB 1: Standard Credential Form */}
              {activeTab === 'form' && (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Email atau NPP
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Contoh: KOR001, TL001, PET001, atau email"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition"
                        disabled={isSubmitting || isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Kata Sandi (Password)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan kata sandi akun"
                        className="w-full pl-10 pr-11 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition"
                        disabled={isSubmitting || isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
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
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-emerald-500 bg-slate-950/80 border-white/20 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="font-semibold text-slate-300">Ingat Sesi Saya</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Default: <strong className="text-cyan-300 font-mono">password123</strong>
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-cyan-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isSubmitting || isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Masuk ke Sistem Terpadu</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  {/* Quick autofill helper chips */}
                  <div className="pt-3 border-t border-white/10">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Pintasan Isi Form Cepat:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFormQuickUser('MASTER001')}
                        className="px-2 py-1 rounded-lg bg-amber-950/50 border border-amber-500/30 text-amber-300 text-[10px] font-bold hover:bg-amber-900/60 transition cursor-pointer"
                      >
                        👑 Super Owner
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormQuickUser('KOR001')}
                        className="px-2 py-1 rounded-lg bg-purple-950/50 border border-purple-500/30 text-purple-300 text-[10px] font-bold hover:bg-purple-900/60 transition cursor-pointer"
                      >
                        Koordinator
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormQuickUser('TL001')}
                        className="px-2 py-1 rounded-lg bg-blue-950/50 border border-blue-500/30 text-blue-300 text-[10px] font-bold hover:bg-blue-900/60 transition cursor-pointer"
                      >
                        Team Leader 1
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormQuickUser('QA001')}
                        className="px-2 py-1 rounded-lg bg-teal-950/50 border border-teal-500/30 text-teal-300 text-[10px] font-bold hover:bg-teal-900/60 transition cursor-pointer"
                      >
                        QA
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormQuickUser('PET001')}
                        className="px-2 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold hover:bg-emerald-900/60 transition cursor-pointer"
                      >
                        Petugas Tim 1
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* TAB 2: Instant 1-Click Interactive Login Grid */}
              {activeTab === 'quick' && (
                <div className="space-y-2.5">
                  {/* Master Owner Highlight */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('bcmubarok@gmail.com')}
                    className="w-full text-left p-3 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/70 via-yellow-950/40 to-slate-900/80 hover:border-amber-400 transition-all flex items-center justify-between cursor-pointer group shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 flex items-center justify-center font-black shadow-md">
                        <Crown className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-amber-200">
                            B.C. Mubarok
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-slate-950 uppercase">
                            Super Owner
                          </span>
                        </div>
                        <div className="text-[10px] text-amber-300/80 font-mono">
                          bcmubarok@gmail.com &bull; MASTER001
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-300 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 group-hover:bg-amber-500/30 transition">
                      Masuk Langsung &rarr;
                    </span>
                  </button>

                  {/* Grid of Other Roles */}
                  <div className="grid grid-cols-2 gap-2 text-left">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('KOR001')}
                      className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/40 hover:border-purple-400/60 transition flex flex-col cursor-pointer group"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] font-extrabold text-purple-300">KOORDINATOR</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300">Admin</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">NPP: KOR001</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin('TL001')}
                      className="p-2.5 rounded-xl border border-blue-500/30 bg-blue-950/40 hover:bg-blue-900/40 hover:border-blue-400/60 transition flex flex-col cursor-pointer group"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] font-extrabold text-blue-300">TEAM LEADER 1</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-300">Admin</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">NPP: TL001</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin('TL002')}
                      className="p-2.5 rounded-xl border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/40 hover:border-cyan-400/60 transition flex flex-col cursor-pointer group"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] font-extrabold text-cyan-300">TEAM LEADER 2</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300">Admin</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">NPP: TL002</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin('QA001')}
                      className="p-2.5 rounded-xl border border-teal-500/30 bg-teal-950/40 hover:bg-teal-900/40 hover:border-teal-400/60 transition flex flex-col cursor-pointer group"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] font-extrabold text-teal-300">QUALITY ASSURANCE</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-teal-500/20 text-teal-300">User</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">NPP: QA001</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin('PET001')}
                      className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/40 hover:border-emerald-400/60 transition flex flex-col cursor-pointer group"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] font-extrabold text-emerald-300">PETUGAS (Tim 1)</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300">User</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">NPP: PET001</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin('PET002')}
                      className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/40 hover:border-emerald-400/60 transition flex flex-col cursor-pointer group"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] font-extrabold text-emerald-300">PETUGAS (Tim 2)</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300">User</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">NPP: PET002</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Security Assurance inside card */}
              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Akses Terenkripsi &amp; Aman</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400/90">v2.6 Terpadu</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modern Fullscreen Footer Ticker Bar */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 border-t border-white/10">
        <div className="flex items-center gap-2">
          <SimopLogo size="sm" variant="mark-only" className="w-5 h-5" />
          <span className="font-bold text-white tracking-wide">SIMOP TERPADU</span>
          <span className="text-slate-600">&bull;</span>
          <span className="text-slate-300">Sistem Informasi Operasional Petugas</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Monitoring Shift &amp; Roster Aktif
          </span>
          <span className="text-slate-600">&bull;</span>
          <span className="text-slate-400">Hak Cipta Terlindungi &copy; {currentTime.getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
};
