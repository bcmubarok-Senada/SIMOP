import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Calendar, CheckSquare,
  Layers, GraduationCap, FileBarChart, History,
  Settings, Award, BookOpen, Sparkles, Loader2
} from 'lucide-react';

interface RouteTransitionProps {
  currentRoute: string;
  children: React.ReactNode;
}

const ROUTE_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  dashboard: { label: 'Dashboard Operasional', icon: LayoutDashboard },
  users: { label: 'Manajemen Petugas & Tim', icon: Users },
  schedules: { label: 'Roster & Jadwal Dinas', icon: Calendar },
  approvals: { label: 'Persetujuan & Perizinan', icon: CheckSquare },
  senada: { label: 'Penugasan Kategori Senada', icon: Layers },
  exams: { label: 'Ujian Kompetensi', icon: GraduationCap },
  'bank-soal': { label: 'Bank Soal Kedinasan', icon: BookOpen },
  leaderboard: { label: 'Peringkat & Prestasi', icon: Award },
  'online-class': { label: 'Kelas Online & Diskusi', icon: BookOpen },
  reports: { label: 'Rekapitulasi & Laporan', icon: FileBarChart },
  audit: { label: 'Jejak Audit Sistem', icon: History },
  settings: { label: 'Pengaturan & Konfigurasi', icon: Settings },
};

export const RouteTransition: React.FC<RouteTransitionProps> = ({ currentRoute, children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedRoute, setDisplayedRoute] = useState(currentRoute);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (currentRoute !== displayedRoute) {
      setIsTransitioning(true);
      setProgress(25);

      const p1 = setTimeout(() => setProgress(70), 80);
      const p2 = setTimeout(() => {
        setProgress(100);
        setDisplayedRoute(currentRoute);
      }, 180);
      const p3 = setTimeout(() => {
        setIsTransitioning(false);
        setProgress(0);
      }, 280);

      return () => {
        clearTimeout(p1);
        clearTimeout(p2);
        clearTimeout(p3);
      };
    }
  }, [currentRoute, displayedRoute]);

  const routeMeta = ROUTE_LABELS[currentRoute] || { label: 'Memuat Fitur...', icon: Sparkles };
  const RouteIcon = routeMeta.icon;

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Top Floating Progress Bar (YouTube/GitHub-style) */}
      {isTransitioning && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-200/40 overflow-hidden pointer-events-none">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 transition-all duration-150 ease-out shadow-sm shadow-indigo-500/50"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Dynamic Floating Micro-Loader Pill */}
      {isTransitioning && (
        <div className="fixed top-20 right-6 z-40 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 text-white border border-slate-700/80 shadow-xl backdrop-blur-md text-xs font-semibold">
            <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <RouteIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Memuat {routeMeta.label}...</span>
          </div>
        </div>
      )}

      {/* Main Content with smooth animated entrance */}
      <div
        key={displayedRoute}
        className={`transition-all duration-200 ${
          isTransitioning
            ? 'opacity-40 scale-[0.995] blur-[0.5px]'
            : 'opacity-100 scale-100 blur-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
};
