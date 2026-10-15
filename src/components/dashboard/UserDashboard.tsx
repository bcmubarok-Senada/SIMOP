import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { MONTH_NAMES_ID, DAY_NAMES_ID } from '../../utils/constants';
import {
  Calendar, Clock, CheckSquare, GraduationCap,
  Award, Bell, ArrowRight, ShieldCheck, Layers, FileText,
  ChevronLeft, ChevronRight, Search, Users, Sparkles, Filter,
  Info, ExternalLink
} from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { currentUser, setCurrentRoute, notifications } = useAuth();

  // State for Overall Schedule month navigation
  const [scheduleDate, setScheduleDate] = useState(() => new Date());
  const schedYear = scheduleDate.getFullYear();
  const schedMonth = scheduleDate.getMonth(); // 0-indexed

  // Filters for Overall Schedule
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scheduleViewTab, setScheduleViewTab] = useState<'GRID' | 'TODAY_ROSTER'>('GRID');
  const [showShiftLegend, setShowShiftLegend] = useState(false);

  if (!currentUser) return null;

  const isPetugas = currentUser.role === 'PETUGAS';

  const allUsers = storageService.getUsers();
  const schedules = storageService.getSchedules();
  const approvals = storageService.getApprovals();
  const exams = storageService.getExams();
  const submissions = storageService.getExamSubmissions();
  const senadaAssignments = storageService.getSenadaAssignments();
  const shiftDefinitions = storageService.getShiftDefinitions();

  // Date calculation
  const today = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const tomorrow = useMemo(() => {
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    const y = tm.getFullYear();
    const m = String(tm.getMonth() + 1).padStart(2, '0');
    const d = String(tm.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Today's schedule for current user
  const todaySchedule = useMemo(() => {
    return schedules.find(s => s.userId === currentUser.id && s.date === today);
  }, [schedules, currentUser.id, today]);

  // Tomorrow's schedule for current user
  const tomorrowSchedule = useMemo(() => {
    return schedules.find(s => s.userId === currentUser.id && s.date === tomorrow);
  }, [schedules, currentUser.id, tomorrow]);

  // Senada assignment today (for Petugas)
  const todaySenada = useMemo(() => {
    if (!isPetugas) return null;
    return senadaAssignments.find(s => s.userId === currentUser.id && s.date === today);
  }, [isPetugas, senadaAssignments, currentUser.id, today]);

  // User's approvals
  const myApprovals = useMemo(() => {
    return approvals.filter(a => a.userId === currentUser.id);
  }, [approvals, currentUser.id]);

  // User's submissions
  const mySubmissions = useMemo(() => {
    return submissions.filter(s => s.userId === currentUser.id);
  }, [submissions, currentUser.id]);

  // Available active exams (that user hasn't submitted up to max attempts)
  const availableExams = useMemo(() => {
    return exams.filter(e => {
      if (e.status !== 'Aktif') return false;
      const userAttempts = mySubmissions.filter(s => s.examId === e.id).length;
      return userAttempts < e.maxAttempts;
    });
  }, [exams, mySubmissions]);

  const todayShiftMeta = todaySchedule
    ? (shiftDefinitions[todaySchedule.shiftCode] || storageService.getShiftMeta(todaySchedule.shiftCode))
    : null;

  const tomorrowShiftMeta = tomorrowSchedule
    ? (shiftDefinitions[tomorrowSchedule.shiftCode] || storageService.getShiftMeta(tomorrowSchedule.shiftCode))
    : null;

  // OVERALL SCHEDULE DATA COMPUTATION
  // Total days in currently selected month
  const daysInMonth = useMemo(() => {
    return new Date(schedYear, schedMonth + 1, 0).getDate();
  }, [schedYear, schedMonth]);

  const daysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  // All PETUGAS staff users
  const petugasUsers = useMemo(() => {
    return allUsers.filter(u => u.role === 'PETUGAS' && u.status === 'Aktif');
  }, [allUsers]);

  // Filtered petugas based on team and search input
  const filteredPetugas = useMemo(() => {
    return petugasUsers.filter(u => {
      const matchTeam =
        selectedTeam === 'ALL'
          ? true
          : selectedTeam === 'MY_TEAM'
          ? u.teamId === currentUser.teamId
          : u.teamId === selectedTeam;

      const matchSearch =
        searchQuery === '' ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.npp.toLowerCase().includes(searchQuery.toLowerCase());

      return matchTeam && matchSearch;
    });
  }, [petugasUsers, selectedTeam, currentUser.teamId, searchQuery]);

  // Helper date string for a specific day in selected month
  const getDateStr = (day: number) => {
    return `${schedYear}-${String(schedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Helper to fetch shift for user and day
  const getUserDayShift = (userId: string, day: number): string => {
    const dStr = getDateStr(day);
    const entry = schedules.find(s => s.userId === userId && s.date === dStr);
    return entry ? entry.shiftCode : 'X';
  };

  // Roster grouped by shift for today
  const todayDutyGroups = useMemo(() => {
    const groups: Record<string, { shiftMeta: any; users: typeof allUsers }> = {};

    petugasUsers.forEach(u => {
      const sEntry = schedules.find(s => s.userId === u.id && s.date === today);
      const code = sEntry ? sEntry.shiftCode : 'X';
      const meta = shiftDefinitions[code] || storageService.getShiftMeta(code);

      if (!groups[code]) {
        groups[code] = {
          shiftMeta: meta,
          users: [],
        };
      }
      groups[code].users.push(u);
    });

    return groups;
  }, [petugasUsers, schedules, today, shiftDefinitions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Greeting Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 text-xs font-medium mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
              <span>Portal Mandiri {currentUser.role} &bull; {currentUser.teamId}</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Halo, {currentUser.name}!
            </h2>
            <p className="text-xs text-indigo-200 mt-1 max-w-xl">
              Pantau jadwal dinas harian dan keseluruhan tim petugas, ajukan cuti atau tukar jadwal, dan ikuti uji pemahaman berkala untuk peningkatan kompetensi layanan Anda.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setCurrentRoute('approvals')}
              className="px-4 py-2 bg-white text-indigo-900 rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-50 transition"
            >
              Ajukan Permohonan
            </button>
            <button
              onClick={() => setCurrentRoute('schedules')}
              className="px-4 py-2 bg-indigo-700/60 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold border border-indigo-500/30 transition flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Kalender Lengkap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 1: Jadwal Hari Ini, Jadwal Besok, Kategori Senada */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Jadwal Hari Ini */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-indigo-600">
                <Calendar className="w-4 h-4" />
                <span>Jadwal Hari Ini</span>
              </span>
              <span className="text-slate-500 font-normal">{today}</span>
            </div>

            <div className="mt-2">
              <div className="flex items-center gap-3">
                <span
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border shadow-xs"
                  style={{
                    backgroundColor: todayShiftMeta?.hexBg || undefined,
                    color: todayShiftMeta?.hexText || undefined,
                  }}
                >
                  {todaySchedule ? todaySchedule.shiftCode : 'X'}
                </span>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">
                    {todayShiftMeta?.name || 'Libur / Lepas Piket'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kategori: {todayShiftMeta?.category || 'Status'}
                    {todayShiftMeta?.startTime && ` (${todayShiftMeta.startTime} - ${todayShiftMeta.endTime})`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Status Kehadiran:</span>
            <span className="font-bold text-emerald-600">Tercatat di Sistem</span>
          </div>
        </div>

        {/* Jadwal Berikutnya (Besok) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-blue-600">
                <Clock className="w-4 h-4" />
                <span>Jadwal Berikutnya</span>
              </span>
              <span className="text-slate-500 font-normal">{tomorrow}</span>
            </div>

            <div className="mt-2">
              <div className="flex items-center gap-3">
                <span
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border shadow-xs"
                  style={{
                    backgroundColor: tomorrowShiftMeta?.hexBg || undefined,
                    color: tomorrowShiftMeta?.hexText || undefined,
                  }}
                >
                  {tomorrowSchedule ? tomorrowSchedule.shiftCode : 'X'}
                </span>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">
                    {tomorrowShiftMeta?.name || 'Libur / Lepas Piket'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kategori: {tomorrowShiftMeta?.category || 'Status'}
                    {tomorrowShiftMeta?.startTime && ` (${tomorrowShiftMeta.startTime} - ${tomorrowShiftMeta.endTime})`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={() => setCurrentRoute('schedules')}
              className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
            >
              <span>Semua Jadwal Bulan Ini</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Kategori Senada Hari Ini (Untuk Petugas) or QA */}
        {isPetugas ? (
          <div className="p-5 rounded-2xl bg-white border border-teal-100 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 text-xs font-semibold text-teal-600 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>Kategori Senada Hari Ini</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  Khusus Petugas
                </span>
              </div>

              {todaySenada ? (
                <div className="mt-2">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-xl bg-teal-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
                      {todaySenada.category}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {todaySenada.category === 'PM'
                          ? 'Permintaan dan Informasi'
                          : todaySenada.category === 'IP'
                          ? 'Informasi dan Pengaduan'
                          : 'Informasi Permintaan'}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Terintegrasi dengan jadwal aktif shift {todaySchedule?.shiftCode || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-xs text-center">
                  Tidak ada penugasan Senada hari ini (Shift Libur/Non-Pelayanan)
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => setCurrentRoute('senada')}
                className="text-teal-700 font-bold hover:underline flex items-center gap-1"
              >
                <span>Lihat Dashboard Senada</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-teal-600">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Status Quality Assurance</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                Sebagai QA, Anda memantau kepatuhan operasional layanan petugas dan mengevaluasi hasil uji pemahaman secara berkala.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Status Monitoring: <strong>Aktif</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* JADWAL KESELURUHAN PETUGAS (ROSTER MASTER OPERASIONAL) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Jadwal Keseluruhan Petugas
                </h3>
                <p className="text-xs text-slate-500">
                  Roster terpadu seluruh personil dinas operasional (Tim 1 s/d Tim 6). Baris jadwal Anda ditandai secara khusus.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tab: Matriks Bulanan vs Piket Hari Ini */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setScheduleViewTab('GRID')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  scheduleViewTab === 'GRID'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Matriks Roster Bulanan
              </button>
              <button
                type="button"
                onClick={() => setScheduleViewTab('TODAY_ROSTER')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  scheduleViewTab === 'TODAY_ROSTER'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Piket Dinas Hari Ini
              </button>
            </div>

            {/* Month & Year Navigator */}
            <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
              <button
                type="button"
                onClick={() => setScheduleDate(new Date(schedYear, schedMonth - 1, 1))}
                className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200 transition"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-800 px-1 min-w-[110px] text-center">
                {MONTH_NAMES_ID[schedMonth]} {schedYear}
              </span>
              <button
                type="button"
                onClick={() => setScheduleDate(new Date(schedYear, schedMonth + 1, 1))}
                className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200 transition"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setScheduleDate(new Date())}
                className="text-[10px] font-bold text-indigo-600 hover:underline px-1 border-l border-slate-200 ml-1"
              >
                Hari Ini
              </button>
            </div>

            {/* Jump to standalone Schedule Page */}
            <button
              type="button"
              onClick={() => setCurrentRoute('schedules')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition"
              title="Buka halaman kalender penuh"
            >
              <span>Kalender Lengkap</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter Bar: Team Filter & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
          {/* Team filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Tim:</span>
            </span>

            <button
              onClick={() => setSelectedTeam('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                selectedTeam === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semua Tim
            </button>

            <button
              onClick={() => setSelectedTeam('MY_TEAM')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                selectedTeam === 'MY_TEAM'
                  ? 'bg-amber-500 text-white shadow-2xs font-bold'
                  : 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
              }`}
            >
              ★ Tim Saya ({currentUser.teamId})
            </button>

            {['team-1', 'team-2', 'team-3', 'team-4', 'team-5', 'team-6'].map((tId, idx) => (
              <button
                key={tId}
                onClick={() => setSelectedTeam(tId)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                  selectedTeam === tId
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Tim {idx + 1}
              </button>
            ))}
          </div>

          {/* Search Personil */}
          <div className="relative shrink-0 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama / NPP petugas..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* VIEW 1: MATRIKS ROSTER BULANAN */}
        {scheduleViewTab === 'GRID' && (
          <div className="space-y-3">
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-xs border-collapse">
                  {/* Sticky Header */}
                  <thead className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-xs">
                    <tr>
                      <th className="sticky left-0 z-30 bg-slate-100 p-2.5 min-w-[200px] text-left font-bold text-slate-700 border-r border-slate-200">
                        Petugas / Personil
                      </th>
                      {daysArray.map(day => {
                        const dayDate = new Date(schedYear, schedMonth, day);
                        const dayOfWeek = dayDate.getDay();
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        const isCurrentDay =
                          day === new Date().getDate() &&
                          schedMonth === new Date().getMonth() &&
                          schedYear === new Date().getFullYear();

                        return (
                          <th
                            key={day}
                            className={`p-1.5 text-center min-w-[34px] border-r border-slate-200 font-bold ${
                              isCurrentDay
                                ? 'bg-indigo-600 text-white ring-2 ring-indigo-600 ring-offset-0 z-10'
                                : isWeekend
                                ? 'bg-rose-50 text-rose-700'
                                : 'text-slate-700'
                            }`}
                          >
                            <div className="text-[10px] opacity-75 uppercase">
                              {DAY_NAMES_ID[dayOfWeek]}
                            </div>
                            <div className="text-xs font-black">{day}</div>
                            {isCurrentDay && (
                              <div className="text-[8px] tracking-tighter leading-none mt-0.5 font-extrabold uppercase bg-amber-400 text-slate-900 rounded px-0.5">
                                HARI INI
                              </div>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  {/* Body: Petugas Rows */}
                  <tbody>
                    {filteredPetugas.map(petugas => {
                      const isSelf = petugas.id === currentUser.id;

                      return (
                        <tr
                          key={petugas.id}
                          className={`border-b border-slate-100 transition-colors ${
                            isSelf
                              ? 'bg-amber-50/80 font-bold border-amber-200 hover:bg-amber-100/70'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* Sticky Employee Identity Column */}
                          <td
                            className={`sticky left-0 z-10 p-2.5 border-r border-slate-200 min-w-[200px] ${
                              isSelf ? 'bg-amber-50/90 shadow-2xs' : 'bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <div className="truncate">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 truncate">
                                    {petugas.name}
                                  </span>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500 text-white shrink-0 uppercase tracking-tight">
                                      Jadwal Anda
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  {petugas.npp} &bull; {petugas.teamId}
                                </div>
                              </div>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                                {petugas.teamId.replace('team-', 'T')}
                              </span>
                            </div>
                          </td>

                          {/* Day Shift Cells */}
                          {daysArray.map(day => {
                            const shiftCode = getUserDayShift(petugas.id, day);
                            const meta =
                              shiftDefinitions[shiftCode] ||
                              storageService.getShiftMeta(shiftCode);
                            const dayDate = new Date(schedYear, schedMonth, day);
                            const dayOfWeek = dayDate.getDay();
                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                            const isCurrentDay =
                              day === new Date().getDate() &&
                              schedMonth === new Date().getMonth() &&
                              schedYear === new Date().getFullYear();

                            return (
                              <td
                                key={day}
                                className={`p-1 text-center border-r border-slate-100 align-middle ${
                                  isCurrentDay
                                    ? 'bg-indigo-50/60 font-black'
                                    : isWeekend
                                    ? 'bg-rose-50/30'
                                    : ''
                                }`}
                              >
                                <span
                                  className="inline-flex items-center justify-center w-7 h-6 rounded-md text-[11px] font-black border shadow-2xs transition-transform hover:scale-110 cursor-default"
                                  style={{
                                    backgroundColor: meta.hexBg || undefined,
                                    color: meta.hexText || undefined,
                                    borderColor: meta.hexBg ? `${meta.hexBg}99` : undefined,
                                  }}
                                  title={`${petugas.name} - ${getDateStr(day)}: [${shiftCode}] ${meta.name}`}
                                >
                                  {shiftCode}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                    {filteredPetugas.length === 0 && (
                      <tr>
                        <td
                          colSpan={daysInMonth + 1}
                          className="py-10 text-center text-slate-400 text-xs"
                        >
                          Tidak ada personil yang sesuai dengan kriteria pencarian atau filter tim.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Helper Note */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>
                  Baris dengan penanda <strong className="text-amber-800">Jadwal Anda</strong> adalah jadwal dinas pribadi Anda. Gunakan kolom tanggal bertanda <strong className="text-indigo-600">HARI INI</strong> untuk melihat rekan dinas satu shift hari ini.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowShiftLegend(!showShiftLegend)}
                className="text-indigo-600 font-bold hover:underline shrink-0 text-left"
              >
                {showShiftLegend ? 'Tutup Keterangan Kode Shift ▲' : 'Lihat Keterangan Kode Shift ▼'}
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: PIKET DINAS HARI INI */}
        {scheduleViewTab === 'TODAY_ROSTER' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-600 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>
                  Daftar rekan personil yang bertugas hari ini (<strong className="text-slate-800">{today}</strong>), dikelompokkan berdasarkan shift kerja:
                </span>
              </span>
              <span className="text-xs font-bold text-indigo-700">
                Total {petugasUsers.length} Petugas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {Object.entries(todayDutyGroups).map(([code, group]) => {
                const isMyShiftToday = todaySchedule?.shiftCode === code;

                return (
                  <div
                    key={code}
                    className={`p-4 rounded-xl border transition-all ${
                      isMyShiftToday
                        ? 'border-amber-400 bg-amber-50/40 shadow-xs ring-1 ring-amber-300'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-10 h-7 rounded-lg flex items-center justify-center font-black text-xs border shadow-2xs"
                          style={{
                            backgroundColor: group.shiftMeta.hexBg || undefined,
                            color: group.shiftMeta.hexText || undefined,
                          }}
                        >
                          {code}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs">
                            {group.shiftMeta.name}
                          </h4>
                          {group.shiftMeta.startTime && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              {group.shiftMeta.startTime} - {group.shiftMeta.endTime}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {group.users.length} Orang
                        </span>
                        {isMyShiftToday && (
                          <span className="block text-[9px] font-black text-amber-800 uppercase mt-0.5">
                            ★ Shift Anda
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {group.users.map(u => {
                        const isCurrent = u.id === currentUser.id;
                        return (
                          <div
                            key={u.id}
                            className={`p-2 rounded-lg text-xs flex items-center justify-between ${
                              isCurrent
                                ? 'bg-amber-100/70 text-amber-950 font-bold border border-amber-300'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <span className="truncate">
                              {u.name} {isCurrent && '(Anda)'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">
                              {u.teamId}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* EXPANDABLE DYNAMIC SHIFT LEGEND */}
        {(showShiftLegend || scheduleViewTab === 'GRID') && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Referensi Kode Shift &amp; Jam Kerja Dinas (Terbaru):
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(shiftDefinitions).map(([code, meta]) => (
                <div
                  key={code}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border font-medium bg-white shadow-2xs"
                  style={{ borderColor: meta.hexBg ? `${meta.hexBg}99` : '#cbd5e1' }}
                >
                  <span
                    className="w-6 h-5 rounded flex items-center justify-center font-black text-[10px]"
                    style={{ backgroundColor: meta.hexBg, color: meta.hexText }}
                  >
                    {code}
                  </span>
                  <span className="text-[11px] text-slate-700">
                    {meta.name}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono px-1 rounded bg-slate-100">
                    {meta.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Row 2: Pengajuan Saya & Ujian Tersedia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pengajuan Saya (Cuti / Izin / Sakit / Tukar Jadwal) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-600" />
                <span>Pengajuan Saya</span>
              </h3>
              <p className="text-xs text-slate-500">Status cuti, izin, sakit, dan permohonan tukar jadwal</p>
            </div>
            <button
              onClick={() => setCurrentRoute('approvals')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              Buat Pengajuan +
            </button>
          </div>

          <div className="space-y-2.5">
            {myApprovals.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada riwayat pengajuan cuti, izin, atau tukar jadwal.
              </div>
            ) : (
              myApprovals.slice(0, 4).map(appr => {
                let statusBadge = 'bg-amber-100 text-amber-800 border-amber-300';
                if (appr.status === 'Approved') statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                if (appr.status === 'Rejected') statusBadge = 'bg-rose-100 text-rose-800 border-rose-300';

                return (
                  <div
                    key={appr.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{appr.type}</span>
                        <span className="text-[10px] text-slate-400">#{appr.ticketNumber}</span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {appr.type === 'Tukar Jadwal'
                          ? `Dengan ${appr.swapWithUserName} (Tgl: ${appr.swapDate})`
                          : `Tgl: ${appr.startDate} s/d ${appr.endDate} — "${appr.reason}"`}
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}>
                      {appr.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Ujian Tersedia & Riwayat Nilai */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  <span>Ujian Pemahaman ({availableExams.length} Tersedia)</span>
                </h3>
                <p className="text-xs text-slate-500">Pre-Test dan Post-Test materi operasional</p>
              </div>
              <button
                onClick={() => setCurrentRoute('exams')}
                className="text-xs font-bold text-purple-600 hover:text-purple-800"
              >
                Lihat Semua
              </button>
            </div>

            <div className="space-y-3">
              {availableExams.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Tidak ada ujian yang perlu dikerjakan saat ini.
                </div>
              ) : (
                availableExams.slice(0, 2).map(exam => (
                  <div
                    key={exam.id}
                    className="p-3.5 rounded-xl border border-purple-200/80 bg-purple-50/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs">{exam.title}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                          {exam.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Durasi: {exam.durationMinutes} Menit &bull; Passing Grade: {exam.passingGrade}
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentRoute('exams')}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                    >
                      Mulai
                    </button>
                  </div>
                ))
              )}

              {/* Recent score preview */}
              {mySubmissions.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Hasil Ujian Terakhir Saya
                  </span>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{mySubmissions[0].examTitle}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(mySubmissions[0].submittedAt).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-indigo-600">
                        {mySubmissions[0].score}
                      </div>
                      <span className={`text-[10px] font-bold ${mySubmissions[0].isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {mySubmissions[0].isPassed ? 'Lulus' : 'Tidak Lulus'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Peringkat Leaderboard:</span>
            <button
              onClick={() => setCurrentRoute('leaderboard')}
              className="font-bold text-indigo-600 hover:underline"
            >
              Lihat Ranking &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
