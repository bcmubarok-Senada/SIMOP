import React, { useState, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import {
  ScheduleEntry, BaselineScheduleEntry, User, ShiftRequirement,
  ScheduleCategory, ShiftCode
} from '../../types';
import {
  SHIFT_DEFINITIONS, MONTH_NAMES_ID, DAY_NAMES_ID,
  isAdminRole
} from '../../utils/constants';
import {
  exportSchedulesToExcel, downloadScheduleTemplate, parseScheduleExcel
} from '../../services/excel';
import {
  Calendar, ChevronLeft, ChevronRight, Download, Upload,
  Printer, Copy, FileText, Check, AlertTriangle, Layers,
  Search, SlidersHorizontal, RefreshCw, Plus, Trash2, Eye,
  History, KeyRound
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { ScheduleHistoryModal } from './ScheduleHistoryModal';
import { AdminLoginModal } from '../auth/AdminLoginModal';

export const ScheduleGrid: React.FC = () => {
  const { currentUser, addToast, refreshData } = useAuth();
  const isAdmin = currentUser ? isAdminRole(currentUser.role) : false;
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  // Selected schedule category tab: PETUGAS, TL, QA
  const [scheduleCategory, setScheduleCategory] = useState<ScheduleCategory>(() => {
    if (currentUser?.role === 'QA') return 'QA';
    if (currentUser?.role === 'TL') return 'TL';
    return 'PETUGAS';
  });

  // Schedule View Mode: 'ACTIVE' (Jadwal Aktif) vs 'BASELINE' (Jadwal Awal)
  const [viewMode, setViewMode] = useState<'ACTIVE' | 'BASELINE'>('ACTIVE');

  // Month & Year state
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Filters
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');
  const [searchEmployee, setSearchEmployee] = useState('');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('ALL');

  // Cell Dropdown Edit state
  const [activeCell, setActiveCell] = useState<{ userId: string; date: string } | null>(null);

  // Bulk input modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkUserId, setBulkUserId] = useState('');
  const [bulkStartDay, setBulkStartDay] = useState(1);
  const [bulkEndDay, setBulkEndDay] = useState(30);
  const [bulkShiftCode, setBulkShiftCode] = useState('P1');

  // Shift Requirement settings modal state
  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
  const [requirementsState, setRequirementsState] = useState<ShiftRequirement[]>(() =>
    storageService.getShiftRequirements()
  );

  // Custom Shift input modal state
  const [isCustomShiftModalOpen, setIsCustomShiftModalOpen] = useState(false);
  const [customShiftCode, setCustomShiftCode] = useState('');
  const [customShiftName, setCustomShiftName] = useState('');

  // Excel Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Data from storage
  const allUsers = storageService.getUsers();
  const allTeams = storageService.getTeams();
  const schedules = storageService.getSchedules();
  const baselineSchedules = storageService.getBaselineSchedules();
  const shiftDefinitions = storageService.getShiftDefinitions();

  // Days in selected month
  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const daysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  // Filter users by schedule type (Petugas, TL, QA)
  const categoryUsers = useMemo(() => {
    return allUsers.filter(u => {
      if (u.status !== 'Aktif') return false;
      if (scheduleCategory === 'PETUGAS') return u.role === 'PETUGAS';
      if (scheduleCategory === 'TL') return u.role === 'TL' || u.role === 'KOORDINATOR';
      if (scheduleCategory === 'QA') return u.role === 'QA';
      return false;
    });
  }, [allUsers, scheduleCategory]);

  // Apply UI filters (Team, search name/NPP)
  const displayUsers = useMemo(() => {
    return categoryUsers.filter(u => {
      const matchTeam = selectedTeamFilter === 'ALL' || u.teamId === selectedTeamFilter;
      const matchSearch =
        searchEmployee === '' ||
        u.name.toLowerCase().includes(searchEmployee.toLowerCase()) ||
        u.npp.toLowerCase().includes(searchEmployee.toLowerCase());
      return matchTeam && matchSearch;
    });
  }, [categoryUsers, selectedTeamFilter, searchEmployee]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Helper to format date string YYYY-MM-DD
  const getDateStr = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Cell shift code getter based on viewMode
  const getCellShift = (userId: string, day: number): string => {
    const dateStr = getDateStr(day);
    if (viewMode === 'BASELINE') {
      const base = baselineSchedules.find(b => b.userId === userId && b.date === dateStr);
      return base ? base.shiftCode : 'X';
    }
    const act = schedules.find(s => s.userId === userId && s.date === dateStr);
    return act ? act.shiftCode : 'X';
  };

  // Check if a cell is modified compared to baseline
  const isCellModified = (userId: string, day: number): boolean => {
    const dateStr = getDateStr(day);
    const act = schedules.find(s => s.userId === userId && s.date === dateStr);
    const base = baselineSchedules.find(b => b.userId === userId && b.date === dateStr);
    if (!act || !base) return false;
    return act.shiftCode !== base.shiftCode;
  };

  // Cell click edit - only Admin status can edit
  const handleCellClick = (userId: string, day: number) => {
    if (viewMode === 'BASELINE') return;
    if (!isAdmin) {
      addToast(
        'Perubahan jadwal langsung hanya dapat dilakukan oleh akun berstatus Admin. Silakan masuk sebagai Admin atau gunakan Pengajuan Perubahan Jadwal.',
        'warning'
      );
      setIsAdminLoginModalOpen(true);
      return;
    }
    const dateStr = getDateStr(day);
    setActiveCell({ userId, date: dateStr });
  };

  // Set shift for cell
  const handleSetShift = (shiftCode: string) => {
    if (!activeCell || !currentUser) return;
    const user = allUsers.find(u => u.id === activeCell.userId);
    if (!user || user.status === 'Nonaktif') {
      addToast('Pengguna nonaktif tidak dapat diberikan jadwal.', 'error');
      return;
    }

    const previousShift = getCellShift(activeCell.userId, parseInt(activeCell.date.split('-')[2], 10));

    storageService.updateScheduleCell(
      activeCell.userId,
      activeCell.date,
      shiftCode,
      scheduleCategory,
      currentUser.id
    );

    // Audit log
    storageService.addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Ubah Jadwal Petugas',
      module: 'Sistem Jadwal',
      dataBefore: `User: ${user.name}, Tgl: ${activeCell.date}, Shift: ${previousShift}`,
      dataAfter: `Shift: ${shiftCode}`,
      notes: `${currentUser.role} ${currentUser.name} mengubah jadwal ${user.name} pada ${activeCell.date} dari ${previousShift} menjadi ${shiftCode}`,
    });

    // Synchronize Senada if user is PETUGAS
    if (user.role === 'PETUGAS') {
      const senadaList = storageService.getSenadaAssignments();
      const existingSenadaIdx = senadaList.findIndex(
        s => s.userId === activeCell.userId && s.date === activeCell.date
      );
      if (['X', 'C', 'I', 'S'].includes(shiftCode)) {
        // If changed to off/leave, remove Senada assignment
        if (existingSenadaIdx >= 0) {
          senadaList.splice(existingSenadaIdx, 1);
          storageService.saveSenadaAssignments(senadaList);
        }
      } else if (existingSenadaIdx >= 0) {
        senadaList[existingSenadaIdx].shiftCode = shiftCode;
        storageService.saveSenadaAssignments(senadaList);
      } else {
        // Create default PM assignment
        senadaList.push({
          id: `sen-${user.id}-${activeCell.date}`,
          userId: user.id,
          npp: user.npp,
          userName: user.name,
          teamId: user.teamId,
          date: activeCell.date,
          shiftCode,
          category: 'PM',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        storageService.saveSenadaAssignments(senadaList);
      }
    }

    setActiveCell(null);
    refreshData();
    addToast('Jadwal berhasil diperbarui!', 'success');
  };

  // Bulk input execute
  const handleBulkInput = () => {
    if (!bulkUserId || !currentUser) return;
    const targetUser = allUsers.find(u => u.id === bulkUserId);
    if (!targetUser) return;

    for (let d = bulkStartDay; d <= bulkEndDay; d++) {
      const dateStr = getDateStr(d);
      storageService.updateScheduleCell(
        targetUser.id,
        dateStr,
        bulkShiftCode,
        scheduleCategory,
        currentUser.id
      );
    }

    storageService.addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Bulk Input Jadwal',
      module: 'Sistem Jadwal',
      notes: `Pengisian masal jadwal ${targetUser.name} tgl ${bulkStartDay}-${bulkEndDay} menjadi ${bulkShiftCode}`,
    });

    setIsBulkModalOpen(false);
    refreshData();
    addToast(`Berhasil menerapkan jadwal masal untuk ${targetUser.name}!`, 'success');
  };

  // Clear month schedule for selected users
  const handleClearSchedules = () => {
    if (!window.confirm(`Apakah Anda yakin ingin mengosongkan (set Libur X) jadwal ${scheduleCategory} pada bulan ini?`)) {
      return;
    }
    categoryUsers.forEach(u => {
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = getDateStr(d);
        storageService.updateScheduleCell(u.id, dateStr, 'X', scheduleCategory, currentUser!.id);
      }
    });
    refreshData();
    addToast('Jadwal bulan ini berhasil direset ke Libur (X).', 'info');
  };

  // Duplicate baseline to active
  const handleRestoreFromBaseline = () => {
    if (!window.confirm('Kembalikan Jadwal Aktif persis sesuai JADWAL AWAL?')) return;
    const baseList = storageService.getBaselineSchedules();
    const currentScheds = storageService.getSchedules();

    baseList.forEach(base => {
      const idx = currentScheds.findIndex(s => s.userId === base.userId && s.date === base.date);
      if (idx >= 0) {
        currentScheds[idx].shiftCode = base.shiftCode;
      }
    });

    storageService.saveSchedules(currentScheds);
    refreshData();
    addToast('Jadwal Aktif berhasil disinkronkan kembali dengan Jadwal Awal.', 'success');
  };

  // Save current active schedule as baseline
  const handleSaveAsBaseline = () => {
    if (!window.confirm('Simpan kondisi jadwal saat ini sebagai JADWAL AWAL (Baseline)?')) return;
    const active = storageService.getSchedules();
    const newBaselines: BaselineScheduleEntry[] = active.map(s => ({
      id: `base-${s.userId}-${s.date}`,
      userId: s.userId,
      date: s.date,
      shiftCode: s.shiftCode,
      scheduleType: s.scheduleType,
      createdAt: new Date().toISOString(),
    }));
    storageService.saveBaselineSchedules(newBaselines);
    refreshData();
    addToast('Jadwal Awal (Baseline) berhasil diperbarui!', 'success');
  };

  // Shift requirements calculation per day or monthly average
  const shiftRequirements = storageService.getShiftRequirements();
  const coreShifts = ['P1', 'P2', 'P3', 'P4', 'P5'];

  // Calculate actual person count per shift for today
  const todayDateStr = getDateStr(new Date().getDate());
  const dailyShiftStats = useMemo(() => {
    return coreShifts.map(code => {
      const req = shiftRequirements.find(r => r.shiftCode === code)?.requiredCount || 2;
      const actual = schedules.filter(
        s => s.date === todayDateStr && (s.shiftCode === code || s.shiftCode === `${code}A`)
      ).length;
      const diff = actual - req;
      let status: 'Terpenuhi' | 'Kurang' | 'Lebih' = 'Terpenuhi';
      if (diff < 0) status = 'Kurang';
      else if (diff > 0) status = 'Lebih';
      return { code, req, actual, diff, status };
    });
  }, [schedules, todayDateStr, shiftRequirements]);

  // Excel Export Handler
  const handleExportExcel = () => {
    exportSchedulesToExcel(
      schedules,
      categoryUsers,
      year,
      month,
      `Jadwal_${scheduleCategory}_${year}_${month + 1}.xlsx`
    );
    addToast('File Excel jadwal berhasil diunduh.', 'success');
  };

  // Excel Import Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImportFile(file);

      const validNpps = new Set(allUsers.filter(u => u.status === 'Aktif').map(u => u.npp.toLowerCase()));
      const validShifts = new Set(Object.keys(shiftDefinitions));

      const result = await parseScheduleExcel(file, validNpps, validShifts, year, month);
      setImportPreview(result);
    }
  };

  const handleConfirmImport = () => {
    if (!importPreview || !currentUser) return;
    setIsImporting(true);

    importPreview.importedEntries.forEach((entry: { npp: string; date: string; shiftCode: string }) => {
      const targetUser = allUsers.find(u => u.npp.toLowerCase() === entry.npp.toLowerCase());
      if (targetUser) {
        storageService.updateScheduleCell(
          targetUser.id,
          entry.date,
          entry.shiftCode,
          scheduleCategory,
          currentUser.id
        );
      }
    });

    storageService.addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Import Excel Jadwal',
      module: 'Sistem Jadwal',
      notes: `Import berhasil: ${importPreview.validCount} entri jadwal diperbarui.`,
    });

    setIsImporting(false);
    setIsImportModalOpen(false);
    setImportFile(null);
    setImportPreview(null);
    refreshData();
    addToast(`Berhasil mengimpor ${importPreview.validCount} jadwal dari Excel!`, 'success');
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Print-only Header (Visible only when printed in Landscape) */}
      <div className="hidden print:block mb-4 text-center">
        <h1 className="text-xl font-bold uppercase">Sistem Operasional &amp; Jadwal Petugas</h1>
        <h2 className="text-base font-semibold">
          Jadwal Dinas {scheduleCategory} &bull; Periode: {MONTH_NAMES_ID[month]} {year}
        </h2>
        <p className="text-xs text-slate-500">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
      </div>

      {/* Screen Controls Header */}
      <div className="print:hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Sistem Kalender &amp; Penjadwalan Kerja</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Manajemen Jadwal Operasional
          </h2>
          <p className="text-xs text-slate-500">
            Plotting shift dinas aktif untuk Petugas, Team Leader (TL), dan Quality Assurance (QA).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Riwayat Perubahan Jadwal (Visible to all users) */}
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold transition shadow-2xs"
            title="Lihat catatan kronologis semua perubahan dan pertukaran jadwal"
          >
            <History className="w-3.5 h-3.5 text-amber-600" />
            <span>Riwayat Perubahan Jadwal</span>
          </button>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Bulk Input</span>
              </button>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Import Excel</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            <Printer className="w-3.5 h-3.5 text-purple-600" />
            <span>Cetak (Landscape)</span>
          </button>
        </div>
      </div>

      {/* Category Tabs (Petugas 6 Tim / TL / QA) & Mode Toggle (Jadwal Aktif vs Jadwal Awal) */}
      <div className="print:hidden bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* 3 Categories: Petugas, TL, QA */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl max-w-md">
            <button
              type="button"
              onClick={() => setScheduleCategory('PETUGAS')}
              className={`flex-1 py-1.5 px-4 text-xs font-bold rounded-lg transition ${
                scheduleCategory === 'PETUGAS'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Jadwal Petugas (6 Tim)
            </button>
            <button
              type="button"
              onClick={() => setScheduleCategory('TL')}
              className={`flex-1 py-1.5 px-4 text-xs font-bold rounded-lg transition ${
                scheduleCategory === 'TL'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Jadwal Team Leader (TL)
            </button>
            <button
              type="button"
              onClick={() => setScheduleCategory('QA')}
              className={`flex-1 py-1.5 px-4 text-xs font-bold rounded-lg transition ${
                scheduleCategory === 'QA'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Jadwal QA
            </button>
          </div>

          {/* Mode Tampilan: Hanya Jadwal Aktif */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Mode Tampilan:</span>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Jadwal Aktif</span>
            </div>
          </div>
        </div>

        {/* Date Navigator & Filters Bar */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          {/* Month Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center font-bold text-slate-800 text-sm py-1.5 px-3 bg-slate-50 rounded-xl border border-slate-100">
              {MONTH_NAMES_ID[month]} {year}
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-2 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition"
            >
              Hari Ini
            </button>
          </div>

          {/* Team Filter (Specifically for Petugas Team 1-6) */}
          {scheduleCategory === 'PETUGAS' && (
            <div>
              <select
                value={selectedTeamFilter}
                onChange={e => setSelectedTeamFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">Semua Team Petugas (Team 1-6)</option>
                {allTeams.filter(t => t.type === 'PETUGAS').map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Employee Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchEmployee}
              onChange={e => setSearchEmployee(e.target.value)}
              placeholder="Cari personil atau NPP..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Clear & Reset Shortcut for Admin */}
          {isAdmin && viewMode === 'ACTIVE' && (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleRestoreFromBaseline}
                className="px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition"
              >
                Kembalikan Baseline
              </button>
              <button
                type="button"
                onClick={handleClearSchedules}
                className="px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition"
              >
                Reset Bulan Ini
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Legend Badges */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>Keterangan Kode Sift &amp; Status (Legend):</span>
          <span className="text-[10px] font-normal text-slate-500">
            {isAdmin && viewMode === 'ACTIVE' ? 'Klik sel jadwal untuk mengubah kode shift secara langsung.' : ''}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(shiftDefinitions).map(([code, meta]) => (
            <div
              key={code}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium shadow-2xs"
              style={{
                backgroundColor: meta.hexBg || undefined,
                color: meta.hexText || undefined,
                borderColor: meta.hexBg ? `${meta.hexBg}99` : '#cbd5e1',
              }}
            >
              <span className="font-extrabold">{code}</span>
              <span className="text-[11px] opacity-90">= {meta.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Grid Table with Sticky Header & Sticky Employee Column */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] relative">
          <table className="w-full text-xs border-collapse">
            {/* Sticky Header */}
            <thead className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-xs">
              <tr>
                <th className="sticky left-0 z-30 bg-slate-100 p-3 min-w-[200px] text-left font-bold text-slate-800 border-r border-slate-200">
                  Personil / Team
                </th>
                {daysArray.map(day => {
                  const dayDate = new Date(year, month, day);
                  const dayOfWeek = dayDate.getDay(); // 0 = Sun
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  const isCurrentDay =
                    day === new Date().getDate() &&
                    month === new Date().getMonth() &&
                    year === new Date().getFullYear();

                  return (
                    <th
                      key={day}
                      className={`py-2 px-1 min-w-[42px] text-center border-r border-slate-200/60 font-semibold ${
                        isCurrentDay
                          ? 'bg-indigo-100/90 text-indigo-900 font-black'
                          : isWeekend
                          ? 'bg-slate-200/70 text-slate-700'
                          : 'text-slate-600'
                      }`}
                    >
                      <div className="text-[10px] opacity-80">{DAY_NAMES_ID[dayOfWeek]}</div>
                      <div className="text-xs">{day}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/70 text-slate-700">
              {displayUsers.length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth + 1} className="py-12 text-center text-slate-400">
                    Tidak ada personil yang sesuai pada kategori jadwal ini.
                  </td>
                </tr>
              ) : (
                displayUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition">
                    {/* Sticky Employee Name & Team column */}
                    <td className="sticky left-0 z-10 bg-white p-2.5 border-r border-slate-200 flex items-center justify-between gap-2 shadow-xs">
                      <div className="truncate">
                        <div className="font-bold text-slate-800 truncate">{user.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {user.npp} &bull; {user.teamId}
                        </div>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium shrink-0">
                        {user.jabatan.split(' ')[0]}
                      </span>
                    </td>

                    {/* Day Cells */}
                    {daysArray.map(day => {
                      const shiftCode = getCellShift(user.id, day);
                      const shiftMeta = shiftDefinitions[shiftCode] || storageService.getShiftMeta(shiftCode);

                      const isModified = isCellModified(user.id, day);
                      const isCellActive =
                        activeCell?.userId === user.id &&
                        activeCell?.date === getDateStr(day);

                      return (
                        <td
                          key={day}
                          onClick={() => handleCellClick(user.id, day)}
                          className={`p-1 text-center border-r border-slate-100 relative select-none ${
                            isAdmin && viewMode === 'ACTIVE'
                              ? 'cursor-pointer hover:opacity-80'
                              : ''
                          }`}
                        >
                          <div
                            className={`w-full py-1 rounded text-center font-bold text-[11px] border transition-all ${
                              isCellActive ? 'ring-2 ring-indigo-600 scale-105 z-10' : ''
                            }`}
                            style={{
                              backgroundColor: shiftMeta.hexBg || undefined,
                              color: shiftMeta.hexText || undefined,
                              borderColor: shiftMeta.hexBg ? `${shiftMeta.hexBg}99` : undefined,
                            }}
                          >
                            <span>{shiftCode}</span>
                            {/* Marker dot if modified from baseline */}
                            {isModified && viewMode === 'ACTIVE' && (
                              <span
                                title="Jadwal telah berubah dari jadwal awal (misal akibat approval cuti/tukar)"
                                className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500"
                              />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cell Quick Dropdown Picker Popover */}
      {activeCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Ubah Sift Jadwal</h4>
                <p className="text-xs text-slate-500">
                  Tanggal: {activeCell.date} &bull; Personil:{' '}
                  {allUsers.find(u => u.id === activeCell.userId)?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCell(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {Object.values(shiftDefinitions).filter(s => s.category === 'Shift').length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Shift Kantor (WFO):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.values(shiftDefinitions).filter(s => s.category === 'Shift').map(s => (
                      <button
                        key={s.code}
                        onClick={() => handleSetShift(s.code)}
                        style={{ backgroundColor: s.hexBg, color: s.hexText }}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold border transition hover:scale-105 shadow-2xs"
                        title={s.name}
                      >
                        {s.code}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {Object.values(shiftDefinitions).filter(s => s.category === 'WFA').length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    WFA (Work From Anywhere):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.values(shiftDefinitions).filter(s => s.category === 'WFA').map(s => (
                      <button
                        key={s.code}
                        onClick={() => handleSetShift(s.code)}
                        style={{ backgroundColor: s.hexBg, color: s.hexText }}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold border transition hover:scale-105 shadow-2xs"
                        title={s.name}
                      >
                        {s.code}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {Object.values(shiftDefinitions).filter(s => s.category === 'Status').length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Status &amp; Izin:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.values(shiftDefinitions).filter(s => s.category === 'Status').map(s => (
                      <button
                        key={s.code}
                        onClick={() => handleSetShift(s.code)}
                        style={{ backgroundColor: s.hexBg, color: s.hexText }}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold border transition hover:scale-105 shadow-2xs"
                        title={s.name}
                      >
                        {s.code}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {Object.values(shiftDefinitions).filter(s => s.category === 'Custom').length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Shift Khusus / Kustom:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.values(shiftDefinitions).filter(s => s.category === 'Custom').map(s => (
                      <button
                        key={s.code}
                        onClick={() => handleSetShift(s.code)}
                        style={{ backgroundColor: s.hexBg, color: s.hexText }}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold border transition hover:scale-105 shadow-2xs"
                        title={s.name}
                      >
                        {s.code}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setIsCustomShiftModalOpen(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  + Kode Custom...
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCell(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 8: Kebutuhan Per Sift vs Aktual Table & Visual Comparison (Hanya untuk Petugas) */}
      {scheduleCategory === 'PETUGAS' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Kebutuhan Per Sift vs Aktual ({todayDateStr})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Evaluasi pemenuhan kuota personil shift harian (P1 s/d P5)
              </p>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsRequirementModalOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                <span>Atur Kuota Kebutuhan</span>
              </button>
            )}
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
                  <th className="py-2.5 px-3">Grafik Pemenuhan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyShiftStats.map(item => {
                  let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  if (item.status === 'Kurang') badgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
                  if (item.status === 'Lebih') badgeClass = 'bg-blue-100 text-blue-800 border-blue-300';

                  const pct = item.req > 0 ? Math.min(Math.round((item.actual / item.req) * 100), 150) : 100;

                  return (
                    <tr key={item.code} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center font-bold text-xs">
                            {item.code}
                          </span>
                          <span>{shiftDefinitions[item.code]?.name || item.code}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                        {item.req} orang
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                        {item.actual} orang
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold">
                        <span
                          className={
                            item.diff < 0
                              ? 'text-rose-600'
                              : item.diff > 0
                              ? 'text-blue-600'
                              : 'text-emerald-600'
                          }
                        >
                          {item.diff > 0 ? `+${item.diff}` : item.diff}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 min-w-[160px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.status === 'Kurang'
                                  ? 'bg-rose-500'
                                  : item.status === 'Lebih'
                                  ? 'bg-blue-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 w-8 text-right">
                            {pct}%
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
      )}

      {/* Modal: Bulk Input */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Input Jadwal Masal (Bulk Input)"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pilih Personil *</label>
            <select
              value={bulkUserId}
              onChange={e => setBulkUserId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="">-- Pilih Personil --</option>
              {categoryUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.npp} - {u.teamId})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mulai Tanggal</label>
              <input
                type="number"
                min={1}
                max={daysInMonth}
                value={bulkStartDay}
                onChange={e => setBulkStartDay(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sampai Tanggal</label>
              <input
                type="number"
                min={1}
                max={daysInMonth}
                value={bulkEndDay}
                onChange={e => setBulkEndDay(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kode Sift / Status</label>
            <select
              value={bulkShiftCode}
              onChange={e => setBulkShiftCode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            >
              {Object.keys(shiftDefinitions).map(code => (
                <option key={code} value={code}>
                  {code} - {shiftDefinitions[code]?.name || code}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleBulkInput}
              disabled={!bulkUserId}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm disabled:opacity-50"
            >
              Terapkan Jadwal Masal
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Atur Kebutuhan Sift */}
      <Modal
        isOpen={isRequirementModalOpen}
        onClose={() => setIsRequirementModalOpen(false)}
        title="Pengaturan Kebutuhan Personil Per Sift"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-500">
            Tentukan jumlah minimum personil yang dibutuhkan untuk setiap shift operasional.
          </p>

          <div className="space-y-2.5">
            {requirementsState.map((req, idx) => (
              <div key={req.shiftCode} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-800">
                  {req.shiftCode} - {shiftDefinitions[req.shiftCode]?.name || req.shiftCode}
                </span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={req.requiredCount}
                  onChange={e => {
                    const next = [...requirementsState];
                    next[idx].requiredCount = parseInt(e.target.value, 10) || 0;
                    setRequirementsState(next);
                  }}
                  className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center font-bold text-xs"
                />
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRequirementModalOpen(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                storageService.saveShiftRequirements(requirementsState);
                setIsRequirementModalOpen(false);
                refreshData();
                addToast('Kebutuhan shift berhasil disimpan!', 'success');
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
            >
              Simpan Kuota
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Custom Shift */}
      <Modal
        isOpen={isCustomShiftModalOpen}
        onClose={() => setIsCustomShiftModalOpen(false)}
        title="Input Kode Shift Kustom"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kode Sift Baru *</label>
            <input
              type="text"
              value={customShiftCode}
              onChange={e => setCustomShiftCode(e.target.value.toUpperCase())}
              placeholder="Contoh: CS1"
              maxLength={4}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama / Keterangan Sift *</label>
            <input
              type="text"
              value={customShiftName}
              onChange={e => setCustomShiftName(e.target.value)}
              placeholder="Contoh: Khusus Pengawalan Proyek"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCustomShiftModalOpen(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!customShiftCode.trim()}
              onClick={() => {
                const upperCode = customShiftCode.trim().toUpperCase();
                storageService.addShiftDefinition(
                  {
                    code: upperCode,
                    name: customShiftName.trim() || `Shift Khusus ${upperCode}`,
                    category: 'Custom',
                    colorBg: 'bg-amber-100',
                    colorText: 'text-amber-900',
                    colorBorder: 'border-amber-300',
                    hexBg: '#fef3c7',
                    hexText: '#78350f',
                  },
                  currentUser?.name,
                  currentUser?.role
                );
                handleSetShift(upperCode);
                setIsCustomShiftModalOpen(false);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
            >
              Gunakan Kode
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Import Excel */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Jadwal dari Excel (.xlsx)"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">Download Template Excel Resmi</span>
              <span className="text-slate-500 text-[11px]">
                Gunakan template standar agar format tanggal dan NPP sesuai.
              </span>
            </div>
            <button
              type="button"
              onClick={() => downloadScheduleTemplate(year, month)}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template</span>
            </button>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Pilih Berkas Excel (.xlsx / .csv)
            </label>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          {/* Validation & Preview Result */}
          {importPreview && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                <span className="font-bold text-indigo-900">
                  Total Entri Valid Siap Disimpan: {importPreview.validCount}
                </span>
                <span className="text-[11px] text-indigo-700">
                  {importPreview.errors.length} Kesalahan Ditemukan
                </span>
              </div>

              {importPreview.errors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 space-y-1 max-h-40 overflow-y-auto">
                  <div className="font-bold text-xs flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Daftar Kesalahan Baris:</span>
                  </div>
                  {importPreview.errors.map((err: any, i: number) => (
                    <div key={i} className="text-[11px]">
                      Baris {err.row} (NPP: {err.npp}): {err.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!importPreview || importPreview.validCount === 0 || isImporting}
              onClick={handleConfirmImport}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm disabled:opacity-50"
            >
              {isImporting ? 'Menyimpan...' : 'Konfirmasi & Simpan Jadwal'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Schedule History Modal */}
      <ScheduleHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      {/* Admin Authentication Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
      />
    </div>
  );
};
