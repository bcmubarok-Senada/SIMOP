import React, { useState, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { SenadaAssignment, SenadaCategory } from '../../types';
import { SENADA_CATEGORIES, isAdminRole, MONTH_NAMES_ID } from '../../utils/constants';
import { exportSenadaToExcel, parseSenadaExcel, downloadSenadaTemplate } from '../../services/excel';
import {
  Layers, Calendar, ChevronLeft, ChevronRight, Download,
  Filter, Search, UserCheck, RefreshCw, CheckCircle2,
  PieChart, BarChart3, Users, Upload, FileSpreadsheet
} from 'lucide-react';
import { Modal } from '../ui/Modal';

export const SenadaManagement: React.FC = () => {
  const { currentUser, addToast, refreshData } = useAuth();
  const isAdmin = currentUser ? isAdminRole(currentUser.role) : false;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterTeam, setFilterTeam] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk Assign Modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkTeamId, setBulkTeamId] = useState('ALL');
  const [bulkTargetCategory, setBulkTargetCategory] = useState<SenadaCategory>('PM');

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

  // Active working officers for selected date (excluding off/leave X, C, I, S)
  const workingOfficersToday = useMemo(() => {
    return allUsers.map(user => {
      const schedule = schedules.find(s => s.userId === user.id && s.date === selectedDate);
      const shiftCode = schedule ? schedule.shiftCode : 'X';
      const isOffOrLeave = ['X', 'C', 'I', 'S'].includes(shiftCode);
      const senadaItem = assignments.find(a => a.userId === user.id && a.date === selectedDate);

      return {
        user,
        shiftCode,
        isOffOrLeave,
        senadaCategory: senadaItem ? senadaItem.category : null,
      };
    });
  }, [allUsers, schedules, assignments, selectedDate]);

  // Summary counts for selected date
  const summary = useMemo(() => {
    const assigned = workingOfficersToday.filter(w => !w.isOffOrLeave && w.senadaCategory);
    const pm = assigned.filter(w => w.senadaCategory === 'PM').length;
    const ip = assigned.filter(w => w.senadaCategory === 'IP').length;
    const im = assigned.filter(w => w.senadaCategory === 'IM').length;
    const unassigned = workingOfficersToday.filter(w => !w.isOffOrLeave && !w.senadaCategory).length;
    const totalWorking = workingOfficersToday.filter(w => !w.isOffOrLeave).length;

    return {
      pm,
      ip,
      im,
      unassigned,
      totalWorking,
      pmPct: totalWorking > 0 ? Math.round((pm / totalWorking) * 100) : 0,
      ipPct: totalWorking > 0 ? Math.round((ip / totalWorking) * 100) : 0,
      imPct: totalWorking > 0 ? Math.round((im / totalWorking) * 100) : 0,
    };
  }, [workingOfficersToday]);

  // Filtered rows
  const displayOfficers = useMemo(() => {
    return workingOfficersToday.filter(item => {
      const matchTeam = filterTeam === 'ALL' || item.user.teamId === filterTeam;
      const matchCat =
        filterCategory === 'ALL' ||
        (filterCategory === 'UNASSIGNED' && !item.senadaCategory && !item.isOffOrLeave) ||
        item.senadaCategory === filterCategory;

      const matchSearch =
        item.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.user.npp.toLowerCase().includes(searchQuery.toLowerCase());

      return matchTeam && matchCat && matchSearch;
    });
  }, [workingOfficersToday, filterTeam, filterCategory, searchQuery]);

  // Set individual Senada Category
  const handleSetCategory = (userId: string, category: SenadaCategory) => {
    if (!isAdmin || !currentUser) return;
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const schedule = schedules.find(s => s.userId === userId && s.date === selectedDate);
    const shiftCode = schedule ? schedule.shiftCode : 'P1';

    const currentList = storageService.getSenadaAssignments();
    const existingIdx = currentList.findIndex(a => a.userId === userId && a.date === selectedDate);

    if (existingIdx >= 0) {
      currentList[existingIdx].category = category;
      currentList[existingIdx].updatedAt = new Date().toISOString();
    } else {
      currentList.push({
        id: `sen-${userId}-${selectedDate}`,
        userId,
        npp: user.npp,
        userName: user.name,
        teamId: user.teamId,
        date: selectedDate,
        shiftCode,
        category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    storageService.saveSenadaAssignments(currentList);
    reloadData();
    addToast(`Kategori Senada ${user.name} diatur ke ${category}`, 'success');
  };

  // Bulk assign per team
  const handleBulkAssign = () => {
    if (!isAdmin || !currentUser) return;

    const targetList = workingOfficersToday.filter(
      w => !w.isOffOrLeave && (bulkTeamId === 'ALL' || w.user.teamId === bulkTeamId)
    );

    const currentList = storageService.getSenadaAssignments();

    targetList.forEach(w => {
      const existingIdx = currentList.findIndex(a => a.userId === w.user.id && a.date === selectedDate);
      if (existingIdx >= 0) {
        currentList[existingIdx].category = bulkTargetCategory;
        currentList[existingIdx].updatedAt = new Date().toISOString();
      } else {
        currentList.push({
          id: `sen-${w.user.id}-${selectedDate}`,
          userId: w.user.id,
          npp: w.user.npp,
          userName: w.user.name,
          teamId: w.user.teamId,
          date: selectedDate,
          shiftCode: w.shiftCode,
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
      notes: `Plotting masal ${targetList.length} petugas ke kategori ${bulkTargetCategory} pada tanggal ${selectedDate}`,
    });

    setIsBulkModalOpen(false);
    reloadData();
    addToast(`Berhasil memplotkan ${targetList.length} petugas ke ${bulkTargetCategory}!`, 'success');
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
        userRole: currentUser?.role || 'TL',
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

  // Export to Excel
  const handleExport = () => {
    const listForDate = assignments.filter(a => a.date === selectedDate);
    exportSenadaToExcel(listForDate, `Senada_${selectedDate}.xlsx`);
    addToast('File rekapitulasi Kategori Senada berhasil diunduh.', 'success');
  };

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
            Penugasan kanal layanan (PM, IP, IM) terintegrasi langsung dengan jadwal aktif dinas petugas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
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
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Metric Cards of Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">PM (Permintaan &amp; Info)</span>
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{summary.pm} Orang</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{summary.pmPct}% dari dinas aktif</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-blue-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800">IP (Info &amp; Pengaduan)</span>
            <span className="w-3 h-3 rounded-full bg-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">{summary.ip} Orang</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{summary.ipPct}% dari dinas aktif</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-amber-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">IM (Info Permintaan)</span>
            <span className="w-3 h-3 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">{summary.im} Orang</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{summary.imPct}% dari dinas aktif</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Total Bertugas Hari Ini</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">{summary.totalWorking} Petugas</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {summary.unassigned > 0 ? `${summary.unassigned} belum diplot` : 'Seluruhnya terploting'}
          </div>
        </div>
      </div>

      {/* Date Bar and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Tanggal Evaluasi
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Filter Team
            </label>
            <select
              value={filterTeam}
              onChange={e => setFilterTeam(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
            >
              <option value="ALL">Semua Team (Team 1-6)</option>
              {allTeams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Filter Kategori
            </label>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="PM">PM (Permintaan &amp; Info)</option>
              <option value="IP">IP (Info &amp; Pengaduan)</option>
              <option value="IM">IM (Info Permintaan)</option>
              <option value="UNASSIGNED">Belum Diploting</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Cari Nama / NPP
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Ketik nama atau NPP..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table of Officers and Senada Category */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Petugas</th>
                <th className="py-3 px-4">NPP</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4 text-center">Shift Aktif Hari Ini</th>
                <th className="py-3 px-4 text-center">Kategori Senada</th>
                <th className="py-3 px-4 text-center">Aksi Mapping</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayOfficers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada data petugas yang sesuai filter.
                  </td>
                </tr>
              ) : (
                displayOfficers.map((item, idx) => (
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
                        <span className="text-[10px] text-slate-400 italic">Libur / Cuti</span>
                      ) : item.senadaCategory ? (
                        (() => {
                          const catInfo = SENADA_CATEGORIES.find(c => c.code === item.senadaCategory);
                          return (
                            <span
                              className={`inline-block px-3 py-1 rounded-lg text-xs font-black ${
                                catInfo?.colorBadge || 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {item.senadaCategory} &bull; {catInfo?.name || item.senadaCategory}
                            </span>
                          );
                        })()
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
                              onClick={() => handleSetCategory(item.user.id, cat)}
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

      {/* Modal: Bulk Assign */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Plotting Masal Kategori Senada"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Pilih target team dan kategori Senada yang ingin diterapkan untuk seluruh petugas yang bertugas pada tanggal{' '}
            <strong className="text-slate-800">{selectedDate}</strong>.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Team</label>
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
            <label className="block font-semibold text-slate-700 mb-1">Kategori Senada</label>
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
              Terapkan Plotting
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
