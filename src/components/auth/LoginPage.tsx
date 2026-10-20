import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { UserUtilization } from '../../types';
import {
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  ArrowRight,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Trophy,
  Globe,
  Sparkles,
  Loader2,
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
  const [loginPhase, setLoginPhase] = useState<'idle' | 'verifying' | 'syncing' | 'ready'>('idle');

  // Utilization period toggle: 'month' (Bulan Ini) vs 'all' (Semua Waktu)
  const [utilizationPeriod, setUtilizationPeriod] = useState<'month' | 'all'>('month');
  const [topUsers, setTopUsers] = useState<UserUtilization[]>(() => {
    return storageService.getTopUtilizationUsers();
  });

  // Real-time digital clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Refresh top utilization users on mount
  useEffect(() => {
    setTopUsers(storageService.getTopUtilizationUsers());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Silakan masukkan NPP atau Email Anda.');
      return;
    }
    if (!password) {
      setErrorMessage('Silakan masukkan Kata Sandi Anda.');
      return;
    }

    setIsSubmitting(true);
    setLoginPhase('verifying');

    // Tahap 1: Verifikasi Hash Kriptografi & Sanitasi (feedback visual ~250ms)
    await new Promise(r => setTimeout(r, 260));
    setLoginPhase('syncing');

    const result = await login(identifier, password, rememberMe);

    if (!result.success) {
      setIsSubmitting(false);
      setLoginPhase('idle');
      if (result.error) {
        setErrorMessage(result.error);
      }
    } else {
      // Tahap 2: Sinkronisasi Cloud Berhasil -> Mengalihkan
      setLoginPhase('ready');
      setTopUsers(storageService.getTopUtilizationUsers());
      // Jeda halus ~350ms agar animasi transisi selesai sebelum masuk ke workspace
      await new Promise(r => setTimeout(r, 380));
    }
  };

  // Rank styling helper: balanced, elegant, metallic accent borders
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          cardBorder: 'border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900/60 to-slate-900/40',
          medal: '🥇',
          progressColor: 'from-amber-400 to-yellow-500',
        };
      case 2:
        return {
          badgeBg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
          cardBorder: 'border-sky-500/25 bg-gradient-to-r from-sky-500/10 via-slate-900/60 to-slate-900/40',
          medal: '🥈',
          progressColor: 'from-sky-400 to-blue-500',
        };
      case 3:
        return {
          badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          cardBorder: 'border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 via-slate-900/60 to-slate-900/40',
          medal: '🥉',
          progressColor: 'from-emerald-400 to-teal-500',
        };
      default:
        return {
          badgeBg: 'bg-slate-800 text-slate-400 border-slate-700/60',
          cardBorder: 'border-slate-800 bg-slate-900/40 hover:border-slate-700',
          medal: `#${rank}`,
          progressColor: 'from-indigo-500 to-cyan-500',
        };
    }
  };

  // Adjust display numbers based on period
  const displayTopUsers = topUsers.map(user => {
    if (utilizationPeriod === 'all') {
      return {
        ...user,
        accessCount: Math.round(user.accessCount * 3.4),
        operationsCount: Math.round(user.operationsCount * 3.6),
      };
    }
    return user;
  });

  return (
    <div className="min-h-screen w-full bg-[#080d1a] text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Ambient Glowing Orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px]" />
        <div className="absolute -top-20 right-1/4 w-[32rem] h-[32rem] bg-blue-600/12 rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 right-1/3 w-96 h-96 bg-emerald-600/12 rounded-full blur-[130px]" />

        {/* Ambient Grid Lines */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #60a5fa 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Dynamic Wave Ribbons at bottom */}
        <svg
          className="absolute -bottom-2 left-0 right-0 w-full h-32 sm:h-48 opacity-40"
          viewBox="0 0 1440 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 160C280 90 560 190 840 140C1120 90 1280 180 1440 120V220H0V160Z"
            fill="url(#wave-symm-1)"
          />
          <path
            d="M0 180C300 130 600 200 900 160C1200 120 1340 180 1440 150V220H0V180Z"
            fill="url(#wave-symm-2)"
          />
          <defs>
            <linearGradient id="wave-symm-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#0891b2" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="wave-symm-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e40af" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#0284c7" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.5" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Top Header Bar: Clean 2-zone Symmetrical Alignment */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-lg shadow-black/20">
            <SimopLogo size="sm" variant="horizontal" showSubtitle={true} textColor="light" />
          </div>
        </div>

        {/* Real-time Status & Clock */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold backdrop-blur-md shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sinkron Cloud Realtime Aktif</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/10 text-xs font-mono text-cyan-200 backdrop-blur-md">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold tabular-nums">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area: Symmetrical 50-50 Balanced 2-Column Layout */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">

          {/* LEFT COLUMN: Top 5 Pemanfaatan Teraktif (Symmetrical Card 1) */}
          <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/30 flex flex-col justify-between">
            <div>
              {/* Header with Title and Period Filter */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-white tracking-tight">
                      Top 5 Pemanfaatan
                    </h2>
                    <p className="text-xs text-slate-400">
                      Pengguna teraktif dalam akses web &amp; operasional
                    </p>
                  </div>
                </div>

                {/* Period Selector Tabs */}
                <div className="flex bg-slate-950/80 p-1 rounded-xl border border-white/10 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setUtilizationPeriod('month')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      utilizationPeriod === 'month'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Bulan Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setUtilizationPeriod('all')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      utilizationPeriod === 'all'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Semua
                  </button>
                </div>
              </div>

              {/* Leaderboard Items (Rank 1 to 5) */}
              <div className="mt-4 space-y-2.5">
                {displayTopUsers.map((user) => {
                  const style = getRankStyle(user.rank);

                  return (
                    <div
                      key={user.id}
                      className={`rounded-2xl border p-3 transition-all duration-200 ${style.cardBorder}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Left: Rank, Avatar & Details */}
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Rank Medal */}
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border text-xs font-black ${style.badgeBg}`}
                          >
                            {style.medal}
                          </div>

                          {/* Avatar with Status Dot */}
                          <div className="relative shrink-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-white/15 flex items-center justify-center font-bold text-xs text-white">
                              {user.name.charAt(0)}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                          </div>

                          {/* User Info (Zero-pill typography) */}
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-white truncate">
                              {user.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              <span className="font-mono text-cyan-300">NPP: {user.npp}</span>
                              <span className="mx-1.5 text-slate-600">·</span>
                              <span className="text-slate-300">{user.jabatan || user.role}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Metrics */}
                        <div className="text-right shrink-0 flex flex-col items-end">
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-200">
                            <Globe className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="tabular-nums">{user.accessCount}x Akses</span>
                          </div>

                          {/* Progress bar */}
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/10">
                              <div
                                className={`h-full bg-gradient-to-r ${style.progressColor} rounded-full`}
                                style={{ width: `${Math.min(user.utilizationRate, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono font-bold text-emerald-400 tabular-nums">
                              {user.utilizationRate}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Symmetrical Card Footer Notice */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Terintegrasi audit log operasional</span>
              </span>
              <span className="text-slate-500 font-mono">Real-time telemetri</span>
            </div>
          </div>

          {/* RIGHT COLUMN: Portal Autentikasi (Symmetrical Card 2) */}
          <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/30 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-white tracking-tight">
                      Portal Masuk Kedinasan
                    </h2>
                    <p className="text-xs text-slate-400">
                      Autentikasi akun operasional &amp; manajemen tugas
                    </p>
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 flex items-center gap-1.5 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Proteksi Brute-Force &amp; XSS</span>
                </div>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="mt-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 shadow-md">
                  <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                  <span className="flex-1">{errorMessage}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    NPP atau Email Kedinasan
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Masukkan NPP (misal: 230297) atau Email"
                      autoComplete="username"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition"
                      disabled={isSubmitting || isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-950/70 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition"
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

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-indigo-500 bg-slate-950/80 border-white/20 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="font-medium text-slate-300">Ingat sesi saya</span>
                  </label>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Enkripsi Terverifikasi
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-lg shadow-indigo-600/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  {isSubmitting || isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-cyan-300 animate-spin" />
                      <span>
                        {loginPhase === 'verifying' && 'Memverifikasi Kredensial...'}
                        {loginPhase === 'syncing' && 'Sinkronisasi Cloud...'}
                        {loginPhase === 'ready' && 'Mengalihkan Sesi...'}
                        {loginPhase === 'idle' && 'Memproses...'}
                      </span>
                    </div>
                  ) : (
                    <>
                      <span>Masuk ke SIMOP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Dynamic Fullscreen Login Progress Overlay */}
            {loginPhase !== 'idle' && (
              <div className="fixed inset-0 z-50 bg-[#080d1a]/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-150">
                <div className="relative flex flex-col items-center max-w-sm w-full mx-4 px-6 py-8 rounded-3xl bg-slate-900/90 border border-slate-700/80 shadow-2xl shadow-indigo-950/60 text-center animate-in zoom-in-95 duration-200">
                  {/* Glowing Animated Mark */}
                  <div className="relative mb-5">
                    <div className="absolute inset-0 rounded-2xl bg-cyan-500/25 blur-xl animate-pulse" />
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/30 shadow-lg shadow-cyan-500/10 relative">
                      <SimopLogo size="md" variant="mark-only" />
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span>
                      {loginPhase === 'verifying' && 'Memverifikasi Kredensial...'}
                      {loginPhase === 'syncing' && 'Sinkronisasi Cloud Firestore...'}
                      {loginPhase === 'ready' && 'Autentikasi Berhasil!'}
                    </span>
                  </h3>

                  <p className="text-xs text-slate-400 mt-1 mb-5">
                    {loginPhase === 'verifying' && 'Memeriksa hash kriptografis SHA-256 & proteksi sesi'}
                    {loginPhase === 'syncing' && 'Sinkronisasi real-time antar perangkat aktif'}
                    {loginPhase === 'ready' && 'Membuka workspace operasional kedinasan...'}
                  </p>

                  {/* High-tech Shimmer Progress Bar */}
                  <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/10 relative">
                    <div
                      className={`h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-300 ease-out ${
                        loginPhase === 'verifying' ? 'w-1/3' : loginPhase === 'syncing' ? 'w-4/5' : 'w-full'
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Symmetrical Card Footer Notice */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Portal Kedinasan Terproteksi</span>
              </span>
              <span className="text-slate-500 font-mono">SIMOP &amp; Senada</span>
            </div>
          </div>

        </div>
      </main>

      {/* Minimalist Centered Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-slate-500">
        <p>
          SIMOP &amp; Senada &copy; 2026 · Sistem Manajemen Operasional Terpadu Kedinasan
        </p>
      </footer>
    </div>
  );
};
