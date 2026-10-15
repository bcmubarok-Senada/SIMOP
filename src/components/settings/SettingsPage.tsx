import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService, initializeDatabase } from '../../services/storage';
import { ShiftMeta } from '../../types';
import {
  Settings, Database, RotateCcw, ShieldCheck,
  CheckCircle2, Download, Upload, AlertTriangle,
  Plus, Trash2, Edit2, Search, SlidersHorizontal,
  Clock, Tag, Palette, Check, RefreshCw, HelpCircle
} from 'lucide-react';
import { Modal } from '../ui/Modal';

// Pre-configured color palettes for quick shift styling
const COLOR_PRESETS = [
  { name: 'Cyan Terang', hexBg: '#00FFFF', hexText: '#0f172a', bgClass: 'bg-[#00FFFF]', textClass: 'text-slate-900', borderClass: 'border-[#00e0e0]' },
  { name: 'Azure Lembut', hexBg: '#F0FFFF', hexText: '#0f172a', bgClass: 'bg-[#F0FFFF]', textClass: 'text-slate-900', borderClass: 'border-[#c5e6e6]' },
  { name: 'Krem Cokelat', hexBg: '#DEB887', hexText: '#1c1917', bgClass: 'bg-[#DEB887]', textClass: 'text-stone-900', borderClass: 'border-[#c49b67]' },
  { name: 'Coral / Jingga', hexBg: '#FF7F50', hexText: '#ffffff', bgClass: 'bg-[#FF7F50]', textClass: 'text-white', borderClass: 'border-[#e06638]' },
  { name: 'Ungu / Violet', hexBg: '#8A2BE2', hexText: '#ffffff', bgClass: 'bg-[#8A2BE2]', textClass: 'text-white', borderClass: 'border-[#731ec5]' },
  { name: 'Biru Langit (WFA)', hexBg: '#e0f2fe', hexText: '#0369a1', bgClass: 'bg-sky-100', textClass: 'text-sky-900', borderClass: 'border-sky-300' },
  { name: 'Hijau Emerald', hexBg: '#10b981', hexText: '#ffffff', bgClass: 'bg-emerald-500', textClass: 'text-white', borderClass: 'border-emerald-600' },
  { name: 'Hijau Forest', hexBg: '#228B22', hexText: '#ffffff', bgClass: 'bg-[#228B22]', textClass: 'text-white', borderClass: 'border-[#1a6e1a]' },
  { name: 'Kuning Amber', hexBg: '#fef3c7', hexText: '#92400e', bgClass: 'bg-amber-100', textClass: 'text-amber-900', borderClass: 'border-amber-300' },
  { name: 'Merah Crimson', hexBg: '#DC143C', hexText: '#ffffff', bgClass: 'bg-[#DC143C]', textClass: 'text-white', borderClass: 'border-[#b80e30]' },
  { name: 'Fuchsia / Pink', hexBg: '#fae8ff', hexText: '#86198f', bgClass: 'bg-fuchsia-100', textClass: 'text-fuchsia-800', borderClass: 'border-fuchsia-300' },
  { name: 'Abu Netral', hexBg: '#e2e8f0', hexText: '#334155', bgClass: 'bg-slate-200', textClass: 'text-slate-700', borderClass: 'border-slate-300' },
  { name: 'Indigo Gelap', hexBg: '#4f46e5', hexText: '#ffffff', bgClass: 'bg-indigo-600', textClass: 'text-white', borderClass: 'border-indigo-700' },
  { name: 'Teal Modern', hexBg: '#14b8a6', hexText: '#ffffff', bgClass: 'bg-teal-500', textClass: 'text-white', borderClass: 'border-teal-600' },
];

