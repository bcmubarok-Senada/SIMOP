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
  Activity,
  Zap,
  Sun,
  Sunset,
  Moon,
  Trophy,
  Flame,
  Globe,
  TrendingUp,
  Award,
  Sparkles,
  BarChart3,
  Calendar,
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

  // Utilization Leaderboard state
  const [utilizationPeriod, setUtilizationPeriod] = useState<'month' | 'all'>('month');
  const [topUsers, setTopUsers] = useState<UserUtilization[]>(() => {
    return storageService.getTopUtilizationUsers();
  });

  // Real-time clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Refresh top utilization users periodically or on mount
  useEffect(() => {
    setTopUsers(storageService.getTopUtilizationUsers());
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
      setErrorMessage('Silakan masukkan Kata Sandi Anda.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(identifier, password, rememberMe);
    setIsSubmitting(false);

    if (!result.success && result.error) {
      setErrorMessage(result.error);
    } else if (result.success) {
      // Refresh top utilization users after successful login
      setTopUsers(storageService.getTopUtilizationUsers());
    }
  };

  // Rank badge styling helper
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          ring: 'ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20',
          gradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
          icon: <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />,
          label: 'Peringkat 1',
        };
      case 2:
        return {
          bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          ring: 'ring-1 ring-sky-400/40',
          gradient: 'from-sky-500/20 via-cyan-500/10 to-transparent',
          icon: <Award className="w-4 h-4 text-sky-300" />,
          label: 'Peringkat 2',
        };
      case 3:
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          ring: 'ring-1 ring-emerald-400/40',
          gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
          icon: <Award className="w-4 h-4 text-emerald-400" />,
          label: 'Peringkat 3',
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-white/10',
          ring: '',
          gradient: 'from-slate-800/40 to-transparent',
          icon: <span className="font-bold text-xs">#{rank}</span>,
          label: `Peringkat ${rank}`,
        };
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070e1b] text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      {/* Dynamic Background Atmosphere (Rich Midnight Cyan / Emerald Aurora) */}
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
          {/* Live System Status Pill */}
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column: Headline & Top 5 Pemanfaatan Berdasarkan Pengguna Teraktif */}
          <div className="lg:col-span-7 space-y-5">
            {/* Dynamic Greeting & Institutional Heading */}
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-800/80 border border-white/10 text-xs font-medium text-slate-300 backdrop-blur-md">
                {greeting.icon}
                <span>{greeting.text}, Rekan Petugas</span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-emerald-400 font-semibold">Portal Layanan Terpadu</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-[1.15]">
                <span className="block text-white">Satu Sistem Terpadu,</span>
                <span className="block bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                  Manajemen Roster &amp; Operasional Petugas
                </span>
              </h1>

              <p className="text-slate-300/90 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
                SIMOP Terpadu mengintegrasikan pemantauan roster dinas 24/7, evaluasi kepatuhan kuota shift,
                sinkronisasi penugasan Senada, dan pengujian kompetensi petugas secara terpusat.
              </p>
            </div>

            {/* TOP 5 PEMANFAATAN BERDASARKAN PENGGUNA TERAKTIF WIDGET */}
            <div className="rounded-2xl border border-white/15 bg-slate-900/80 backdrop-blur-2xl p-4 sm:p-5 shadow-2xl shadow-cyan-950/40 relative overflow-hidden">
              {/* Subtle accent glow */}
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Widget Header & Period Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                        <span>Top 5 Pemanfaatan Aplikasi</span>
                        <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                        Live Telemetri
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Pengguna paling sering mengakses web &amp; memanfaatkan modul operasional
                    </p>
                  </div>
                </div>

                {/* Period Selector Tabs */}
                <div className="flex bg-slate-950/70 p-0.5 rounded-xl border border-white/10 text-[11px] font-bold self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => setUtilizationPeriod('month')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      utilizationPeriod === 'month'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Bulan Berjalan
                  </button>
                  <button
                    type="button"
                    onClick={() => setUtilizationPeriod('all')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      utilizationPeriod === 'all'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Akumulasi
                  </button>
                </div>
              </div>

              {/* Leaderboard Items (Rank 1 to 5) */}
              <div className="space-y-2.5">
                {topUsers.map((user) => {
                  const badge = getRankBadge(user.rank);
                  const isTopOne = user.rank === 1;

                  return (
                    <div
                      key={user.id}
                      className={`relative rounded-xl border p-3 transition-all duration-200 bg-gradient-to-r ${badge.gradient} ${
                        isTopOne
                          ? 'border-amber-500/40 bg-slate-900/90 shadow-md shadow-amber-950/20'
                          : 'border-white/10 bg-slate-900/60 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Left: Rank & Avatar & Details */}
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Rank Icon / Number */}
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 border ${badge.bg} font-black ${badge.ring}`}
                          >
                            {badge.icon}
                          </div>

                          {/* User Avatar with live status dot */}
                          <div className="relative shrink-0">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 border border-white/15 flex items-center justify-center font-bold text-xs text-white">
                              {user.name.charAt(0)}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
                          </div>

                          {/* Name, Role & NPP */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-white truncate">
                                {user.name}
                              </span>
                              {user.badge && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400/20 border border-amber-400/40 text-amber-300 uppercase">
                                  {user.badge}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                              <span className="font-mono text-cyan-300">NPP: {user.npp}</span>
                              <span className="text-slate-600">&bull;</span>
                              <span className="text-slate-300 truncate">{user.role}</span>
                              <span className="text-slate-600 hidden sm:inline">&bull;</span>
                              <span className="text-slate-400 text-[10px] hidden sm:inline truncate">
                                {user.primaryModule}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Access Metrics & Utilization Score */}
                        <div className="text-right shrink-0 flex flex-col items-end">
                          <div className="flex items-center gap-2">
                            {/* Web Visits Pill */}
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-950/60 border border-sky-500/30 text-sky-300 text-[10px] sm:text-xs font-bold">
                              <Globe className="w-3 h-3 text-sky-400" />
                              <span>{user.accessCount}x Akses Web</span>
                            </div>

                            {/* Operations Count */}
                            <div className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px] sm:text-xs font-bold">
                              <Zap className="w-3 h-3 text-emerald-400" />
                              <span>{user.operationsCount} Aksi</span>
                            </div>
                          </div>

                          {/* Utilization Score Progress Bar */}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <div className="w-16 sm:w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/10">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full"
                                style={{ width: `${Math.min(user.utilizationRate, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-black text-emerald-300 font-mono">
                              {user.utilizationRate}%
                            </span>
                          </div>

                          <span className="text-[9px] text-slate-400 mt-0.5">
                            Aktif: <strong className="text-slate-300">{user.lastActive}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Telemetry Quick Summary */}
              <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Akumulasi: <strong className="text-white">1.035+ Sesi Akses</strong> &bull; Rata-rata Utilisasi: <strong className="text-emerald-300">94.1%</strong></span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Diperbarui Real-time via Audit Log</span>
                </div>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-950/50 border border-sky-500/30 text-sky-300 font-medium backdrop-blur-md">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Roster Keseluruhan Petugas</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 font-medium backdrop-blur-md">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Referensi Shift Lengkap &amp; Dinamis</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 font-medium backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Multi-Role RBAC Terverifikasi</span>
              </div>
            </div>
          </div>

          {/* Right Column: Sleek Glassmorphism Login Terminal (Clean, Single Admin, No Demo Shortcuts) */}
          <div className="lg:col-span-5">
            <div className="w-full bg-slate-900/85 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl shadow-2xl shadow-blue-950/60 border border-white/15 relative">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                    Portal Masuk Petugas
                  </span>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-slate-950/70 border border-white/10 text-[10px] font-mono text-cyan-300">
                  SIMOP v2.6
                </div>
              </div>

              {/* Title & Description */}
              <div className="mb-5">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Autentikasi Akun
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Masukkan NPP (Nomor Pokok Petugas) atau Email resmi kedinasan beserta kata sandi Anda.
                </p>
              </div>

              {/* Error Toast */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2.5 shadow-lg">
                  <div className="w-2 h-2 rounded-full bg-rose-400 mt-1 shrink-0 animate-ping" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Pure Credential Form */}
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
                      placeholder="Masukkan NPP atau Email"
                      autoComplete="username"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 transition"
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
                      placeholder="Masukkan kata sandi Anda"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-11 py-3 bg-slate-950/70 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 transition"
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
                      className="w-4 h-4 text-emerald-500 bg-slate-950/80 border-white/20 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-300">Ingat Sesi Saya</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Akses Aman Terenkripsi
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full mt-3 py-3.5 px-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xl shadow-cyan-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
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
              </form>

              {/* Bottom Security Assurance inside card */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Enkripsi Terverifikasi &amp; Akses Berbasis Peran (RBAC)</span>
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
