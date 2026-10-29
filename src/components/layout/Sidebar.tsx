import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isAdminRole } from '../../utils/constants';
import {
  LayoutDashboard, Users, Calendar, CheckSquare,
  Layers, GraduationCap, FileBarChart, History,
  Settings, X, ShieldAlert, BookOpen, Clock, Award,
  Presentation, Crown, Lock
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { SimopLogo } from '../ui/SimopLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, currentRoute, setCurrentRoute } = useAuth();

  const isAdmin = currentUser ? isAdminRole(currentUser.role) : false;
  const isPublic = !currentUser;

  // Pending approval count (targeted to current TL or all for Koordinator)
  const pendingApprovals = useMemo(() => {
    const list = storageService.getApprovals().filter(a => a.status === 'Pending');
    if (!currentUser) return list.length;
    if (currentUser.role === 'KOORDINATOR') return list.length;
    if (currentUser.role.startsWith('TL') || currentUser.role === 'TL') {
      return list.filter(
        a =>
          a.targetTlRole === currentUser.role ||
          a.targetTlUserId === currentUser.id ||
          (!a.targetTlRole && a.teamId === currentUser.teamId)
      ).length;
    }
    return list.filter(a => a.userId === currentUser.id).length;
  }, [currentUser]);

  // Active exams count
  const activeExams = storageService.getExams().filter(e => e.status === 'Aktif').length;

  const handleNav = (route: string) => {
    setCurrentRoute(route);
    onClose();
  };

  const navItemClass = (route: string) => {
    const isActive = currentRoute === route;
    return `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition select-none group ${
      isActive
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:scale-[0.99]'
    }`;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <SimopLogo size="sm" variant="mark-only" className="w-8 h-8 shrink-0 drop-shadow-xs" />
            <div className="leading-tight">
              <span className="text-sm font-black text-slate-900 tracking-tight block">
                SIMOP TERPADU
              </span>
              <span className="text-[10px] text-indigo-600 font-bold block tracking-wide">
                {!currentUser
                  ? 'PORTAL PUBLIK'
                  : currentUser.role === 'MASTER'
                  ? '👑 PEMILIK SISTEM (MASTER)'
                  : currentUser.role === 'KOORDINATOR'
                  ? 'KOORDINATOR'
                  : currentUser.role.startsWith('TL') || currentUser.role === 'TL'
                  ? `TEAM LEADER (${currentUser.role})`
                  : currentUser.role}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Tutup Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items (Sleek minimalist scrollbar) */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5 [scrollbar-width:thin]">
          {/* Main Group */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Menu Operasional
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleNav('dashboard')}
                className={navItemClass('dashboard')}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span className="truncate">Dashboard</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNav('schedules')}
                className={navItemClass('schedules')}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span className="truncate">Jadwal Dinas (1-31)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNav('approvals')}
                className={navItemClass('approvals')}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckSquare className="w-4 h-4 shrink-0" />
                  <span className="truncate">{isAdmin ? 'Persetujuan (Approval)' : 'Pengajuan Tukar & Cuti'}</span>
                </div>
                {pendingApprovals > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full shrink-0 min-w-[20px] text-center ${
                      currentRoute === 'approvals'
                        ? 'bg-white text-indigo-700'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {pendingApprovals}
                  </span>
                )}
              </button>

              {/* Kategori Senada */}
              <button
                type="button"
                onClick={() => handleNav('senada')}
                className={navItemClass('senada')}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Layers className="w-4 h-4 shrink-0" />
                  <span className="truncate">Kategori Senada</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 tracking-wide ${
                    currentRoute === 'senada'
                      ? 'bg-white/20 text-white'
                      : 'bg-teal-50 text-teal-700 border border-teal-200/70'
                  }`}
                >
                  PM/IP/IM
                </span>
              </button>
            </div>
          </div>

          {/* Assessment & Exams */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Uji Pemahaman &amp; Mutu
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleNav('exams')}
                className={navItemClass('exams')}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  <span className="truncate">{isAdmin ? 'Kelola Ujian' : 'Uji Pemahaman'}</span>
                </div>
                {activeExams > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full shrink-0 min-w-[20px] text-center ${
                      currentRoute === 'exams'
                        ? 'bg-white text-indigo-700'
                        : 'bg-indigo-500 text-white'
                    }`}
                  >
                    {activeExams}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleNav('leaderboard')}
                className={navItemClass('leaderboard')}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Award className="w-4 h-4 shrink-0" />
                  <span className="truncate">Papan Peringkat (Leaderboard)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNav('online-class')}
                className={navItemClass('online-class')}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Presentation className="w-4 h-4 shrink-0" />
                  <span className="truncate">Kelas Online &amp; Diskusi</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 tracking-wide ${
                    currentRoute === 'online-class'
                      ? 'bg-white/20 text-white'
                      : 'bg-purple-50 text-purple-700 border border-purple-200/70'
                  }`}
                >
                  PDF/PPT
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleNav('reports')}
                className={navItemClass('reports')}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileBarChart className="w-4 h-4 shrink-0" />
                  <span className="truncate">Laporan &amp; Rekapitulasi</span>
                </div>
              </button>
            </div>
          </div>

          {/* Administrator Section */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Administrasi &amp; Sistem</span>
              {isPublic && (
                <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold tracking-tight shrink-0">
                  KHUSUS ADMIN
                </span>
              )}
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleNav('users')}
                className={navItemClass('users')}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Users className="w-4 h-4 shrink-0" />
                  <span className="truncate">Manajemen User Admin</span>
                </div>
                {isPublic && (
                  <Lock
                    className={`w-3.5 h-3.5 shrink-0 ${
                      currentRoute === 'users' ? 'text-white/80' : 'text-slate-400'
                    }`}
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleNav('bank-soal')}
                className={navItemClass('bank-soal')}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span className="truncate">Bank Soal (PG/Essay)</span>
                </div>
                {isPublic && (
                  <Lock
                    className={`w-3.5 h-3.5 shrink-0 ${
                      currentRoute === 'bank-soal' ? 'text-white/80' : 'text-slate-400'
                    }`}
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleNav('audit')}
                className={navItemClass('audit')}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <History className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {currentUser?.role === 'MASTER' ? 'Riwayat Aktivitas User' : 'Audit Log'}
                  </span>
                </div>
                {currentUser?.role === 'MASTER' ? (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500 text-white rounded-full flex items-center gap-0.5 shrink-0">
                    <Crown className="w-2.5 h-2.5" />
                    <span>Master</span>
                  </span>
                ) : isPublic ? (
                  <Lock
                    className={`w-3.5 h-3.5 shrink-0 ${
                      currentRoute === 'audit' ? 'text-white/80' : 'text-slate-400'
                    }`}
                  />
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => handleNav('settings')}
                className={navItemClass('settings')}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Settings className="w-4 h-4 shrink-0" />
                  <span className="truncate">Pengaturan Sistem</span>
                </div>
                {isPublic && (
                  <Lock
                    className={`w-3.5 h-3.5 shrink-0 ${
                      currentRoute === 'settings' ? 'text-white/80' : 'text-slate-400'
                    }`}
                  />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* User Footer Summary or Public Mode Indicator */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/70 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.role.charAt(0)}
              </div>
              <div className="truncate flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-800 block truncate">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {currentUser.npp} &bull; {currentUser.teamId}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>Mode Publik Aktif</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Akses semua jadwal &amp; materi terbuka
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
