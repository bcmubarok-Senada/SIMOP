import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { AuditLog, User } from '../../types';
import { getRoleBadgeClass, isMasterRole } from '../../utils/constants';
import {
  FileText, Search, Filter, ShieldCheck, Clock,
  Calendar, User as UserIcon, ArrowRight, Download,
  RefreshCw, Crown, Activity, Layers, CheckCircle2,
  Users, AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const AuditLogPage: React.FC = () => {
  const { currentUser, addToast } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState('ALL');
  const [filterUser, setFilterUser] = useState('ALL');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterTimeRange, setFilterTimeRange] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLogs = () => {
    setIsRefreshing(true);
    const auditLogs = storageService.getAuditLogs();
    const allUsers = storageService.getUsers();
    setLogs(auditLogs);
    setUsers(allUsers);
    setTimeout(() => setIsRefreshing(false), 300);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const isMaster = isMasterRole(currentUser?.role || '');

  // Extract distinct modules from logs
  const modules = useMemo(() => {
    const set = new Set(logs.map(l => l.module));
    return Array.from(set).filter(Boolean);
  }, [logs]);

  // Statistics calculation
  const stats = useMemo(() => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const todayLogs = logs.filter(l => new Date(l.timestamp).getTime() >= oneDayAgo);

    const activeUserIds = new Set(logs.map(l => l.userId));

    // Count by module to find most active
    const moduleCounts: Record<string, number> = {};
    logs.forEach(l => {
      moduleCounts[l.module] = (moduleCounts[l.module] || 0) + 1;
    });
    let topModule = '-';
    let topModuleCount = 0;
    Object.entries(moduleCounts).forEach(([mod, count]) => {
      if (count > topModuleCount) {
        topModuleCount = count;
        topModule = mod;
      }
    });

    return {
      total: logs.length,
      today: todayLogs.length,
      uniqueUsers: activeUserIds.size,
      topModule,
    };
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const now = Date.now();
    return logs.filter(item => {
      // Module filter
      if (filterModule !== 'ALL' && item.module !== filterModule) return false;

      // User filter
      if (filterUser !== 'ALL' && item.userId !== filterUser) return false;

      // Role filter
      if (filterRole !== 'ALL' && item.userRole !== filterRole) return false;

      // Time range filter
      if (filterTimeRange !== 'ALL') {
        const itemTime = new Date(item.timestamp).getTime();
        if (filterTimeRange === 'TODAY' && now - itemTime > 24 * 60 * 60 * 1000) return false;
        if (filterTimeRange === '7DAYS' && now - itemTime > 7 * 24 * 60 * 60 * 1000) return false;
        if (filterTimeRange === '30DAYS' && now - itemTime > 30 * 24 * 60 * 60 * 1000) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchUser = item.userName?.toLowerCase().includes(q);
        const matchRole = item.userRole?.toLowerCase().includes(q);
        const matchAction = item.action?.toLowerCase().includes(q);
        const matchModule = item.module?.toLowerCase().includes(q);
        const matchNotes = item.notes?.toLowerCase().includes(q);
        const matchBefore = item.dataBefore?.toLowerCase().includes(q);
        const matchAfter = item.dataAfter?.toLowerCase().includes(q);

        if (!matchUser && !matchRole && !matchAction && !matchModule && !matchNotes && !matchBefore && !matchAfter) {
          return false;
        }
      }

      return true;
    });
  }, [logs, filterModule, filterUser, filterRole, filterTimeRange, searchQuery]);

  // Export to Excel / CSV
  const handleExportExcel = () => {
    try {
      const dataToExport = filteredLogs.map((log, idx) => ({
        No: idx + 1,
        'Waktu / Tanggal': new Date(log.timestamp).toLocaleString('id-ID'),
        'Nama Pengguna': log.userName,
        Role: log.userRole,
        'User ID': log.userId,
        Modul: log.module,
        'Aksi / Aktivitas': log.action,
        'Catatan / Keterangan': log.notes || '-',
        'Data Sebelum': log.dataBefore || '-',
        'Data Sesudah': log.dataAfter || '-',
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Log Aktivitas');

      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `SIMOP_Audit_Aktivitas_${dateStr}.xlsx`);
      addToast('Riwayat aktivitas berhasil diekspor ke Excel!', 'success');
    } catch (err) {
      addToast('Gagal mengekspor data audit.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Master Owner Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl text-white shadow-xl shadow-slate-950/20 relative overflow-hidden border border-amber-500/30">
        {/* Glow & Crown Watermark */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-4 right-6 opacity-10 pointer-events-none hidden sm:block">
          <Crown className="w-32 h-32 text-amber-300" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>{isMaster ? 'Akses Khusus Pemilik Sistem (Master Owner)' : 'Keamanan & Audit Sistem'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Riwayat Seluruh Aktivitas Pengguna
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Memantau secara langsung seluruh tindakan operasional yang dilakukan pengguna (Koordinator, TL 1–6, QA, dan Petugas), meliputi perubahan jadwal, persetujuan dinas, uji kompetensi, dan modifikasi data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={loadLogs}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-md transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Segarkan Data</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Riwayat (Excel)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Total Aktivitas
            </span>
            <span className="text-xl font-black text-slate-800">{stats.total}</span>
            <span className="text-[10px] text-slate-400 block">Terekam di sistem</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Aktivitas 24 Jam
            </span>
            <span className="text-xl font-black text-emerald-600">{stats.today}</span>
            <span className="text-[10px] text-slate-400 block">Tindakan hari ini</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Pengguna Terpantau
            </span>
            <span className="text-xl font-black text-purple-600">{stats.uniqueUsers}</span>
            <span className="text-[10px] text-slate-400 block">User aktif beraktivitas</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Modul Teraktif
            </span>
            <span className="text-sm font-black text-slate-800 truncate block max-w-[140px]" title={stats.topModule}>
              {stats.topModule}
            </span>
            <span className="text-[10px] text-amber-600 font-semibold block">Aktivitas terbanyak</span>
          </div>
        </div>
      </div>

      {/* Multi-Dimensional Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Filter Pencarian &amp; Pengelompokan:
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Menampilkan <strong>{filteredLogs.length}</strong> dari {logs.length} catatan
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari user, NPP, aksi, catatan..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Filter by Specific User */}
          <div>
            <select
              value={filterUser}
              onChange={e => setFilterUser(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">Semua Pengguna ({users.length} Akun)</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.npp} &bull; {u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Module */}
          <div>
            <select
              value={filterModule}
              onChange={e => setFilterModule(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">Semua Modul Aplikasi</option>
              {modules.map(m => (
                <option key={m} value={m}>
                  Modul: {m}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Time Range */}
          <div>
            <select
              value={filterTimeRange}
              onChange={e => setFilterTimeRange(e.target.value as any)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">Semua Rentang Waktu</option>
              <option value="TODAY">Hari Ini (24 Jam Terakhir)</option>
              <option value="7DAYS">7 Hari Terakhir</option>
              <option value="30DAYS">30 Hari Terakhir</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-36">Waktu Kejadian</th>
                <th className="py-3 px-4 w-56">Pengguna &amp; Peran</th>
                <th className="py-3 px-4 w-36">Modul Sistem</th>
                <th className="py-3 px-4 w-52">Aktivitas / Aksi</th>
                <th className="py-3 px-4">Deskripsi Perubahan &amp; Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <span>Tidak ada rekaman aktivitas yang sesuai kriteria pencarian.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {new Date(item.timestamp).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 pl-5">
                        {new Date(item.timestamp).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    {/* User */}
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {item.userName ? item.userName.charAt(0) : 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate flex items-center gap-1">
                            <span>{item.userName}</span>
                            {item.userRole === 'MASTER' && (
                              <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${getRoleBadgeClass(item.userRole)}`}>
                              {item.userRole}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {item.userId}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Module */}
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.module}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{item.action}</span>
                      </div>
                    </td>

                    {/* Notes & Diff */}
                    <td className="py-3 px-4 max-w-lg">
                      <div className="text-slate-600 leading-snug font-medium">
                        {item.notes || '-'}
                      </div>
                      {(item.dataBefore || item.dataAfter) && (
                        <div className="mt-1.5 text-[10px] p-2 bg-slate-50/90 rounded-xl border border-slate-200 font-mono text-slate-700 space-y-1">
                          {item.dataBefore && (
                            <div className="flex items-start gap-1">
                              <span className="px-1 py-0.2 bg-rose-100 text-rose-800 font-bold rounded">Sebelum:</span>
                              <span className="text-rose-900 break-all">{item.dataBefore}</span>
                            </div>
                          )}
                          {item.dataAfter && (
                            <div className="flex items-start gap-1">
                              <span className="px-1 py-0.2 bg-emerald-100 text-emerald-800 font-bold rounded">Sesudah:</span>
                              <span className="text-emerald-900 break-all">{item.dataAfter}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
