import React, { useState, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { SenadaAssignment, SenadaCategory, User } from '../../types';
import {
  SENADA_CATEGORIES, isAdminRole, MONTH_NAMES_ID, DAY_NAMES_ID
} from '../../utils/constants';
import {
  exportSenadaToExcel, exportSenadaMatrixToExcel, parseSenadaExcel, downloadSenadaTemplate
} from '../../services/excel';
import {
  Layers, Calendar, ChevronLeft, ChevronRight, Download,
  Filter, Search, UserCheck, RefreshCw, CheckCircle2,
  PieChart, BarChart3, Users, Upload, FileSpreadsheet,
  Grid, List, Sparkles, Check, AlertCircle, X, ShieldAlert
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { AdminLoginModal } from '../auth/AdminLoginModal';

export const SenadaManagement: React.FC = () => {
  const { currentUser, addToast, refreshData } = useAuth();
  const isAdmin = currentUser ? isAdminRole(currentUser.role) : false;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  // View Mode: 'MATRIX' (Tampilan Jadwal Per Tanggal 1..31) vs 'DAILY' (Evaluasi & Plotting Harian)
  const [viewMode, setViewMode] = useState<'MATRIX' | 'DAILY'>('MATRIX');

  // Month & Year state
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Daily Detail Date Picker
  const [selectedDailyDate, setSelectedDailyDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  // Filters
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');
  const [searchEmployee, setSearchEmployee] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Single Cell Edit Modal
  const [cellEditModal, setCellEditModal] = useState<{
    user: User;
    date: string;
    dayNumber: number;
    shiftCode: string;
    currentCategory: SenadaCategory | null;
  } | null>(null);

  // Bulk Assign Modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkDate, setBulkDate] = useState(() => selectedDailyDate);
  const [bulkTeamId, setBulkTeamId] = useState('ALL');
  const [bulkTargetCategory, setBulkTargetCategory] = useState<SenadaCategory>('PM');

  // Storage Data
  const allUsers = storageService.getUsers().filter(u => u.role === 'PETUGAS' && u.status === 'Aktif');
  const allTeams = storageService.getTeams().filter(t => t.type === 'PETUGAS');
  const schedules = storageService.getSchedules();
  const [assignments, setAssignments] = useState<SenadaAssignment[]>(() =>
    storageService.getSenadaAssignments()
  );

  const reloadData = () => {
    setAssignments(storageService.getSenadaAssignments());
    refreshData();
  };

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Helper date string
  const getDateStr = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Days in selected month
  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const daysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  // Filtered Users List
  const displayOfficers = useMemo(() => {
    return allUsers.filter(user => {
      const matchTeam = selectedTeamFilter === 'ALL' || user.teamId === selectedTeamFilter;
      const matchSearch =
        searchEmployee === '' ||
        user.name.toLowerCase().includes(searchEmployee.toLowerCase()) ||
        user.npp.toLowerCase().includes(searchEmployee.toLowerCase());
      return matchTeam && matchSearch;
    });
  }, [allUsers, selectedTeamFilter, searchEmployee]);

  // Monthly stats for Kategori Senada
  const monthlyStats = useMemo(() => {
    let pmTotal = 0;
    let ipTotal = 0;
    let imTotal = 0;
    let totalAssigned = 0;
    let totalWorkingSlots = 0;

    daysArray.forEach(d => {
      const dateStr = getDateStr(d);
      allUsers.forEach(u => {
        const sched = schedules.find(s => s.userId === u.id && s.date === dateStr);
        const shiftCode = sched ? sched.shiftCode : 'X';
        const isOff = ['X', 'C', 'I', 'S'].includes(shiftCode);
        if (!isOff) {
          totalWorkingSlots++;
          const senada = assignments.find(a => a.userId === u.id && a.date === dateStr);
          if (senada) {
            totalAssigned++;
            if (senada.category === 'PM') pmTotal++;
            else if (senada.category === 'IP') ipTotal++;
            else if (senada.category === 'IM') imTotal++;
          }
        }
      });
    });

    const coveragePct = totalWorkingSlots > 0 ? Math.round((totalAssigned / totalWorkingSlots) * 100) : 0;

    return {
      pmTotal,
      ipTotal,
      imTotal,
      totalAssigned,
      totalWorkingSlots,
      unassignedSlots: totalWorkingSlots - totalAssigned,
      coveragePct,
    };
  }, [daysArray, allUsers, schedules, assignments, year, month]);

  // Daily tallies for each day in the month
  const dailyTallies = useMemo(() => {
    const map: Record<number, { pm: number; ip: number; im: number; unassigned: number; totalWorking: number }> = {};
    daysArray.forEach(day => {
      const dateStr = getDateStr(day);
      let pm = 0;
      let ip = 0;
      let im = 0;
      let totalWorking = 0;

      allUsers.forEach(u => {
        const sched = schedules.find(s => s.userId === u.id && s.date === dateStr);
        const shiftCode = sched ? sched.shiftCode : 'X';
        const isOff = ['X', 'C', 'I', 'S'].includes(shiftCode);
        if (!isOff) {
          totalWorking++;
          const senada = assignments.find(a => a.userId === u.id && a.date === dateStr);
          if (senada?.category === 'PM') pm++;
          else if (senada?.category === 'IP') ip++;
          else if (senada?.category === 'IM') im++;
        }
      });

      map[day] = {
        pm,
        ip,
        im,
        unassigned: totalWorking - (pm + ip + im),
        totalWorking,
      };
    });
    return map;
  }, [daysArray, allUsers, schedules, assignments, year, month]);

  // Click handler on matrix cell
  const handleCellClick = (user: User, day: number) => {
    const dateStr = getDateStr(day);
    const sched = schedules.find(s => s.userId === user.id && s.date === dateStr);
    const shiftCode = sched ? sched.shiftCode : 'X';
    const isOff = ['X', 'C', 'I', 'S'].includes(shiftCode);

    if (isOff) {
      addToast(`${user.name} berstatus Libur / Cuti (${shiftCode}) pada tanggal ${day}. Kategori hanya melekat pada jadwal dinas aktif.`, 'info');
      return;
    }

    if (!isAdmin) {
      addToast('Plotting dan perubahan Kategori Senada hanya dapat dilakukan oleh akun berstatus Administrator.', 'warning');
      setIsAdminLoginModalOpen(true);
      return;
    }

    const senada = assignments.find(a => a.userId === user.id && a.date === dateStr);
    setCellEditModal({
      user,
      date: dateStr,
      dayNumber: day,
      shiftCode,
      currentCategory: senada ? senada.category : null,
    });
  };

  // Set individual cell category
  const handleSaveCellCategory = (category: SenadaCategory | 'REMOVE') => {
    if (!cellEditModal || !currentUser) return;
    const { user, date, shiftCode } = cellEditModal;

    const currentList = storageService.getSenadaAssignments();
    const existingIdx = currentList.findIndex(a => a.userId === user.id && a.date === date);

    if (category === 'REMOVE') {
      if (existingIdx >= 0) {
        currentList.splice(existingIdx, 1);
        storageService.saveSenadaAssignments(currentList);
        storageService.addAuditLog({
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          action: 'Hapus Plotting Kategori Senada',
          module: 'Kategori Senada',
          notes: `Plotting Senada ${user.name} pada ${date} dihapus.`,
        });
        addToast(`Plotting kategori ${user.name} berhasil dihapus.`, 'info');
      }
    } else {
      if (existingIdx >= 0) {
        currentList[existingIdx].category = category;
        currentList[existingIdx].shiftCode = shiftCode;
        currentList[existingIdx].updatedAt = new Date().toISOString();
      } else {
        currentList.push({
          id: `sen-${user.id}-${date}`,
          userId: user.id,
          npp: user.npp,
          userName: user.name,
          teamId: user.teamId,
          date,
          shiftCode,
          category,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      storageService.saveSenadaAssignments(currentList);

      storageService.addAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'Update Kategori Senada',
        module: 'Kategori Senada',
        notes: `Kategori ${user.name} pada ${date} (Shift ${shiftCode}) diatur ke ${category}.`,
      });
      addToast(`Kategori ${user.name} tgl ${cellEditModal.dayNumber} diatur ke ${category}!`, 'success');
    }

    setCellEditModal(null);
    reloadData();
  };

  // Auto-Distribute Categories proportionally for a selected date
  const handleAutoDistribute = (targetDate: string) => {
    if (!isAdmin || !currentUser) return;

    const workingOfficers = allUsers.filter(user => {
      const s = schedules.find(sc => sc.userId === user.id && sc.date === targetDate);
      const code = s ? s.shiftCode : 'X';
      return !['X', 'C', 'I', 'S'].includes(code);
    });

    if (workingOfficers.length === 0) {
      addToast(`Tidak ada petugas dinas aktif pada tanggal ${targetDate}.`, 'warning');
      return;
    }

    // Proportional standard distribution: ~45% PM, ~30% IP, ~25% IM
    const currentList = storageService.getSenadaAssignments();
    const categoriesPattern: SenadaCategory[] = ['PM', 'IP', 'IM', 'PM', 'IP', 'PM', 'IM', 'PM'];

    workingOfficers.forEach((user, idx) => {
      const sched = schedules.find(s => s.userId === user.id && s.date === targetDate);
      const shiftCode = sched ? sched.shiftCode : 'P1';
      const assignedCat = categoriesPattern[idx % categoriesPattern.length];

      const existingIdx = currentList.findIndex(a => a.userId === user.id && a.date === targetDate);
      if (existingIdx >= 0) {
        currentList[existingIdx].category = assignedCat;
        currentList[existingIdx].shiftCode = shiftCode;
        currentList[existingIdx].updatedAt = new Date().toISOString();
      } else {
        currentList.push({
          id: `sen-${user.id}-${targetDate}`,
          userId: user.id,
          npp: user.npp,
          userName: user.name,
          teamId: user.teamId,
          date: targetDate,
          shiftCode,
          category: assignedCat,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    storageService.saveSenadaAssignments(currentList);
    storageService.addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Auto-Distribusi Kategori Senada',
      module: 'Kategori Senada',
      notes: `Auto-distribusi cerdas ${workingOfficers.length} petugas dinas pada tanggal ${targetDate}.`,
    });

    reloadData();
    addToast(`Berhasil mendistribusikan kategori untuk ${workingOfficers.length} petugas aktif pada tanggal ${targetDate}!`, 'success');
  };

  // Bulk assign per team
  const handleBulkAssign = () => {
    if (!isAdmin || !currentUser) return;

    const workingOfficers = allUsers.filter(user => {
      const matchTeam = bulkTeamId === 'ALL' || user.teamId === bulkTeamId;
      if (!matchTeam) return false;
      const s = schedules.find(sc => sc.userId === user.id && sc.date === bulkDate);
      const code = s ? s.shiftCode : 'X';
      return !['X', 'C', 'I', 'S'].includes(code);
    });

    if (workingOfficers.length === 0) {
      addToast(`Tidak ada petugas aktif pada tim terpilih di tanggal ${bulkDate}.`, 'warning');
      return;
    }

    const currentList = storageService.getSenadaAssignments();

    workingOfficers.forEach(w => {
      const sched = schedules.find(s => s.userId === w.id && s.date === bulkDate);
      const shiftCode = sched ? sched.shiftCode : 'P1';

      const existingIdx = currentList.findIndex(a => a.userId === w.id && a.date === bulkDate);
      if (existingIdx >= 0) {
        currentList[existingIdx].category = bulkTargetCategory;
        currentList[existingIdx].shiftCode = shiftCode;
        currentList[existingIdx].updatedAt = new Date().toISOString();
      } else {
        currentList.push({
          id: `sen-${w.id}-${bulkDate}`,
          userId: w.id,
          npp: w.npp,
          userName: w.name,
          teamId: w.teamId,
          date: bulkDate,
          shiftCode,
          category: bulkTargetCategory,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    storageService.saveSenadaAssignments(currentList);

    storageService.addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Bulk Plotting Kategori Senada',
      module: 'Kategori Senada',
      notes: `Plotting masal ${workingOfficers.length} petugas ke kategori ${bulkTargetCategory} pada tanggal ${bulkDate}`,
    });

    setIsBulkModalOpen(false);
    reloadData();
    addToast(`Berhasil memplotkan ${workingOfficers.length} petugas ke ${bulkTargetCategory}!`, 'success');
  };

  // Import from Excel
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await parseSenadaExcel(file, allUsers);
      if (result.assignments.length === 0) {
        addToast('Tidak ada data penugasan Senada yang valid di file Excel.', 'error');
        return;
      }

      const currentList = storageService.getSenadaAssignments();
      result.assignments.forEach((newItem: SenadaAssignment) => {
        const existingIdx = currentList.findIndex(
          a => a.userId === newItem.userId && a.date === newItem.date
        );
        if (existingIdx >= 0) {
          currentList[existingIdx].category = newItem.category;
          currentList[existingIdx].updatedAt = new Date().toISOString();
        } else {
          currentList.push(newItem);
        }
      });

      storageService.saveSenadaAssignments(currentList);

      storageService.addAuditLog({
        userId: currentUser?.id || 'admin',
        userName: currentUser?.name || 'Administrator',
        userRole: currentUser?.role || 'KOORDINATOR',
        action: 'Import Kategori Senada',
        module: 'Kategori Senada',
        notes: `Berhasil mengimpor ${result.assignments.length} penugasan kategori Senada dari file ${file.name}`,
      });

      addToast(`Berhasil mengimpor ${result.assignments.length} plotting kategori Senada!`, 'success');
      reloadData();
    } catch (err: any) {
      addToast(`Gagal mengimpor Excel: ${err?.message || 'Format tidak sesuai'}`, 'error');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Export to Excel (Full monthly schedule matrix)
  const handleExport = () => {
    exportSenadaMatrixToExcel(
      assignments,
      schedules,
      displayOfficers,
      year,
      month,
      `Jadwal_Kategori_Senada_${year}_${month + 1}.xlsx`
    );
    addToast('File matriks jadwal Kategori Senada berhasil diunduh.', 'success');
  };

  // Active working officers for selected daily date (for Daily View)
  const workingOfficersDaily = useMemo(() => {
    return displayOfficers.map(user => {
      const schedule = schedules.find(s => s.userId === user.id && s.date === selectedDailyDate);
      const shiftCode = schedule ? schedule.shiftCode : 'X';
      const isOffOrLeave = ['X', 'C', 'I', 'S'].includes(shiftCode);
      const senadaItem = assignments.find(a => a.userId === user.id && a.date === selectedDailyDate);

      return {
        user,
        shiftCode,
        isOffOrLeave,
        senadaCategory: senadaItem ? senadaItem.category : null,
      };
    });
  }, [displayOfficers, schedules, assignments, selectedDailyDate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hidden File Input for Excel Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportExcel}
        accept=".xlsx, .xls"
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-semibold mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Manajemen Kanal &amp; Layanan Senada</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Kategori Senada
          </h2>
          <p className="text-xs text-slate-500">
            Penugasan kanal layanan (PM, IP, IM) berformat jadwal per tanggal yang melekat langsung pada jadwal masuk petugas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => {
                  setBulkDate(getDateStr(new Date().getDate()));
                  setIsBulkModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Plotting Masal</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold shadow-2xs transition"
                title="Import data plotting Kategori Senada dari file Excel (.xlsx)"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isImporting ? 'Mengimpor...' : 'Import Excel'}</span>
              </button>

              <button
                type="button"
                onClick={downloadSenadaTemplate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition"
                title="Download format template Excel untuk import Kategori Senada"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Template Excel</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Matriks Excel</span>
          </button>
        </div>
      </div>

      {/* Metric Cards of Monthly Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">PM (Permintaan &amp; Info)</span>
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{monthlyStats.pmTotal} Slot</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Bulan {MONTH_NAMES_ID[month]} {year}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-blue-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800">IP (Info &amp; Pengaduan)</span>
            <span className="w-3 h-3 rounded-full bg-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">{monthlyStats.ipTotal} Slot</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Bulan {MONTH_NAMES_ID[month]} {year}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-amber-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">IM (Info Permintaan)</span>
            <span className="w-3 h-3 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">{monthlyStats.imTotal} Slot</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Bulan {MONTH_NAMES_ID[month]} {year}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Cakupan Plotting Bulanan</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">{monthlyStats.coveragePct}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {monthlyStats.unassignedSlots > 0
              ? `${monthlyStats.unassignedSlots} slot dinas belum diplot`
              : 'Semua jadwal masuk terploting'}
          </div>
        </div>
      </div>

      {/* Navigation, View Toggle & Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* View Mode Toggle: Matriks Per Tanggal vs Detail Harian */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl max-w-sm">
            <button
              type="button"
              onClick={() => setViewMode('MATRIX')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-bold rounded-lg transition ${
                viewMode === 'MATRIX'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Jadwal Per Tanggal (1-{daysInMonth})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('DAILY')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-bold rounded-lg transition ${
                viewMode === 'DAILY'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Evaluasi Harian</span>
            </button>
          </div>

          {/* Month Navigator (for Matrix Mode) or Date Picker (for Daily Mode) */}
          {viewMode === 'MATRIX' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                title="Bulan sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 min-w-[170px] justify-center">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>
                  {MONTH_NAMES_ID[month]} {year}
                </span>
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                title="Bulan berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-3 py-2 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition"
              >
                Bulan Ini
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">Tanggal:</label>
              <input
                type="date"
                value={selectedDailyDate}
                onChange={e => setSelectedDailyDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleAutoDistribute(selectedDailyDate)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 rounded-xl text-xs font-bold transition"
                  title="Auto-ploting cerdas proporsional PM / IP / IM untuk petugas aktif di tanggal ini"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Auto-Distribusi</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filter Bar */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          {/* Team Filter */}
          <div>
            <select
              value={selectedTeamFilter}
              onChange={e => setSelectedTeamFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
            >
              <option value="ALL">Semua Team Petugas (Team 1-6)</option>
              {allTeams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Petugas / NPP */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchEmployee}
              onChange={e => setSearchEmployee(e.target.value)}
              placeholder="Cari nama personil atau NPP..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400"
            />
          </div>

          {/* Quick Info & Notice */}
          <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Kategori otomatis melekat saat petugas berdinas.</span>
          </div>
        </div>
      </div>

      {/* Legend Badges */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Keterangan Kategori:
          </span>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span>PM</span>
            <span className="font-normal text-[11px] text-emerald-700">= Permintaan &amp; Informasi</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>IP</span>
            <span className="font-normal text-[11px] text-blue-700">= Informasi &amp; Pengaduan</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
            <span>IM</span>
            <span className="font-normal text-[11px] text-amber-700">= Informasi Permintaan</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span>X / Cuti</span>
            <span className="font-normal text-[11px] text-slate-500">= Libur / Lepas Piket</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold border-dashed">
            <span>?</span>
            <span className="font-normal text-[11px] text-rose-600">= Dinas Belum Diploting</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400">
          {isAdmin ? 'Klik sel bertugas untuk mengubah kategori' : 'Hanya Admin yang dapat mengubah plotting'}
        </div>
      </div>

      {/* VIEW MODE 1: MATRIX JADWAL PER TANGGAL (1..31) */}
      {viewMode === 'MATRIX' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto max-h-[620px] relative">
            <table className="w-full text-xs border-collapse">
              {/* Sticky Table Header */}
              <thead className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-xs">
                <tr>
                  <th className="sticky left-0 z-30 bg-slate-100 p-3 min-w-[210px] text-left font-bold text-slate-800 border-r border-slate-200">
                    Petugas / NPP / Tim
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
                        className={`py-2 px-1 min-w-[46px] text-center border-r border-slate-200/60 font-semibold ${
                          isCurrentDay
                            ? 'bg-teal-100 text-teal-900 font-black ring-1 ring-teal-400 ring-inset'
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

              {/* Table Body */}
              <tbody className="divide-y divide-slate-200/70 text-slate-700">
                {displayOfficers.length === 0 ? (
                  <tr>
                    <td colSpan={daysInMonth + 1} className="py-12 text-center text-slate-400">
                      Tidak ada data petugas yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  displayOfficers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition">
                      {/* Sticky Left Identity Column */}
                      <td className="sticky left-0 z-10 bg-white p-2.5 border-r border-slate-200 flex items-center justify-between gap-2 shadow-xs">
                        <div className="truncate">
                          <div className="font-bold text-slate-800 truncate">{user.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {user.npp} &bull; {user.teamId}
                          </div>
                        </div>
                      </td>

                      {/* Day Cells 1..daysInMonth */}
                      {daysArray.map(day => {
                        const dateStr = getDateStr(day);
                        const sched = schedules.find(s => s.userId === user.id && s.date === dateStr);
                        const shiftCode = sched ? sched.shiftCode : 'X';
                        const isOffOrLeave = ['X', 'C', 'I', 'S'].includes(shiftCode);
                        const senada = assignments.find(a => a.userId === user.id && a.date === dateStr);
                        const category = senada?.category;

                        return (
                          <td
                            key={day}
                            onClick={() => handleCellClick(user, day)}
                            className={`p-1 text-center border-r border-slate-100 select-none ${
                              !isOffOrLeave && isAdmin ? 'cursor-pointer hover:scale-105 transition-transform' : ''
                            }`}
                          >
                            {isOffOrLeave ? (
                              <div
                                title={`Libur / Lepas Dinas (${shiftCode})`}
                                className="w-full py-1.5 rounded text-center text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200/60"
                              >
                                {shiftCode}
                              </div>
                            ) : category ? (
                              <div
                                title={`Kategori: ${category} | Sift: ${shiftCode} - Klik untuk mengubah`}
                                className={`w-full py-1 rounded text-center border font-bold shadow-2xs ${
                                  category === 'PM'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : category === 'IP'
                                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                                    : 'bg-amber-100 text-amber-800 border-amber-300'
                                }`}
                              >
                                <div className="text-[11px] leading-tight font-black">{category}</div>
                                <div className="text-[8px] opacity-75 leading-none font-mono font-medium">
                                  {shiftCode}
                                </div>
                              </div>
                            ) : (
                              <div
                                title={`Dinas Aktif (${shiftCode}) - Belum Diplot Kategori Senada! Klik untuk memplot.`}
                                className="w-full py-1 rounded text-center border border-dashed border-rose-300 bg-rose-50 text-rose-600 font-bold"
                              >
                                <div className="text-[11px] leading-tight font-black">?</div>
                                <div className="text-[8px] opacity-75 leading-none font-mono font-medium">
                                  {shiftCode}
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>

              {/* Table Footer: Daily Tallies (Rekapitulasi Harian) */}
              <tfoot className="sticky bottom-0 z-20 bg-slate-100 border-t-2 border-slate-300 shadow-md">
                <tr>
                  <td className="sticky left-0 z-30 bg-slate-100 p-2.5 font-bold text-slate-800 border-r border-slate-200">
                    <div className="text-xs font-bold text-slate-800">Rekap Plotting Harian</div>
                    <div className="text-[10px] text-slate-500 font-normal">Total Petugas / Kategori</div>
                  </td>
                  {daysArray.map(day => {
                    const tally = dailyTallies[day];
                    return (
                      <td key={day} className="p-1 text-center border-r border-slate-200 bg-slate-100/95">
                        <div className="space-y-0.5">
                          <div
                            className="text-[9px] font-bold text-emerald-800 leading-tight"
                            title={`PM: ${tally.pm} Petugas`}
                          >
                            PM:{tally.pm}
                          </div>
                          <div
                            className="text-[9px] font-bold text-blue-800 leading-tight"
                            title={`IP: ${tally.ip} Petugas`}
                          >
                            IP:{tally.ip}
                          </div>
                          <div
                            className="text-[9px] font-bold text-amber-800 leading-tight"
                            title={`IM: ${tally.im} Petugas`}
                          >
                            IM:{tally.im}
                          </div>
                          <div className="text-[8px] text-slate-400 font-mono border-t border-slate-200 pt-0.5">
                            {tally.totalWorking} org
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: DETAIL EVALUASI HARIAN */}
      {viewMode === 'DAILY' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Detail Petugas Bertugas Pada Tanggal {selectedDailyDate}
              </h3>
              <p className="text-xs text-slate-500">
                Plotting kanal layanan per individu untuk evaluasi harian.
              </p>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => handleAutoDistribute(selectedDailyDate)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Distribusi Tanggal Ini</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Petugas</th>
                  <th className="py-3 px-4">NPP</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4 text-center">Shift Dinas</th>
                  <th className="py-3 px-4 text-center">Kategori Senada</th>
                  <th className="py-3 px-4 text-center">Aksi Mapping</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {workingOfficersDaily.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Tidak ada data petugas yang sesuai filter pada tanggal ini.
                    </td>
                  </tr>
                ) : (
                  workingOfficersDaily.map((item, idx) => (
                    <tr key={item.user.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{item.user.name}</td>
                      <td className="py-3 px-4 font-mono">{item.user.npp}</td>
                      <td className="py-3 px-4">{item.user.teamId}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-extrabold border ${
                            item.isOffOrLeave
                              ? 'bg-slate-100 text-slate-500 border-slate-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {item.shiftCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.isOffOrLeave ? (
                          <span className="text-[10px] text-slate-400 italic">Libur / Cuti ({item.shiftCode})</span>
                        ) : item.senadaCategory ? (
                          <span
                            className={`inline-block px-3 py-1 rounded-lg text-xs font-black ${
                              item.senadaCategory === 'PM'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.senadaCategory === 'IP'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.senadaCategory} &bull;{' '}
                            {SENADA_CATEGORIES.find(c => c.code === item.senadaCategory)?.name || item.senadaCategory}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold">
                            Belum Diplot
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isAdmin && !item.isOffOrLeave ? (
                          <div className="flex items-center justify-center gap-1.5">
                            {(['PM', 'IP', 'IM'] as SenadaCategory[]).map(cat => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  setCellEditModal({
                                    user: item.user,
                                    date: selectedDailyDate,
                                    dayNumber: parseInt(selectedDailyDate.split('-')[2], 10),
                                    shiftCode: item.shiftCode,
                                    currentCategory: item.senadaCategory,
                                  });
                                  handleSaveCellCategory(cat);
                                }}
                                className={`px-2 py-1 rounded text-xs font-bold transition border ${
                                  item.senadaCategory === cat
                                    ? 'bg-teal-600 text-white border-teal-700 shadow-2xs'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Single Cell Edit Category */}
      {cellEditModal && (
        <Modal
          isOpen={!!cellEditModal}
          onClose={() => setCellEditModal(null)}
          title="Atur Kategori Senada Petugas"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="font-bold text-slate-800 text-sm">{cellEditModal.user.name}</div>
              <div className="text-slate-500 font-mono">
                NPP: {cellEditModal.user.npp} &bull; {cellEditModal.user.teamId}
              </div>
              <div className="text-slate-600 pt-1 border-t border-slate-200/60 mt-1 flex items-center justify-between">
                <span>Tanggal: <strong>{cellEditModal.date}</strong></span>
                <span>Shift Masuk: <strong className="text-teal-700">{cellEditModal.shiftCode}</strong></span>
              </div>
            </div>

            <p className="text-slate-600">
              Pilih kanal layanan Senada untuk petugas ini pada tanggal <strong>{cellEditModal.date}</strong>. Kategori ini akan melekat langsung pada jadwal masuk petugas.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSaveCellCategory('PM')}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                  cellEditModal.currentCategory === 'PM'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                }`}
              >
                <div>
                  <div className="font-bold text-emerald-800">PM - Permintaan dan Informasi</div>
                  <div className="text-[11px] text-slate-500">Menangani seluruh permintaan administrasi &amp; informasi umum pelanggan</div>
                </div>
                {cellEditModal.currentCategory === 'PM' && <Check className="w-5 h-5 text-emerald-600 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => handleSaveCellCategory('IP')}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                  cellEditModal.currentCategory === 'IP'
                    ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                <div>
                  <div className="font-bold text-blue-800">IP - Informasi dan Pengaduan</div>
                  <div className="text-[11px] text-slate-500">Menangani penanganan keluhan dan pengaduan kendala operasional</div>
                </div>
                {cellEditModal.currentCategory === 'IP' && <Check className="w-5 h-5 text-blue-600 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => handleSaveCellCategory('IM')}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                  cellEditModal.currentCategory === 'IM'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
                }`}
              >
                <div>
                  <div className="font-bold text-amber-800">IM - Informasi Permintaan</div>
                  <div className="text-[11px] text-slate-500">Merespon klarifikasi dan rincian tindak lanjut permintaan</div>
                </div>
                {cellEditModal.currentCategory === 'IM' && <Check className="w-5 h-5 text-amber-600 shrink-0" />}
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              {cellEditModal.currentCategory && (
                <button
                  type="button"
                  onClick={() => handleSaveCellCategory('REMOVE')}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition"
                >
                  Hapus Plotting
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setCellEditModal(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Bulk Assign */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Plotting Masal Kategori Senada"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Pilih target tanggal, team, dan kategori Senada yang ingin diterapkan untuk seluruh petugas yang berdinas aktif.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tanggal Dinas *</label>
            <input
              type="date"
              value={bulkDate}
              onChange={e => setBulkDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Team *</label>
            <select
              value={bulkTeamId}
              onChange={e => setBulkTeamId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="ALL">Semua Petugas Aktif Dinas</option>
              {allTeams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kategori Senada *</label>
            <select
              value={bulkTargetCategory}
              onChange={e => setBulkTargetCategory(e.target.value as SenadaCategory)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            >
              <option value="PM">PM - Permintaan dan Informasi</option>
              <option value="IP">IP - Informasi dan Pengaduan</option>
              <option value="IM">IM - Informasi Permintaan</option>
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
              onClick={handleBulkAssign}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-sm"
            >
              Terapkan Plotting Masal
            </button>
          </div>
        </div>
      </Modal>

      {/* Admin Login Modal for unauthorized edits */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onSuccess={() => {
          setIsAdminLoginModalOpen(false);
          reloadData();
        }}
      />
    </div>
  );
};
