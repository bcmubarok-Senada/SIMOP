import React, { useState } from 'react';
import { ScheduleChangeRecord } from '../../types';
import { storageService } from '../../services/storage';
import { SHIFT_DEFINITIONS } from '../../utils/constants';
import { Modal } from '../ui/Modal';
import { History, Search, Calendar, User, ArrowRight, Clock, Filter } from 'lucide-react';

interface ScheduleHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleHistoryModal: React.FC<ScheduleHistoryModalProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const history = storageService.getScheduleHistory();

  const filteredHistory = history.filter(item => {
    if (filterType !== 'ALL' && item.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = item.userName.toLowerCase().includes(q);
      const matchNpp = item.userNpp.toLowerCase().includes(q);
      const matchDate = item.date.includes(q);
      const matchShift = item.newShift.toLowerCase().includes(q) || item.oldShift.toLowerCase().includes(q);
      if (!matchName && !matchNpp && !matchDate && !matchShift) return false;
    }
    return true;
  });

  const getShiftBadge = (code: string) => {
    const meta = SHIFT_DEFINITIONS[code];
    return (
      <span
        className="px-2 py-0.5 rounded text-[11px] font-bold border inline-block"
        style={{
          backgroundColor: meta?.colorBg ? meta.colorBg.replace('bg-', '') : '#f1f5f9',
          color: meta?.colorText ? meta.colorText.replace('text-', '') : '#334155',
          borderColor: meta?.colorBorder ? meta.colorBorder.replace('border-', '') : '#cbd5e1',
        }}
      >
        {code}
      </span>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Riwayat Perubahan Jadwal Dinas"
      maxWidth="xl"
    >
      <div className="space-y-4 text-xs">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama petugas, NPP, tanggal (YYYY-MM-DD), shift..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">Semua Perubahan</option>
              <option value="EDIT_ADMIN">Edit Langsung Admin</option>
              <option value="APPROVAL_SWAP">Tukar Jadwal Disetujui</option>
              <option value="BULK_ADMIN">Perubahan Massal</option>
            </select>
          </div>
        </div>

        {/* Total count badge */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>Menampilkan {filteredHistory.length} catatan riwayat perubahan jadwal</span>
          <span className="text-slate-400 font-mono">Tersinkronisasi Real-Time</span>
        </div>

        {/* History Table */}
        <div className="max-h-[60vh] overflow-y-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-500 font-semibold z-10">
              <tr>
                <th className="py-2.5 px-3">Waktu Diubah</th>
                <th className="py-2.5 px-3">Petugas</th>
                <th className="py-2.5 px-3">Tanggal Dinas</th>
                <th className="py-2.5 px-3 text-center">Perubahan Shift</th>
                <th className="py-2.5 px-3">Diubah Oleh</th>
                <th className="py-2.5 px-3">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-70" />
                    <p className="font-medium">Belum ada riwayat perubahan jadwal.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Setiap perubahan jadwal dinas oleh admin atau persetujuan tukar jadwal akan tercatat di sini secara otomatis.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-800">{item.userName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">NPP: {item.userNpp}</div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg">
                        <span className="font-mono text-slate-600">{item.oldShift}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="font-mono font-bold text-indigo-700">{item.newShift}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                        <User className="w-3 h-3 text-indigo-500" />
                        <span>{item.changedByName}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={item.notes}>
                      {item.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="pt-2 flex justify-between items-center text-[11px] text-slate-400">
          <span>* Catatan perubahan jadwal terproteksi dan terintegrasi audit log kedinasan.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
