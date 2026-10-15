import React, { useState, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { Question } from '../../types';
import { isAdminRole } from '../../utils/constants';
import { exportBankSoalToExcel, downloadBankSoalTemplate, parseBankSoalExcel } from '../../services/excel';
import {
  HelpCircle, Plus, Search, Edit2, Trash2, Download,
  Upload, CheckCircle, Tag, Layers, ArrowLeft, Image as ImageIcon,
  FileSpreadsheet, X
} from 'lucide-react';
import { Modal } from '../ui/Modal';

export const QuestionBank: React.FC = () => {
  const { currentUser, addToast, refreshData, setCurrentRoute } = useAuth();
  const isAdmin = currentUser ? isAdminRole(currentUser.role) : false;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [questions, setQuestions] = useState<Question[]>(() =>
    storageService.getQuestions()
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Form Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);
  const [formType, setFormType] = useState<'PILIHAN_GANDA' | 'ESSAY'>('PILIHAN_GANDA');
  const [formText, setFormText] = useState('');
  const [formCategory, setFormCategory] = useState('Standar Operasional Prosedur');
  const [formDifficulty, setFormDifficulty] = useState<'Mudah' | 'Sedang' | 'Sulit'>('Sedang');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [formAnswer, setFormAnswer] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [formIdealAnswer, setFormIdealAnswer] = useState('');
  const [formGradingRubric, setFormGradingRubric] = useState('');
  const [formExplanation, setFormExplanation] = useState('');
  const [formError, setFormError] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const reloadData = () => {
    setQuestions(storageService.getQuestions());
    refreshData();
  };

  const categories = useMemo(() => {
    const set = new Set(questions.map(q => q.category));
    return Array.from(set);
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const qType = q.type || 'PILIHAN_GANDA';
      const matchType = filterType === 'ALL' || qType === filterType;
      const matchCat = filterCategory === 'ALL' || q.category === filterCategory;
      const matchSearch =
        q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.explanation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.idealAnswer && q.idealAnswer.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchCat && matchSearch;
    });
  }, [questions, filterType, filterCategory, searchQuery]);

  const handleOpenAdd = () => {
    setFormId(null);
    setFormType('PILIHAN_GANDA');
    setFormText('');
    setFormCategory('Standar Operasional Prosedur');
    setFormDifficulty('Sedang');
    setFormImageUrl('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setFormAnswer('A');
    setFormIdealAnswer('');
    setFormGradingRubric('');
    setFormExplanation('');
    setFormError('');
    setIsFormModalOpen(true);
  };

  const getQuestionOptions = (q: Question) => {
    if (q.options && q.options.length > 0) return q.options;
    return [
      { key: 'A' as const, text: q.optionA || '' },
      { key: 'B' as const, text: q.optionB || '' },
      { key: 'C' as const, text: q.optionC || '' },
      { key: 'D' as const, text: q.optionD || '' },
    ];
  };

  const handleOpenEdit = (q: Question) => {
    const opts = getQuestionOptions(q);
    setFormId(q.id);
    setFormType(q.type || 'PILIHAN_GANDA');
    setFormText(q.questionText);
    setFormCategory(q.category);
    setFormDifficulty(q.difficulty || 'Sedang');
    setFormImageUrl(q.imageUrl || '');
    setOptA(opts[0]?.text || q.optionA || '');
    setOptB(opts[1]?.text || q.optionB || '');
    setOptC(opts[2]?.text || q.optionC || '');
    setOptD(opts[3]?.text || q.optionD || '');
    setFormAnswer(q.correctAnswer || 'A');
    setFormIdealAnswer(q.idealAnswer || '');
    setFormGradingRubric(q.gradingRubric || '');
    setFormExplanation(q.explanation || '');
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Harap pilih file gambar (JPG, PNG, GIF, WEBP)', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      addToast('Ukuran gambar maksimal 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormImageUrl(reader.result as string);
      addToast('Gambar berhasil dilampirkan.', 'success');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formText.trim()) {
      setFormError('Teks pertanyaan wajib diisi.');
      return;
    }

    if (formType === 'PILIHAN_GANDA') {
      if (!optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
        setFormError('Untuk soal pilihan ganda, keempat opsi (A, B, C, D) wajib diisi.');
        return;
      }
    } else {
      if (!formIdealAnswer.trim()) {
        setFormError('Untuk soal essay, kunci jawaban ideal / acuan penilaian wajib diisi.');
        return;
      }
    }

    const options = formType === 'PILIHAN_GANDA' ? [
      { key: 'A' as const, text: optA.trim() },
      { key: 'B' as const, text: optB.trim() },
      { key: 'C' as const, text: optC.trim() },
      { key: 'D' as const, text: optD.trim() },
    ] : undefined;

    const questionData: Question = {
      id: formId || `q-${Date.now()}`,
      type: formType,
      questionText: formText.trim(),
      imageUrl: formImageUrl.trim() || undefined,
      category: formCategory.trim(),
      difficulty: formDifficulty,
      options,
      optionA: formType === 'PILIHAN_GANDA' ? optA.trim() : undefined,
      optionB: formType === 'PILIHAN_GANDA' ? optB.trim() : undefined,
      optionC: formType === 'PILIHAN_GANDA' ? optC.trim() : undefined,
      optionD: formType === 'PILIHAN_GANDA' ? optD.trim() : undefined,
      correctAnswer: formType === 'PILIHAN_GANDA' ? formAnswer : undefined,
      idealAnswer: formType === 'ESSAY' ? formIdealAnswer.trim() : undefined,
      gradingRubric: formType === 'ESSAY' ? formGradingRubric.trim() : undefined,
      explanation: formExplanation.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    storageService.saveQuestion(questionData);
    addToast(formId ? 'Soal berhasil diperbarui!' : 'Soal baru berhasil ditambahkan ke bank soal!', 'success');
    setIsFormModalOpen(false);
    reloadData();
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus soal ini?')) return;
    storageService.deleteQuestion(id);
    addToast('Soal berhasil dihapus.', 'info');
    reloadData();
  };

  const handleExport = () => {
    exportBankSoalToExcel(questions, 'Bank_Soal_Uji_Pemahaman.xlsx');
    addToast('Bank soal berhasil diekspor ke Excel.', 'success');
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await parseBankSoalExcel(file);
      if (result.questions.length === 0) {
        addToast('Tidak ada data soal yang valid ditemukan di file Excel.', 'error');
        return;
      }

      result.questions.forEach((q: Question) => {
        storageService.saveQuestion(q);
      });

      storageService.addAuditLog({
        userId: currentUser?.id || 'admin',
        userName: currentUser?.name || 'Administrator',
        userRole: currentUser?.role || 'TL',
        action: 'Import Soal Excel',
        module: 'Uji Pemahaman',
        notes: `Berhasil mengimpor ${result.questions.length} butir soal dari file Excel (${file.name})`,
      });

      addToast(`Berhasil mengimpor ${result.questions.length} butir soal dari Excel!`, 'success');
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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-xs font-semibold mb-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Bank Soal &amp; Kurikulum Uji Pemahaman</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Bank Soal Ujian
          </h2>
          <p className="text-xs text-slate-500">
            Koleksi soal pilihan ganda beserta kunci jawaban, gambar lampiran, dan pembahasan komprehensif.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentRoute('exams')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Ujian</span>
          </button>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Soal</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold shadow-2xs transition"
                title="Import soal dari file Excel (.xlsx)"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isImporting ? 'Mengimpor...' : 'Import Excel'}</span>
              </button>

              <button
                type="button"
                onClick={downloadBankSoalTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition"
                title="Download format template Excel untuk import soal"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Template Excel</span>
              </button>

              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari pertanyaan, kunci jawaban, pembahasan..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold"
            >
              <option value="ALL">Semua Tipe Soal (PG &amp; Essay)</option>
              <option value="PILIHAN_GANDA">Pilihan Ganda (PG)</option>
              <option value="ESSAY">Essay / Uraian</option>
            </select>
          </div>

          <div>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
            >
              <option value="ALL">Semua Kategori Materi</option>
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* List of Questions */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
            Tidak ada butir soal yang sesuai dengan kriteria filter.
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const isEssay = q.type === 'ESSAY';

            return (
              <div
                key={q.id}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-xl bg-purple-50 text-purple-700 font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            isEssay
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                          }`}
                        >
                          {isEssay ? 'Essay / Uraian' : 'Pilihan Ganda'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          {q.category}
                        </span>
                        {q.difficulty && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            &bull; Kesulitan: {q.difficulty}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm leading-snug">
                        {q.questionText}
                      </h4>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(q)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Edit Soal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(q.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Hapus Soal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Attached Image Preview in Question Card */}
                {q.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50/50 p-2 max-w-sm">
                    <img
                      src={q.imageUrl}
                      alt="Lampiran Soal"
                      className="max-h-48 w-auto object-contain rounded-lg"
                    />
                  </div>
                )}

                {/* Content: Options for PG or Rubric/Ideal for Essay */}
                {isEssay ? (
                  <div className="space-y-2 pt-1">
                    <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                        Kunci Jawaban Ideal / Acuan Penilaian:
                      </span>
                      <p className="text-slate-800 text-xs font-medium whitespace-pre-line leading-relaxed">
                        {q.idealAnswer || 'Belum ada kunci jawaban ideal.'}
                      </p>
                    </div>

                    {q.gradingRubric && (
                      <div className="p-2.5 bg-amber-50/70 border border-amber-100 rounded-xl text-[11px] text-amber-900">
                        <strong className="text-amber-950 font-bold block mb-0.5">Rubrik / Pedoman Penilaian:</strong>
                        <span>{q.gradingRubric}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {getQuestionOptions(q).map(opt => {
                      const isCorrect = opt.key === q.correctAnswer;
                      return (
                        <div
                          key={opt.key}
                          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                            isCorrect
                              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold'
                              : 'bg-slate-50/70 border-slate-100 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span>{opt.text}</span>
                          {isCorrect && (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-[11px] text-slate-600">
                    <strong className="text-slate-800">Pembahasan / Catatan: </strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Tambah / Edit Soal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={formId ? 'Edit Soal Ujian' : 'Tambah Soal ke Bank Soal'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {formError}
            </div>
          )}

          {/* Question Type Selection */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="block font-bold text-slate-800">Tipe Butir Soal *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormType('PILIHAN_GANDA')}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition ${
                  formType === 'PILIHAN_GANDA'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>Pilihan Ganda (PG)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormType('ESSAY')}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition ${
                  formType === 'ESSAY'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>Essay / Uraian</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              {formType === 'PILIHAN_GANDA'
                ? 'Soal dengan pilihan A, B, C, D dan satu kunci jawaban benar.'
                : 'Soal uraian terbuka dengan kunci jawaban acuan dan rubrik penilaian evaluasi.'}
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pertanyaan / Instruksi Soal *</label>
            <textarea
              rows={3}
              value={formText}
              onChange={e => setFormText(e.target.value)}
              placeholder={formType === 'ESSAY' ? 'Tuliskan butir soal essay / uraian atau studi kasus...' : 'Tuliskan butir pertanyaan pilihan ganda...'}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            />
          </div>

          {/* Input Gambar Soal */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                <span>Lampiran Gambar / Diagram Soal (Opsional)</span>
              </label>
              {formImageUrl && (
                <button
                  type="button"
                  onClick={() => setFormImageUrl('')}
                  className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" />
                  <span>Hapus Gambar</span>
                </button>
              )}
            </div>

            {formImageUrl ? (
              <div className="relative inline-block border border-slate-300 rounded-xl overflow-hidden bg-white p-1">
                <img
                  src={formImageUrl}
                  alt="Preview"
                  className="max-h-40 max-w-full rounded-lg object-contain"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition">
                    <Upload className="w-3.5 h-3.5 text-purple-600" />
                    <span>Upload File Gambar</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-slate-400 text-[11px]">atau masukkan tautan URL</span>
                </div>
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={e => setFormImageUrl(e.target.value)}
                  placeholder="https://contoh.com/gambar-soal.png"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kategori Materi *</label>
              <input
                type="text"
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
                placeholder="Contoh: SOP Layanan, Regulasi, Teknis Aplikasi"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tingkat Kesulitan *</label>
              <select
                value={formDifficulty}
                onChange={e => setFormDifficulty(e.target.value as 'Mudah' | 'Sedang' | 'Sulit')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="Mudah">Mudah</option>
                <option value="Sedang">Sedang</option>
                <option value="Sulit">Sulit</option>
              </select>
            </div>
          </div>

          {/* Conditional inputs for PILIHAN GANDA vs ESSAY */}
          {formType === 'PILIHAN_GANDA' ? (
            <div className="space-y-3.5 p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <span className="text-indigo-900 font-bold text-xs block">Opsi Pilihan Ganda &amp; Kunci Jawaban</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pilihan A *</label>
                  <input
                    type="text"
                    value={optA}
                    onChange={e => setOptA(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pilihan B *</label>
                  <input
                    type="text"
                    value={optB}
                    onChange={e => setOptB(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pilihan C *</label>
                  <input
                    type="text"
                    value={optC}
                    onChange={e => setOptC(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pilihan D *</label>
                  <input
                    type="text"
                    value={optD}
                    onChange={e => setOptD(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kunci Jawaban Benar *</label>
                <div className="flex gap-4">
                  {(['A', 'B', 'C', 'D'] as const).map(ans => (
                    <label key={ans} className="flex items-center gap-1.5 font-bold text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={formAnswer === ans}
                        onChange={() => setFormAnswer(ans)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Opsi {ans}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5 p-3.5 bg-purple-50/50 rounded-xl border border-purple-100">
              <span className="text-purple-900 font-bold text-xs block">Kunci Jawaban Essay &amp; Pedoman Penilaian</span>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kunci Jawaban Ideal / Acuan Penilaian *
                </label>
                <textarea
                  rows={4}
                  value={formIdealAnswer}
                  onChange={e => setFormIdealAnswer(e.target.value)}
                  placeholder="Tuliskan poin-poin jawaban yang diharapkan dari peserta..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl leading-relaxed"
                />
                <span className="text-[10px] text-slate-400">
                  Digunakan sebagai acuan evaluator saat memeriksa hasil jawaban essay peserta.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rubrik / Pedoman Bobot Penilaian (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formGradingRubric}
                  onChange={e => setFormGradingRubric(e.target.value)}
                  placeholder="Contoh: Ketepatan alur (40%), Kelengkapan poin (40%), Kesesuaian SOP (20%)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Pembahasan / Catatan Tambahan (Opsional)
            </label>
            <textarea
              rows={2}
              value={formExplanation}
              onChange={e => setFormExplanation(e.target.value)}
              placeholder="Penjelasan pembahasan atau referensi aturan terkait..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-sm"
            >
              Simpan Soal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
