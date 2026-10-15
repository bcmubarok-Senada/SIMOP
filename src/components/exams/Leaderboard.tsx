import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { ExamSubmission } from '../../types';
import {
  Trophy, Medal, Award, Search, Filter,
  Download, ArrowLeft, Users, CheckCircle2, XCircle
} from 'lucide-react';
import { exportLeaderboardToExcel } from '../../services/excel';

export const Leaderboard: React.FC = () => {
  const { currentUser, setCurrentRoute, addToast } = useAuth();

  const exams = storageService.getExams();
  const submissions = storageService.getExamSubmissions();
  const allUsers = storageService.getUsers();
  const allTeams = storageService.getTeams();

  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Best score per user per exam or overall
  const rankedSubmissions = useMemo(() => {
    // Filter by exam if selected
    let filtered = submissions;
    if (selectedExamId !== 'ALL') {
      filtered = filtered.filter(s => s.examId === selectedExamId);
    }

    // Filter by team
    if (selectedTeamFilter !== 'ALL') {
      filtered = filtered.filter(s => s.userTeamId === selectedTeamFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.userName.toLowerCase().includes(q) ||
          s.userNpp.toLowerCase().includes(q) ||
          s.examTitle.toLowerCase().includes(q)
      );
    }

    // Keep the highest score for each user (and fastest duration as tie-breaker)
    const userBestMap = new Map<string, ExamSubmission>();

    filtered.forEach(sub => {
      const key = `${sub.userId}-${selectedExamId === 'ALL' ? 'global' : sub.examId}`;
      const existing = userBestMap.get(key);

      if (!existing) {
        userBestMap.set(key, sub);
      } else if (sub.score > existing.score) {
        userBestMap.set(key, sub);
      } else if (sub.score === existing.score && sub.durationSeconds < existing.durationSeconds) {
        userBestMap.set(key, sub);
      }
    });

    const list = Array.from(userBestMap.values());

    // Sort descending by score, then ascending by duration
    list.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.durationSeconds - b.durationSeconds;
    });

    return list;
  }, [submissions, selectedExamId, selectedTeamFilter, searchQuery]);

  const handleExport = () => {
    exportLeaderboardToExcel(rankedSubmissions, 'Leaderboard_Uji_Pemahaman.xlsx');
    addToast('Leaderboard berhasil diekspor ke Excel.', 'success');
  };

  const topThree = rankedSubmissions.slice(0, 3);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-1">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>Papan Peringkat Prestasi &amp; Kompetensi</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Leaderboard Uji Pemahaman
          </h2>
          <p className="text-xs text-slate-500">
            Perangkingan nilai terbaik personil berdasarkan hasil evaluasi Pre-Test dan Post-Test.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentRoute('exams')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Ujian</span>
          </button>

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

      {/* Podium Top 3 Cards */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Rank 2 (Silver) */}
          {topThree[1] ? (
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col items-center text-center relative overflow-hidden order-2 md:order-1">
              <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-600 flex items-center justify-center font-black text-base shadow-xs mb-2">
                2
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Juara 2 (Perak)</span>
              <h4 className="font-bold text-slate-800 text-sm mt-1">{topThree[1].userName}</h4>
              <p className="text-[11px] text-slate-500 font-mono">
                {topThree[1].userNpp} &bull; {topThree[1].userTeamId}
              </p>
              <div className="mt-3 text-2xl font-black text-slate-700">
                {topThree[1].score}{' '}
                <span className="text-xs font-normal text-slate-400">poin</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Waktu: {Math.floor(topThree[1].durationSeconds / 60)}m {topThree[1].durationSeconds % 60}s
              </span>
            </div>
          ) : (
            <div className="hidden md:block order-1" />
          )}

          {/* Rank 1 (Gold) */}
          {topThree[0] && (
            <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-50 to-white border-2 border-amber-300 shadow-md flex flex-col items-center text-center relative overflow-hidden order-1 md:order-2">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 flex items-center justify-center font-black text-xl shadow-md mb-2">
                <Trophy className="w-7 h-7 text-amber-900" />
              </div>
              <span className="text-[11px] font-black text-amber-700 uppercase tracking-wider">
                Juara 1 (Emas)
              </span>
              <h4 className="font-extrabold text-slate-900 text-base mt-1">{topThree[0].userName}</h4>
              <p className="text-xs text-slate-600 font-mono font-semibold">
                {topThree[0].userNpp} &bull; {topThree[0].userTeamId}
              </p>
              <div className="mt-3 text-3xl font-black text-amber-600">
                {topThree[0].score}{' '}
                <span className="text-sm font-normal text-slate-500">poin</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 font-medium">
                Waktu: {Math.floor(topThree[0].durationSeconds / 60)}m {topThree[0].durationSeconds % 60}s
              </span>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {topThree[2] ? (
            <div className="p-5 rounded-2xl bg-white border border-amber-200/60 shadow-xs flex flex-col items-center text-center relative overflow-hidden order-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 border-2 border-amber-300 text-amber-800 flex items-center justify-center font-black text-base shadow-xs mb-2">
                3
              </div>
              <span className="text-[10px] font-bold text-amber-700 uppercase">Juara 3 (Perunggu)</span>
              <h4 className="font-bold text-slate-800 text-sm mt-1">{topThree[2].userName}</h4>
              <p className="text-[11px] text-slate-500 font-mono">
                {topThree[2].userNpp} &bull; {topThree[2].userTeamId}
              </p>
              <div className="mt-3 text-2xl font-black text-amber-800">
                {topThree[2].score}{' '}
                <span className="text-xs font-normal text-slate-400">poin</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Waktu: {Math.floor(topThree[2].durationSeconds / 60)}m {topThree[2].durationSeconds % 60}s
              </span>
            </div>
          ) : (
            <div className="hidden md:block order-3" />
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Pilih Ujian
            </label>
            <select
              value={selectedExamId}
              onChange={e => setSelectedExamId(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
            >
              <option value="ALL">Semua Ujian</option>
              {exams.map(e => (
                <option key={e.id} value={e.id}>
                  {e.title} ({e.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Filter Team
            </label>
            <select
              value={selectedTeamFilter}
              onChange={e => setSelectedTeamFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
            >
              <option value="ALL">Semua Team</option>
              {allTeams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
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

      {/* Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4">Nama Peserta</th>
                <th className="py-3 px-4">NPP</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4">Judul Ujian</th>
                <th className="py-3 px-4 text-center">Waktu Pengerjaan</th>
                <th className="py-3 px-4 text-center">Nilai</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rankedSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Belum ada data pengerjaan ujian untuk kriteria ini.
                  </td>
                </tr>
              ) : (
                rankedSubmissions.map((sub, idx) => {
                  const rank = idx + 1;
                  let rankBadge = (
                    <span className="font-bold text-slate-500">#{rank}</span>
                  );
                  if (rank === 1) {
                    rankBadge = (
                      <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center mx-auto shadow-xs">
                        1
                      </span>
                    );
                  } else if (rank === 2) {
                    rankBadge = (
                      <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center mx-auto shadow-xs">
                        2
                      </span>
                    );
                  } else if (rank === 3) {
                    rankBadge = (
                      <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center mx-auto shadow-xs">
                        3
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={sub.id}
                      className={`hover:bg-slate-50/70 transition ${
                        sub.userId === currentUser?.id ? 'bg-indigo-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">{rankBadge}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {sub.userName}
                        {sub.userId === currentUser?.id && (
                          <span className="ml-2 text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700">
                            Anda
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono">{sub.userNpp}</td>
                      <td className="py-3 px-4">{sub.userTeamId}</td>
                      <td className="py-3 px-4 max-w-xs truncate">{sub.examTitle}</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500">
                        {Math.floor(sub.durationSeconds / 60)}m {sub.durationSeconds % 60}s
                      </td>
                      <td className="py-3 px-4 text-center font-black text-sm text-indigo-700">
                        {sub.score}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            sub.isPassed
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border-rose-200'
                          }`}
                        >
                          {sub.isPassed ? 'Lulus' : 'Tidak Lulus'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