export const SettingsPage: React.FC = () => {
  const { currentUser, addToast, refreshData } = useAuth();

  // Shift definitions state
  const [shiftDefs, setShiftDefs] = useState<Record<string, ShiftMeta>>(() =>
    storageService.getShiftDefinitions()
  );

  // Search and Category filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'Shift' | 'WFA' | 'Status' | 'Custom'>('ALL');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetShiftsModalOpen, setIsResetShiftsModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Selected Shift for Edit / Delete
  const [targetShift, setTargetShift] = useState<ShiftMeta | null>(null);

  // Add / Edit Form State
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'Shift' | 'WFA' | 'Status' | 'Custom'>('Shift');
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formEndTime, setFormEndTime] = useState('17:00');
  const [formDescription, setFormDescription] = useState('');
  const [formHexBg, setFormHexBg] = useState('#00FFFF');
  const [formHexText, setFormHexText] = useState('#0f172a');
  const [formColorBg, setFormColorBg] = useState('bg-[#00FFFF]');
  const [formColorText, setFormColorText] = useState('text-slate-900');
  const [formColorBorder, setFormColorBorder] = useState('border-[#00e0e0]');

  // Reload shift definitions helper
  const reloadShifts = () => {
    setShiftDefs(storageService.getShiftDefinitions());
    refreshData();
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormCode('');
    setFormName('');
    setFormCategory('Shift');
    setFormStartTime('08:00');
    setFormEndTime('17:00');
    setFormDescription('');
    setFormHexBg('#00FFFF');
    setFormHexText('#0f172a');
    setFormColorBg('bg-[#00FFFF]');
    setFormColorText('text-slate-900');
    setFormColorBorder('border-[#00e0e0]');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (shift: ShiftMeta) => {
    setTargetShift(shift);
    setFormCode(shift.code);
    setFormName(shift.name);
    setFormCategory(shift.category);
    setFormStartTime(shift.startTime || '');
    setFormEndTime(shift.endTime || '');
    setFormDescription(shift.description || '');
    setFormHexBg(shift.hexBg || '#00FFFF');
    setFormHexText(shift.hexText || '#0f172a');
    setFormColorBg(shift.colorBg);
    setFormColorText(shift.colorText);
    setFormColorBorder(shift.colorBorder);
    setIsEditModalOpen(true);
  };

  // Open Delete Modal
  const openDeleteModal = (shift: ShiftMeta) => {
    setTargetShift(shift);
    setIsDeleteModalOpen(true);
  };

  // Handle Preset Color Pick
  const applyPresetColor = (preset: typeof COLOR_PRESETS[0]) => {
    setFormHexBg(preset.hexBg);
    setFormHexText(preset.hexText);
    setFormColorBg(preset.bgClass);
    setFormColorText(preset.textClass);
    setFormColorBorder(preset.borderClass);
  };

  // Handle Custom Hex change
  const handleCustomBgChange = (hex: string) => {
    setFormHexBg(hex);
    // Custom inline or hex style class
    setFormColorBg(`bg-[${hex}]`);
    setFormColorBorder('border-slate-300');
  };

  const handleCustomTextChange = (hex: string) => {
    setFormHexText(hex);
    setFormColorText(`text-[${hex}]`);
  };

  // Submit Add Shift
  const handleAddShift = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formCode.trim().toUpperCase();

    if (!cleanCode) {
      addToast('Kode shift wajib diisi.', 'error');
      return;
    }
    if (!formName.trim()) {
      addToast('Nama shift wajib diisi.', 'error');
      return;
    }

    const res = storageService.addShiftDefinition(
      {
        code: cleanCode,
        name: formName.trim(),
        category: formCategory,
        startTime: formStartTime || undefined,
        endTime: formEndTime || undefined,
        description: formDescription.trim() || undefined,
        colorBg: formColorBg,
        colorText: formColorText,
        colorBorder: formColorBorder,
        hexBg: formHexBg,
        hexText: formHexText,
      },
      currentUser?.name,
      currentUser?.role
    );

    if (!res.success) {
      addToast(res.message || 'Gagal menambahkan shift.', 'error');
      return;
    }

    addToast(`Shift baru [${cleanCode}] berhasil ditambahkan!`, 'success');
    setIsAddModalOpen(false);
    reloadShifts();
  };

  // Submit Edit Shift
  const handleEditShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetShift) return;

    if (!formName.trim()) {
      addToast('Nama shift wajib diisi.', 'error');
      return;
    }

    const res = storageService.updateShiftDefinition(
      targetShift.code,
      {
        name: formName.trim(),
        category: formCategory,
        startTime: formStartTime || undefined,
        endTime: formEndTime || undefined,
        description: formDescription.trim() || undefined,
        colorBg: formColorBg,
        colorText: formColorText,
        colorBorder: formColorBorder,
        hexBg: formHexBg,
        hexText: formHexText,
      },
      currentUser?.name,
      currentUser?.role
    );

    if (!res.success) {
      addToast(res.message || 'Gagal memperbarui shift.', 'error');
      return;
    }

    addToast(`Referensi shift [${targetShift.code}] berhasil diperbarui!`, 'success');
    setIsEditModalOpen(false);
    reloadShifts();
  };

  // Submit Delete Shift
  const handleDeleteShift = () => {
    if (!targetShift) return;

    const res = storageService.deleteShiftDefinition(
      targetShift.code,
      currentUser?.name,
      currentUser?.role
    );

    if (!res.success) {
      addToast(res.message || 'Gagal menghapus shift.', 'error');
      return;
    }

    addToast(`Referensi shift [${targetShift.code}] berhasil dihapus dari sistem!`, 'success');
    setIsDeleteModalOpen(false);
    reloadShifts();
  };

  // Reset Shifts to Default
  const handleResetShifts = () => {
    storageService.resetShiftDefinitions(currentUser?.name, currentUser?.role);
    addToast('Daftar referensi shift berhasil dikembalikan ke standar awal sistem.', 'success');
    setIsResetShiftsModalOpen(false);
    reloadShifts();
  };

  // Full Database Reset
  const handleResetDatabase = async () => {
    setResetting(true);
    try {
      localStorage.clear();
      await initializeDatabase();
      addToast('Database berhasil di-reset ke data bawaan awal.', 'success');
      refreshData();
      setIsResetConfirmOpen(false);
    } catch (err) {
      addToast('Gagal me-reset database.', 'error');
    } finally {
      setResetting(false);
    }
  };

  // Backup Data JSON
  const handleBackupData = () => {
    const backup: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('simop_')) {
        backup[key] = localStorage.getItem(key);
      }
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SIMOP_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Cadangan data berhasil diunduh.', 'success');
  };

  // Count active usages of targetShift in current schedules
  const activeUsageCount = useMemo(() => {
    if (!targetShift) return 0;
    const schedules = storageService.getSchedules();
    return schedules.filter(s => s.shiftCode === targetShift.code).length;
  }, [targetShift]);

  // Filtered shift definitions
  const filteredShifts = useMemo(() => {
    return Object.entries(shiftDefs).filter(([code, def]) => {
      const matchSearch =
        searchTerm === '' ||
        code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        def.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory =
        categoryFilter === 'ALL' || def.category === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [shiftDefs, searchTerm, categoryFilter]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const all = Object.values(shiftDefs);
    return {
      all: all.length,
      shift: all.filter(s => s.category === 'Shift').length,
      wfa: all.filter(s => s.category === 'WFA').length,
      status: all.filter(s => s.category === 'Status').length,
      custom: all.filter(s => s.category === 'Custom').length,
    };
  }, [shiftDefs]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-1">
          <Settings className="w-3.5 h-3.5 text-indigo-600" />
          <span>Konfigurasi &amp; Pemeliharaan Sistem</span>
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
          Pengaturan Sistem
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Kelola master referensi shift dinas (tambah &amp; kurang shift), cadangan data, dan parameter operasional.
        </p>
      </div>

      {/* SHIFT REFERENCE MANAGEMENT SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-800">
                Manajemen Referensi Shift &amp; Status Dinas
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Atur kode shift kerja, jam dinas, status cuti/libur, dan warna visual roster yang berlaku di seluruh sistem.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsResetShiftsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              title="Kembalikan referensi shift ke standar bawaan"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Shift Standar</span>
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Referensi Shift</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                categoryFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({categoryCounts.all})
            </button>
            <button
              onClick={() => setCategoryFilter('Shift')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                categoryFilter === 'Shift'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Shift Kantor/WFO ({categoryCounts.shift})
            </button>
            <button
              onClick={() => setCategoryFilter('WFA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                categoryFilter === 'WFA'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              WFA Remote ({categoryCounts.wfa})
            </button>
            <button
              onClick={() => setCategoryFilter('Status')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                categoryFilter === 'Status'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Status / Libur ({categoryCounts.status})
            </button>
            <button
              onClick={() => setCategoryFilter('Custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                categoryFilter === 'Custom'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Kustom ({categoryCounts.custom})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode atau nama shift..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Shift Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredShifts.map(([code, def]) => {
            const isProtectedX = code === 'X';

            return (
              <div
                key={code}
                className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-xs transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-12 h-8 rounded-lg flex items-center justify-center font-black text-xs border shadow-2xs transition-transform group-hover:scale-105"
                        style={{
                          backgroundColor: def.hexBg || undefined,
                          color: def.hexText || undefined,
                        }}
                      >
                        {code}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs line-clamp-1">
                          {def.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {def.category}
                          </span>
                          {def.startTime && def.endTime && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {def.startTime} - {def.endTime}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {def.description && (
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 italic">
                      "{def.description}"
                    </p>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: def.hexBg || '#e2e8f0' }}
                    />
                    <span className="text-[10px] text-slate-400 font-mono">
                      {def.hexBg || '#e2e8f0'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(def)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Edit Referensi Shift"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={isProtectedX}
                      onClick={() => openDeleteModal(def)}
                      className={`p-1.5 rounded-lg transition ${
                        isProtectedX
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                      title={isProtectedX ? 'Status Libur (X) tidak boleh dihapus' : 'Hapus / Kurang Shift'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredShifts.length === 0 && (
          <div className="py-10 text-center text-slate-400 text-xs">
            Tidak ditemukan referensi shift dengan filter pencarian saat ini.
          </div>
        )}
      </div>

      {/* DATABASE MAINTENANCE & BACKUP SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <span>Penyimpanan &amp; Cadangan Basis Data</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data operasional terpusat pada penyimpanan lokal peramban.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
              <Download className="w-4 h-4" />
              <span>Cadangkan Data (Backup)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Unduh seluruh database (user, jadwal aktif &amp; awal, referensi shift, persetujuan, bank soal, hasil ujian) dalam format JSON.
            </p>
            <button
              type="button"
              onClick={handleBackupData}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Unduh Cadangan JSON
            </button>
          </div>

          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-3">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
              <RotateCcw className="w-4 h-4" />
              <span>Reset Seluruh Basis Data</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Mengembalikan data pengguna 6 tim, jadwal awal standar, bank soal, dan persetujuan ke kondisi default sistem.
            </p>
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Reset Database
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: TAMBAH REFERENSI SHIFT */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Referensi Shift Baru"
        maxWidth="md"
      >
        <form onSubmit={handleAddShift} className="space-y-4 text-xs">
          {/* Live Preview Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Pratinjau Tampilan Roster
              </span>
              <div className="flex items-center gap-3">
                <span
                  className="w-14 h-9 rounded-lg flex items-center justify-center font-black text-sm border shadow-xs"
                  style={{ backgroundColor: formHexBg, color: formHexText }}
                >
                  {formCode.trim().toUpperCase() || 'KODE'}
                </span>
                <div>
                  <div className="font-bold text-slate-800 text-xs">
                    {formName.trim() || 'Nama Shift / Status'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {formStartTime && formEndTime ? `${formStartTime} - ${formEndTime}` : 'Jam Fleksibel'} &bull; {formCategory}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Code & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kode Shift <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={8}
                placeholder="Contoh: P6, S3, OFF"
                value={formCode}
                onChange={e => setFormCode(e.target.value.toUpperCase())}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Maksimal 8 karakter</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kategori <span className="text-rose-500">*</span>
              </label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Shift">Shift Kantor / WFO</option>
                <option value="WFA">WFA / Remote</option>
                <option value="Status">Status / Izin / Libur</option>
                <option value="Custom">Custom / Khusus</option>
              </select>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama / Keterangan Shift <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Pagi 3 (07.00 - 16.00)"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Working Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jam Mulai Dinas</label>
              <input
                type="text"
                placeholder="07:00"
                value={formStartTime}
                onChange={e => setFormStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jam Selesai Dinas</label>
              <input
                type="text"
                placeholder="16:00"
                value={formEndTime}
                onChange={e => setFormEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Color Palettes Preset */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Pilihan Palet Warna Preset</span>
              <span className="text-[10px] text-slate-400 font-normal">Klik untuk memilih</span>
            </label>
            <div className="grid grid-cols-7 gap-2">
              {COLOR_PRESETS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => applyPresetColor(preset)}
                  title={preset.name}
                  className={`h-7 rounded-lg border flex items-center justify-center transition-transform hover:scale-105 ${
                    formHexBg.toLowerCase() === preset.hexBg.toLowerCase()
                      ? 'ring-2 ring-indigo-500 ring-offset-1 scale-105'
                      : ''
                  }`}
                  style={{ backgroundColor: preset.hexBg, color: preset.hexText }}
                >
                  {formHexBg.toLowerCase() === preset.hexBg.toLowerCase() && (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Hex Color Pickers */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Warna Background
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formHexBg}
                  onChange={e => handleCustomBgChange(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                />
                <input
                  type="text"
                  value={formHexBg}
                  onChange={e => handleCustomBgChange(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono uppercase bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Warna Teks
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formHexText}
                  onChange={e => handleCustomTextChange(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                />
                <input
                  type="text"
                  value={formHexText}
                  onChange={e => handleCustomTextChange(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono uppercase bg-white"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
            <textarea
              rows={2}
              placeholder="Keterangan khusus shift..."
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition"
            >
              Simpan Shift
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT REFERENSI SHIFT */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Referensi Shift [${targetShift?.code}]`}
        maxWidth="md"
      >
        <form onSubmit={handleEditShift} className="space-y-4 text-xs">
          {/* Live Preview Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Pratinjau Hasil Perubahan
              </span>
              <div className="flex items-center gap-3">
                <span
                  className="w-14 h-9 rounded-lg flex items-center justify-center font-black text-sm border shadow-xs"
                  style={{ backgroundColor: formHexBg, color: formHexText }}
                >
                  {targetShift?.code}
                </span>
                <div>
                  <div className="font-bold text-slate-800 text-xs">
                    {formName.trim() || 'Nama Shift / Status'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {formStartTime && formEndTime ? `${formStartTime} - ${formEndTime}` : 'Jam Fleksibel'} &bull; {formCategory}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Kategori Shift</label>
            <select
              value={formCategory}
              onChange={e => setFormCategory(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="Shift">Shift Kantor / WFO</option>
              <option value="WFA">WFA / Remote</option>
              <option value="Status">Status / Izin / Libur</option>
              <option value="Custom">Custom / Khusus</option>
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama / Keterangan Shift <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Working Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jam Mulai Dinas</label>
              <input
                type="text"
                placeholder="07:00"
                value={formStartTime}
                onChange={e => setFormStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jam Selesai Dinas</label>
              <input
                type="text"
                placeholder="16:00"
                value={formEndTime}
                onChange={e => setFormEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Color Palettes Preset */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Pilihan Palet Warna Preset</span>
              <span className="text-[10px] text-slate-400 font-normal">Klik untuk memilih</span>
            </label>
            <div className="grid grid-cols-7 gap-2">
              {COLOR_PRESETS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => applyPresetColor(preset)}
                  title={preset.name}
                  className={`h-7 rounded-lg border flex items-center justify-center transition-transform hover:scale-105 ${
                    formHexBg.toLowerCase() === preset.hexBg.toLowerCase()
                      ? 'ring-2 ring-indigo-500 ring-offset-1 scale-105'
                      : ''
                  }`}
                  style={{ backgroundColor: preset.hexBg, color: preset.hexText }}
                >
                  {formHexBg.toLowerCase() === preset.hexBg.toLowerCase() && (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Hex Color Pickers */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Warna Background
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formHexBg}
                  onChange={e => handleCustomBgChange(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                />
                <input
                  type="text"
                  value={formHexBg}
                  onChange={e => handleCustomBgChange(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono uppercase bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Warna Teks
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formHexText}
                  onChange={e => handleCustomTextChange(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                />
                <input
                  type="text"
                  value={formHexText}
                  onChange={e => handleCustomTextChange(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono uppercase bg-white"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: HAPUS / KURANG SHIFT */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus / Kurangi Shift"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              Anda akan menghapus referensi shift{' '}
              <strong>[{targetShift?.code}] {targetShift?.name}</strong>.
            </div>
          </div>

          {activeUsageCount > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px]">
              <span className="font-bold text-slate-800">Catatan Penggunaan:</span> Shift ini tercatat aktif pada{' '}
              <strong className="text-indigo-600">{activeUsageCount} jadwal</strong> saat ini. Menghapus referensi ini tidak akan menghapus riwayat sebelumnya, namun kode tidak lagi tersedia untuk penginputan jadwal baru.
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDeleteShift}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs"
            >
              Hapus Shift
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: RESET SHIFTS STANDAR */}
      <Modal
        isOpen={isResetShiftsModalOpen}
        onClose={() => setIsResetShiftsModalOpen(false)}
        title="Kembalikan Referensi Shift ke Standar"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-900 flex items-start gap-3">
            <RotateCcw className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              Tindakan ini akan memulihkan seluruh daftar kode shift standar resmi (P1 - P5, WFA P1A - P4A, Libur X, Cuti C, Izin I, Sakit S, Monev M, Kegiatan K).
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsResetShiftsModalOpen(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleResetShifts}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs"
            >
              Ya, Pulihkan Standar
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: RESET DATABASE TOTAL */}
      <Modal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="Konfirmasi Reset Basis Data Total"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="text-[11px] leading-relaxed">
              Tindakan ini akan menghapus seluruh modifikasi dan mengembalikan data bawaan awal (6 Tim Petugas, Master B.C. Mubarok, Jadwal Awal, Bank Soal, Senada).
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={resetting}
              onClick={handleResetDatabase}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs"
            >
              {resetting ? 'Mereset...' : 'Ya, Reset Sekarang'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
