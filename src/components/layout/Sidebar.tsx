import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isAdminRole } from '../../utils/constants';
import {
  LayoutDashboard, Users, Calendar, CheckSquare,
  Layers, GraduationCap, FileBarChart, History,
  Settings, X, ShieldAlert, BookOpen, Clock, Award,
  Presentation, Crown
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { SimopLogo } from '../ui/SimopLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, currentRoute, setCurrentRoute } = useAuth();

  if (!currentUser) return null;

  const isAdmin = isAdminRole(currentUser.role);
  const isPetugas = currentUser.role === 'PETUGAS';

  // Pending approval count (targeted to current TL or all for Koordinator)
  const pendingApprovals = useMemo(() => {
    const list = storageService.getApprovals().filter(a => a.status === 'Pending');
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
    return `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer group ${
      isActive
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
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
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SimopLogo size="sm" variant="mark-only" className="w-8 h-8 shrink-0 drop-shadow-xs" />
            <div>
              <span className="text-sm font-black text-slate-900 tracking-tight block">
                SIMOP TERPADU
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold block">
                {currentUser.role === 'MASTER'
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
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {/* Main Group */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Menu Utama
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleNav('dashboard')}
                className={navItemClass('dashboard')}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </div>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleNav('users')}
                  className={navItemClass('users')}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4" />
                    <span>Manajemen User</span>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleNav('schedules')}
                className={navItemClass('schedules')}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4" />
                  <span>{isAdmin ? 'Semua Jadwal' : 'Melihat Jadwal'}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNav('approvals')}
                className={navItemClass('approvals')}
              >
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="w-4 h-4" />
                  <span>{isAdmin ? 'Persetujuan (Approval)' : 'Pengajuan Saya'}</span>
                </div>
                {isAdmin && pendingApprovals > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                    {pendingApprovals}
                  </span>
                )}
              </button>

              {/* Kategori Senada (Admin can view/manage, Petugas can view, QA hidden per spec) */}
              {(isAdmin || isPetugas) && (
                <button
                  type="button"
                  onClick={() => handleNav('senada')}
                  className={navItemClass('senada')}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4" />
                    <span>Kategori Senada</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 bg-teal-100 text-teal-800 rounded font-semibold">
                    PM/IP/IM
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Assessment & Exams */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Uji Pemahaman
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleNav('exams')}
                className={navItemClass('exams')}
              >
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-4 h-4" />
                  <span>{isAdmin ? 'Kelola Ujian' : 'Uji Pemahaman'}</span>
                </div>
                {activeExams > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500 text-white rounded-full">
                    {activeExams}
                  </span>
                )}
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleNav('bank-soal')}
                  className={navItemClass('bank-soal')}
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4" />
                    <span>Bank Soal (PG/Essay)</span>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleNav('leaderboard')}
                className={navItemClass('leaderboard')}
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4" />
                  <span>Leaderboard</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNav('online-class')}
                className={navItemClass('online-class')}
              >
                <div className="flex items-center gap-2.5">
                  <Presentation className="w-4 h-4" />
                  <span>Kelas Online</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded font-semibold">
                  PDF/PPT
                </span>
              </button>
            </div>
          </div>

          {/* Reports & System (Admin only or General) */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Laporan &amp; Pengaturan
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleNav('reports')}
                className={navItemClass('reports')}
              >
                <div className="flex items-center gap-2.5">
                  <FileBarChart className="w-4 h-4" />
                  <span>Laporan &amp; Rekap</span>
                </div>
              </button>

              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => handleNav('audit')}
                    className={navItemClass('audit')}
                  >
                    <div className="flex items-center gap-2.5">
                      <History className="w-4 h-4" />
                      <span>{currentUser.role === 'MASTER' ? 'Riwayat Aktivitas User' : 'Audit Log'}</span>
                    </div>
                    {currentUser.role === 'MASTER' && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500 text-white rounded-full flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5" />
                        <span>Master</span>
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav('settings')}
                    className={navItemClass('settings')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings className="w-4 h-4" />
                      <span>Pengaturan Sistem</span>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* User Footer Summary */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/10 text-indigo-700 flex items-center justify-center font-bold text-xs">
              {currentUser.role.charAt(0)}
            </div>
            <div className="truncate flex-1">
              <span className="text-xs font-bold text-slate-800 block truncate">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {currentUser.npp} &bull; {currentUser.teamId}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
