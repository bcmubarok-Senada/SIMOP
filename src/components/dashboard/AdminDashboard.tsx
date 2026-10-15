import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import {
  Users, UserCheck, Calendar, Clock, CheckCircle2,
  AlertTriangle, GraduationCap, ArrowUpRight, TrendingUp,
  Layers, Award, FileSpreadsheet, Printer, Edit3, ChevronLeft, ChevronRight, Check, History
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { SHIFT_DEFINITIONS, SENADA_CATEGORIES } from '../../utils/constants';

export const AdminDashboard: React.FC = () => {
  const { setCurrentRoute, currentUser, addToast, refreshData } = useAuth();
  const [tlScheduleOffset, setTlScheduleOffset] = useState(0);
  const [editingTlCell, setEditingTlCell] = useState<{
    userId: string;
    userName: string;
    date: string;
    currentShift: string;
  } | null>(null);
  const [selectedShiftForEdit, setSelectedShiftForEdit] = useState<string>('P1');

  const users = storageService.getUsers();
  const teams = storageService.getTeams().filter(t => t.type === 'PETUGAS');
  const schedules = storageService.getSchedules();
  const approvals = storageService.getApprovals();
  const exams = storageService.getExams();
  const submissions = storageService.getExamSubmissions();
  const requirements = storageService.getShiftRequirements();
  const senadaAssignments = storageService.getSenadaAssignments();
  const notifications = storageService.getNotifications();
  const shiftDefinitions = storageService.getShiftDefinitions();

  // Metrics
  const totalUsers = users.length;
  const totalPetugas = users.filter(u => u.role === 'PETUGAS' && u.status === 'Aktif').length;
  const totalTL = users.filter(u => (u.role === 'TL' || u.role.startsWith('TL')) && u.status === 'Aktif').length;
  const totalQA = users.filter(u => u.role === 'QA' && u.status === 'Aktif').length;
  const totalTeams = teams.length;
  const pendingApprovals = approvals.filter(a => a.status === 'Pending').length;
  const activeExams = exams.filter(e => e.status === 'Aktif').length;
  const unreadNotifs = notifications.filter(n => !n.read).length;

  const tlUsers = useMemo(() => {
    return users.filter(u => (u.role === 'TL' || u.role.startsWith('TL')) && u.status === 'Aktif');
  }, [users]);

  // 7-day range for TL schedule display
  const tlDates = useMemo(() => {
    const dates: { dateStr: string; label: string; dayName: string; isToday: boolean }[] = [];
    const base = new Date();
    base.setDate(base.getDate() + tlScheduleOffset);

    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const todayStr = new Date().toISOString().split('T')[0];

      dates.push({
        dateStr,
        label: `${day}/${m}`,
        dayName: dayNames[d.getDay()],
        isToday: dateStr === todayStr,
      });
    }
    return dates;
  }, [tlScheduleOffset]);

  const handleSaveTlSchedule = () => {
    if (!editingTlCell || !currentUser) return;
    storageService.updateScheduleCell(
      editingTlCell.userId,
      editingTlCell.date,
      selectedShiftForEdit,
      'TL',
      currentUser.id
    );
    storageService.addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Ubah Mandiri Jadwal TL',
      module: 'Jadwal TL',
      notes: `Perubahan jadwal TL ${editingTlCell.userName} pada tanggal ${editingTlCell.date} menjadi shift ${selectedShiftForEdit} tanpa approval koordinator`,
    });
    addToast(`Jadwal ${editingTlCell.userName} (${editingTlCell.date}) berhasil diubah menjadi ${selectedShiftForEdit} tanpa approval koordinator.`, 'success');
    setEditingTlCell(null);
    refreshData();
  };

  // Today's date string YYYY-MM-DD
  const today = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Today's schedule calculations
  const todaySchedules = useMemo(() => {
    return schedules.filter(s => s.date === today);
  }, [schedules, today]);

  // Operational shifts comparison: P1, P2, P3, P4, P5
  const shiftComparison = useMemo(() => {
    const coreShifts = ['P1', 'P2', 'P3', 'P4', 'P5'];
    return coreShifts.map(shiftCode => {
      const req = requirements.find(r => r.shiftCode === shiftCode)?.requiredCount || 2;
      // Actual count from active schedules today (including WFA e.g. P1A counts toward P1 if relevant, or exact match)
      const actualCount = todaySchedules.filter(s => s.shiftCode === shiftCode || s.shiftCode === `${shiftCode}A`).length;
      const diff = actualCount - req;
      let status: 'Terpenuhi' | 'Kurang' | 'Lebih' = 'Terpenuhi';
      if (diff < 0) status = 'Kurang';
      else if (diff > 0) status = 'Lebih';

      return {
        shiftCode,
        label: shiftDefinitions[shiftCode]?.name || shiftCode,
        required: req,
        actual: actualCount,
        diff,
        status,
      };
    });
  }, [todaySchedules, requirements]);

  // Senada breakdown for today
  const todaySenada = useMemo(() => {
    const assignments = senadaAssignments.filter(s => s.date === today);
    const pm = assignments.filter(s => s.category === 'PM').length;
    const ip = assignments.filter(s => s.category === 'IP').length;
    const im = assignments.filter(s => s.category === 'IM').length;
    const total = pm + ip + im;
    return { pm, ip, im, total };
  }, [senadaAssignments, today]);

  // Exam stats
  const examStats = useMemo(() => {
    if (submissions.length === 0) {
      return { totalParticipants: 0, avgScore: 0, passRate: 0, maxScore: 0, minScore: 0 };
    }
    const scores = submissions.map(s => s.score);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avgScore = Math.round(sum / scores.length);
    const passed = submissions.filter(s => s.isPassed).length;
    const passRate = Math.round((passed / submissions.length) * 100);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    return {
      totalParticipants: submissions.length,
      avgScore,
      passRate,
      maxScore,
      minScore,
    };
  }, [submissions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-1">
            <span>
              {currentUser?.role === 'MASTER'
                ? '👑 Dashboard Pemilik Sistem (Master Owner)'
                : 'Dashboard Administrator • Koordinator & TL'}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Pusat Kendali Operasional
          </h2>
          <p className="text-xs text-slate-500">
            {currentUser?.role === 'MASTER'
              ? 'Selamat datang Bapak B.C. Mubarok. Kendali penuh sistem operasional dan pantauan riwayat seluruh aktivitas pengguna.'
              : 'Monitoring personil, evaluasi kepatuhan shift, kategori Senada, dan hasil uji pemahaman.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {currentUser?.role === 'MASTER' && (
            <button
              type="button"
              onClick={() => setCurrentRoute('audit')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat Aktivitas User</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setCurrentRoute('schedules')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Kelola Jadwal</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentRoute('reports')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Laporan Excel</span>
          </button>
        </div>
      </div>

      {/* 8 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Total User */}
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total User
            </span>
            <span className="text-2xl font-black text-slate-800 tracking-tight">{totalUsers}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Semua Pengguna</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Total Petugas */}
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Petugas Aktif
            </span>
            <span className="text-2xl font-black text-emerald-600 tracking-tight">{totalPetugas}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Layanan 6 Tim</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Total TL */}
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Team Leader
            </span>
            <span className="text-2xl font-black text-blue-600 tracking-tight">{totalTL}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Admin Operasional</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Total QA */}
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Quality Assur.
            </span>
            <span className="text-2xl font-black text-teal-600 tracking-tight">{totalQA}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Pengawas Mutu</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Total Team */}
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Team
            </span>
            <span className="text-2xl font-black text-slate-800 tracking-tight">{totalTeams}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Team 1 s/d Team 6</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Pengajuan Pending */}
        <div
          onClick={() => setCurrentRoute('approvals')}
          className="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-amber-400 transition"
        >
          <div>
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
              Pending Approval
            </span>
            <span className="text-2xl font-black text-amber-600 tracking-tight">
              {pendingApprovals}
            </span>
            <span className="text-[10px] text-amber-600/90 block mt-0.5 font-medium">
              Cuti / Tukar Jadwal
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Ujian Aktif */}
        <div
          onClick={() => setCurrentRoute('exams')}
          className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between cursor-pointer hover:border-indigo-300 transition"
        >
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Ujian Aktif
            </span>
            <span className="text-2xl font-black text-purple-600 tracking-tight">{activeExams}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Pre &amp; Post-Test</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        {/* Rata-Rata Nilai */}
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Rata-rata Nilai
            </span>
            <span className="text-2xl font-black text-indigo-600 tracking-tight">
              {examStats.avgScore}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Kelulusan {examStats.passRate}%
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Row 2: Operational Dashboard: Kebutuhan vs Aktual & Kategori Senada */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operasional Hari Ini: Sift P1-P5 (Kebutuhan vs Aktual) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Dashboard Operasional — Kebutuhan vs Aktual ({today})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluasi ketersediaan personil per shift operasional hari ini
              </p>
            </div>
            <button
              onClick={() => setCurrentRoute('schedules')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Atur Kebutuhan</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Sift</th>
                  <th className="py-2.5 px-3 text-center">Kebutuhan</th>
                  <th className="py-2.5 px-3 text-center">Aktual</th>
                  <th className="py-2.5 px-3 text-center">Selisih</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Visualisasi Kapasitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shiftComparison.map(shift => {
                  let badge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  if (shift.status === 'Kurang') badge = 'bg-rose-100 text-rose-800 border-rose-300';
                  if (shift.status === 'Lebih') badge = 'bg-blue-100 text-blue-800 border-blue-300';

                  const percentage = shift.required > 0 ? Math.min(Math.round((shift.actual / shift.required) * 100), 150) : 100;

                  return (
                    <tr key={shift.shiftCode} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            {shift.shiftCode}
                          </span>
                          <span>{shift.label}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-700">
                        {shift.required} org
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-900">
                        {shift.actual} org
                      </td>
                      <td className="py-3 px-3 text-center font-semibold">
                        <span
                          className={
                            shift.diff < 0
                              ? 'text-rose-600'
                              : shift.diff > 0
                              ? 'text-blue-600'
                              : 'text-emerald-600'
                          }
                        >
                          {shift.diff > 0 ? `+${shift.diff}` : shift.diff}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge}`}>
                          {shift.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                shift.status === 'Kurang'
                                  ? 'bg-rose-500'
                                  : shift.status === 'Lebih'
                                  ? 'bg-blue-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 w-8 text-right">
                            {percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dashboard Kategori Senada */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>Kategori Senada ({today})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Proporsi layanan harian petugas</p>
              </div>
              <button
                onClick={() => setCurrentRoute('senada')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1"
              >
                <span>Detail</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Custom Proportion Progress Display */}
            <div className="space-y-4 pt-1">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    PM (Permintaan &amp; Info)
                  </span>
                  <span className="font-bold text-slate-800">
                    {todaySenada.pm} Petugas (
                    {todaySenada.total > 0 ? Math.round((todaySenada.pm / todaySenada.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${todaySenada.total > 0 ? (todaySenada.pm / todaySenada.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    IP (Informasi &amp; Pengaduan)
                  </span>
                  <span className="font-bold text-slate-800">
                    {todaySenada.ip} Petugas (
                    {todaySenada.total > 0 ? Math.round((todaySenada.ip / todaySenada.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${todaySenada.total > 0 ? (todaySenada.ip / todaySenada.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    IM (Informasi Permintaan)
                  </span>
                  <span className="font-bold text-slate-800">
                    {todaySenada.im} Petugas (
                    {todaySenada.total > 0 ? Math.round((todaySenada.im / todaySenada.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${todaySenada.total > 0 ? (todaySenada.im / todaySenada.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50/70 p-3 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Total Terploting Senada:</span>
            <span className="font-bold text-slate-800">{todaySenada.total} Penugasan</span>
          </div>
        </div>
      </div>

      {/* Row 2.5: Jadwal Team Leader (TL) - Pengubahan Mandiri Tanpa Approval Koordinator */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                <UserCheck className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-800">
                Jadwal Operasional Team Leader (TL)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Mandiri Tanpa Approval
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Jadwal TL muncul di menu utama dan dapat diubah secara langsung oleh TL sendiri tanpa menunggu persetujuan koordinator. Klik tanggal pada baris TL untuk mengganti shift.
            </p>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setTlScheduleOffset(prev => prev - 7)}
              title="7 Hari Sebelumnya"
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTlScheduleOffset(0)}
              className="px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-white rounded-lg transition shadow-xs"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setTlScheduleOffset(prev => prev + 7)}
              title="7 Hari Berikutnya"
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition shadow-xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TL Schedule Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3 min-w-[180px]">Team Leader</th>
                {tlDates.map(col => (
                  <th
                    key={col.dateStr}
                    className={`py-2 px-2 text-center min-w-[70px] ${
                      col.isToday ? 'bg-indigo-50/80 text-indigo-900 font-bold rounded-t-lg' : ''
                    }`}
                  >
                    <div className="text-[10px] text-slate-400 font-medium">{col.dayName}</div>
                    <div className="text-xs">{col.label}</div>
                  </th>
                ))}
                <th className="py-2.5 px-3 text-center min-w-[100px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tlUsers.map(tl => {
                const isCurrentUser = currentUser?.id === tl.id;
                return (
                  <tr
                    key={tl.id}
                    className={`hover:bg-slate-50/70 transition ${
                      isCurrentUser ? 'bg-indigo-50/30 font-medium' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {tl.avatarUrl ? (
                          <img
                            src={tl.avatarUrl}
                            alt={tl.name}
                            className="w-7 h-7 rounded-full object-cover border border-indigo-200 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                            {tl.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate flex items-center gap-1.5">
                            <span>{tl.name}</span>
                            {isCurrentUser && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-indigo-600 text-white">
                                Anda
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">NPP: {tl.npp}</div>
                        </div>
                      </div>
                    </td>

                    {/* Day Cells */}
                    {tlDates.map(col => {
                      const entry = schedules.find(s => s.userId === tl.id && s.date === col.dateStr);
                      const shiftCode = entry?.shiftCode || 'P1';
                      const meta = shiftDefinitions[shiftCode] || storageService.getShiftMeta(shiftCode);

                      return (
                        <td
                          key={col.dateStr}
                          className={`py-2 px-2 text-center cursor-pointer group ${
                            col.isToday ? 'bg-indigo-50/40' : ''
                          }`}
                          onClick={() => {
                            setEditingTlCell({
                              userId: tl.id,
                              userName: tl.name,
                              date: col.dateStr,
                              currentShift: shiftCode,
                            });
                            setSelectedShiftForEdit(shiftCode);
                          }}
                          title={`Klik untuk ubah jadwal ${tl.name} tanggal ${col.dateStr} (Tanpa Approval)`}
                        >
                          <div
                            className={`inline-flex items-center justify-center min-w-[38px] h-7 px-2 rounded-lg text-xs font-bold border transition group-hover:scale-105 group-hover:shadow-xs ${meta.colorBg} ${meta.colorText} ${meta.colorBorder}`}
                            style={
                              meta.hexBg
                                ? {
                                    backgroundColor: meta.hexBg,
                                    color: meta.hexText || '#0f172a',
                                  }
                                : undefined
                            }
                          >
                            {shiftCode}
                          </div>
                        </td>
                      );
                    })}

                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          const todayDate = new Date().toISOString().split('T')[0];
                          const todayEntry = schedules.find(s => s.userId === tl.id && s.date === todayDate);
                          setEditingTlCell({
                            userId: tl.id,
                            userName: tl.name,
                            date: todayDate,
                            currentShift: todayEntry?.shiftCode || 'P1',
                          });
                          setSelectedShiftForEdit(todayEntry?.shiftCode || 'P1');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-semibold rounded-lg transition"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Ubah Shift</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {tlUsers.length === 0 && (
                <tr>
                  <td colSpan={tlDates.length + 2} className="py-6 text-center text-slate-400">
                    Belum ada data Team Leader aktif.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Keterangan: Perubahan jadwal TL langsung berlaku seketika di sistem tanpa antrean approval.</span>
          </div>
          <button
            type="button"
            onClick={() => setCurrentRoute('schedules')}
            className="font-bold text-indigo-600 hover:text-indigo-800"
          >
            Lihat Manajemen Jadwal Lengkap &rarr;
          </button>
        </div>
      </div>

      {/* Modal Quick Edit Shift TL Tanpa Approval */}
      {editingTlCell && (
        <Modal
          isOpen={!!editingTlCell}
          onClose={() => setEditingTlCell(null)}
          title="Ubah Jadwal Team Leader Mandiri"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-500">Team Leader</span>
                  <h4 className="font-bold text-slate-800 text-sm">{editingTlCell.userName}</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-indigo-500">Tanggal</span>
                  <div className="font-bold text-slate-800 text-sm">{editingTlCell.date}</div>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-emerald-700 font-medium flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Perubahan ini langsung berlaku tanpa memerlukan approval koordinator.</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-2">
                Pilih Sift Operasional / Status:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.values(shiftDefinitions).map(shift => {
                  const isSelected = selectedShiftForEdit === shift.code;
                  return (
                    <button
                      key={shift.code}
                      type="button"
                      onClick={() => setSelectedShiftForEdit(shift.code)}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      style={
                        shift.hexBg
                          ? {
                              backgroundColor: `${shift.hexBg}25`,
                            }
                          : undefined
                      }
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-black"
                          style={{
                            backgroundColor: shift.hexBg || '#e2e8f0',
                            color: shift.hexText || '#0f172a',
                          }}
                        >
                          {shift.code}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600 font-bold" />}
                      </div>
                      <span className="text-[11px] font-medium text-slate-700 leading-tight">
                        {shift.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTlCell(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveTlSchedule}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition"
              >
                Simpan Jadwal (Langsung Aktif)
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Row 3: Assessment Summary & Pending Approvals List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals quick table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Permohonan Menunggu Approval</h3>
              <p className="text-xs text-slate-500">Persetujuan cuti, izin, sakit, dan tukar jadwal</p>
            </div>
            <button
              onClick={() => setCurrentRoute('approvals')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Lihat Semua ({approvals.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {approvals.filter(a => a.status === 'Pending').slice(0, 3).map(appr => (
              <div
                key={appr.id}
                className="p-3.5 rounded-xl border border-amber-200/70 bg-amber-50/30 flex items-center justify-between"
              >
                <div className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{appr.userName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      {appr.type}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1 leading-snug">
                    {appr.type === 'Tukar Jadwal'
                      ? `Tukar dengan ${appr.swapWithUserName} pada tanggal ${appr.swapDate}`
                      : `Tanggal: ${appr.startDate} s/d ${appr.endDate} — "${appr.reason}"`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentRoute('approvals')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shrink-0 ml-3 transition"
                >
                  Proses
                </button>
              </div>
            ))}
            {approvals.filter(a => a.status === 'Pending').length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                Tidak ada pengajuan yang membutuhkan persetujuan saat ini.
              </div>
            )}
          </div>
        </div>

        {/* Uji Pemahaman Evaluation Overview */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Statistik Uji Pemahaman</h3>
                <p className="text-xs text-slate-500">Evaluasi Pre-Test dan Post-Test Petugas/QA</p>
              </div>
              <button
                onClick={() => setCurrentRoute('exams')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Kelola Ujian
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center my-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Peserta</span>
                <span className="text-lg font-black text-slate-800">{examStats.totalParticipants}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Tertinggi</span>
                <span className="text-lg font-black text-emerald-700">{examStats.maxScore}</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                <span className="text-[10px] font-bold text-rose-700 uppercase block">Terendah</span>
                <span className="text-lg font-black text-rose-700">{examStats.minScore}</span>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                <span className="text-[10px] font-bold text-indigo-700 uppercase block">Kelulusan</span>
                <span className="text-lg font-black text-indigo-700">{examStats.passRate}%</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Passing Grade Rata-rata: <strong>75</strong></span>
            <button
              onClick={() => setCurrentRoute('leaderboard')}
              className="font-bold text-indigo-600 hover:text-indigo-800"
            >
              Buka Leaderboard &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
