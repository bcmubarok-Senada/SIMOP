import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { MONTH_NAMES_ID, SHIFT_DEFINITIONS } from '../../utils/constants';
import {
  exportSchedulesToExcel, exportSenadaToExcel, exportLeaderboardToExcel
} from '../../services/excel';
import {
  FileSpreadsheet, Download, Calendar, Users, Layers,
  Award, TrendingUp, CheckCircle2, Clock
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { currentUser, addToast } = useAuth();

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth()); // 0-indexed

  const users = storageService.getUsers();
  const schedules = storageService.getSchedules();
  const senadaAssignments = storageService.getSenadaAssignments();
  const submissions = storageService.getExamSubmissions();
  const teams = storageService.getTeams();

  // Statistics calculation for the selected month
  const monthStats = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthlySchedules = schedules.filter(s => s.date.startsWith(monthPrefix));

    const totalDinas = monthlySchedules.filter(s => ['P1', 'P2', 'P3', 'P4', 'P5', 'P1A', 'P2A', 'P3A', 'P4A'].includes(s.shiftCode)).length;
    const totalLibur = monthlySchedules.filter(s => s.shiftCode === 'X').length;
    const totalCuti = monthlySchedules.filter(s => s.shiftCode === 'C').length;
    const totalIzin = monthlySchedules.filter(s => s.shiftCode === 'I').length;
    const totalSakit = monthlySchedules.filter(s => s.shiftCode === 'S').length;

    const monthlySenada = senadaAssignments.filter(s => s.date.startsWith(monthPrefix));
    const totalPM = monthlySenada.filter(s => s.category === 'PM').length;
    const totalIP = monthlySenada.filter(s => s.category === 'IP').length;
    const totalIM = monthlySenada.filter(s => s.category === 'IM').length;

    return {
      totalDinas,
      totalLibur,
      totalCuti,
      totalIzin,
      totalSakit,
      totalPM,
      totalIP,
      totalIM,
    };
  }, [schedules, senadaAssignments, year, month]);

  // Export Schedule
  const handleExportSchedule = (category: 'PETUGAS' | 'TL' | 'QA') => {
    const targetUsers = users.filter(u => {
      if (category === 'PETUGAS') return u.role === 'PETUGAS';
      if (category === 'TL') return u.role === 'TL' || u.role === 'KOORDINATOR';
      if (category === 'QA') return u.role === 'QA';
      return false;
    });

    exportSchedulesToExcel(
      schedules,
      targetUsers,
      year,
      month,
      `Rekap_Jadwal_${category}_${year}_${month + 1}.xlsx`
    );
    addToast(`Laporan Jadwal ${category} berhasil diunduh!`, 'success');
  };

  // Export Senada
  const handleExportSenada = () => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthly = senadaAssignments.filter(s => s.date.startsWith(monthPrefix));
    exportSenadaToExcel(monthly, `Rekap_Kategori_Senada_${year}_${month + 1}.xlsx`);
    addToast('Laporan Distribusi Kategori Senada berhasil diunduh!', 'success');
  };

  // Export Exams
  const handleExportExams = () => {
    exportLeaderboardToExcel(submissions, `Rekap_Hasil_Uji_Pemahaman_${year}.xlsx`);
    addToast('Laporan Nilai Uji Pemahaman berhasil diunduh!', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Pusat Pelaporan &amp; Rekapitulasi Operasional</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Laporan Operasional
          </h2>
          <p className="text-xs text-slate-500">
            Ekspor rekap data jadwal, kepatuhan shift, distribusi kanal Senada, dan hasil uji pemahaman.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-xs">
          <select
            value={month}
            onChange={e => setMonth(parseInt(e.target.value, 10))}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            {MONTH_NAMES_ID.map((name, idx) => (
              <option key={idx} value={idx}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value, 10))}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>
      </div>

      {/* Monthly Summary Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Sesi Dinas
          </span>
          <div className="text-2xl font-black text-indigo-600 mt-1">{monthStats.totalDinas}</div>
          <span className="text-[11px] text-slate-500 block mt-0.5">Shift P1-P5 &amp; WFA</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Hari Lepas / Libur
          </span>
          <div className="text-2xl font-black text-slate-700 mt-1">{monthStats.totalLibur}</div>
          <span className="text-[11px] text-slate-500 block mt-0.5">Off Duty (X)</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Cuti, Izin &amp; Sakit
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {monthStats.totalCuti + monthStats.totalIzin + monthStats.totalSakit}
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Cuti: {monthStats.totalCuti} &bull; Izin: {monthStats.totalIzin} &bull; Sakit: {monthStats.totalSakit}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Plotting Senada
          </span>
          <div className="text-2xl font-black text-teal-600 mt-1">
            {monthStats.totalPM + monthStats.totalIP + monthStats.totalIM}
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            PM: {monthStats.totalPM} &bull; IP: {monthStats.totalIP} &bull; IM: {monthStats.totalIM}
          </span>
        </div>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Jadwal Petugas 6 Tim */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-600">
              <Calendar className="w-5 h-5" />
              <h3 className="font-bold text-slate-800 text-base">Laporan Jadwal Petugas (6 Tim)</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Matriks kalender dinas bulanan seluruh petugas layanan Team 1 sampai Team 6 lengkap dengan kode shift dan rekap harian.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleExportSchedule('PETUGAS')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel Jadwal Petugas</span>
          </button>
        </div>

        {/* Jadwal TL & QA */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600">
              <Users className="w-5 h-5" />
              <h3 className="font-bold text-slate-800 text-base">Laporan Jadwal TL &amp; QA</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Matriks dinas pengawas operasional Team Leader (TL) dan Quality Assurance (QA) periode {MONTH_NAMES_ID[month]} {year}.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleExportSchedule('TL')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>Excel Jadwal TL</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportSchedule('QA')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>Excel Jadwal QA</span>
            </button>
          </div>
        </div>

        {/* Rekapitulasi Kategori Senada */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-teal-600">
              <Layers className="w-5 h-5" />
              <h3 className="font-bold text-slate-800 text-base">Laporan Kategori Senada</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Data plotting penugasan kanal pelayanan PM (Permintaan/Info), IP (Pengaduan), dan IM (Info Permintaan) personil petugas.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportSenada}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel Kategori Senada</span>
          </button>
        </div>

        {/* Hasil Uji Pemahaman */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-600">
              <Award className="w-5 h-5" />
              <h3 className="font-bold text-slate-800 text-base">Laporan Uji Pemahaman</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Rekapitulasi lengkap nilai Pre-Test dan Post-Test, persentase kelulusan, dan durasi pengerjaan seluruh peserta ujian.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportExams}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel Hasil Ujian</span>
          </button>
        </div>
      </div>
    </div>
  );
};
