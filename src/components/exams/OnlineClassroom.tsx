import React, { useState, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { ClassroomMaterial, ClassroomDiscussion, Question } from '../../types';
import { isAdminRole, getRoleBadgeClass } from '../../utils/constants';
import {
  GraduationCap, BookOpen, MessageSquare, Upload, FileText,
  Presentation, Search, Plus, Trash2, Eye, Download, Send,
  HelpCircle, UserCheck, ArrowLeft, CheckCircle2, MessageCircle,
  Clock, ShieldCheck, X, ExternalLink
} from 'lucide-react';
import { Modal } from '../ui/Modal';

export const OnlineClassroom: React.FC = () => {
  const { currentUser, addToast, refreshData, setCurrentRoute } = useAuth();
  const isAdmin = currentUser ? isAdminRole(currentUser.role) : false;
  const isQa = currentUser?.role === 'QA';
  const canUploadMaterial = isAdmin || isQa || currentUser?.role === 'TL';

  // Data state
  const [activeTab, setActiveTab] = useState<'materi' | 'diskusi'>('materi');
  const [materials, setMaterials] = useState<ClassroomMaterial[]>(() =>
    storageService.getClassroomMaterials()
  );
  const [discussions, setDiscussions] = useState<ClassroomDiscussion[]>(() =>
    storageService.getClassroomDiscussions()
  );
  const questions = storageService.getQuestions();

  // Search & Filters
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialFilterType, setMaterialFilterType] = useState<string>('ALL');
  const [discussionSearch, setDiscussionSearch] = useState('');

  // Upload Material Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [matTitle, setMatTitle] = useState('');
  const [matDesc, setMatDesc] = useState('');
  const [matType, setMatType] = useState<'PDF' | 'PPT'>('PDF');
  const [matFileName, setMatFileName] = useState('');
  const [matFileSize, setMatFileSize] = useState('');
  const [matFileData, setMatFileData] = useState<string>('');
  const [matUrl, setMatUrl] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Material Viewer Modal state
  const [previewMaterial, setPreviewMaterial] = useState<ClassroomMaterial | null>(null);

  // New Discussion Form state
  const [isNewDiscussionModalOpen, setIsNewDiscussionModalOpen] = useState(false);
  const [discTopic, setDiscTopic] = useState('');
  const [discContent, setDiscContent] = useState('');
  const [discQuestionRef, setDiscQuestionRef] = useState('');
  const [discError, setDiscError] = useState('');

  // Reply textboxes state per discussion id
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  const reloadData = () => {
    setMaterials(storageService.getClassroomMaterials());
    setDiscussions(storageService.getClassroomDiscussions());
    refreshData();
  };

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchType =
        materialFilterType === 'ALL' ||
        (materialFilterType === 'PDF' && m.fileType === 'PDF') ||
        (materialFilterType === 'PPT' && (m.fileType === 'PPT' || m.fileType === 'PPTX'));
      const matchSearch =
        m.title.toLowerCase().includes(materialSearch.toLowerCase()) ||
        m.description.toLowerCase().includes(materialSearch.toLowerCase()) ||
        m.fileName.toLowerCase().includes(materialSearch.toLowerCase());
      return matchType && matchSearch;
    });
  }, [materials, materialFilterType, materialSearch]);

  // Filtered discussions
  const filteredDiscussions = useMemo(() => {
    return discussions.filter(d => {
      const q = discussionSearch.toLowerCase();
      return (
        d.topic.toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q) ||
        d.authorName.toLowerCase().includes(q) ||
        (d.questionRef && d.questionRef.toLowerCase().includes(q))
      );
    });
  }, [discussions, discussionSearch]);

  // Handle local file selection for PDF/PPT
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      setMatType('PDF');
    } else if (ext === 'ppt' || ext === 'pptx') {
      setMatType('PPT');
    } else {
      setUploadError('Hanya file PDF atau presentasi PPT/PPTX yang didukung.');
      return;
    }

    setMatFileName(file.name);
    setMatFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
    setUploadError('');

    // Read file as base64 Data URL
    const reader = new FileReader();
    reader.onload = () => {
      setMatFileData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!matTitle.trim()) {
      setUploadError('Judul materi pembelajaran wajib diisi.');
      return;
    }
    if (!matFileData && !matUrl.trim()) {
      setUploadError('Silakan unggah file dokumen atau cantumkan tautan materi.');
      return;
    }

    const finalFileName = matFileName || (matType === 'PDF' ? `${matTitle.replace(/\s+/g, '_')}.pdf` : `${matTitle.replace(/\s+/g, '_')}.pptx`);
    const finalData = matFileData || matUrl.trim();

    const newMaterial: ClassroomMaterial = {
      id: `mat-${Date.now()}`,
      title: matTitle.trim(),
      description: matDesc.trim(),
      fileType: matType,
      fileName: finalFileName,
      fileSize: matFileSize || '1.5 MB',
      fileData: finalData,
      uploadedBy: currentUser.id,
      uploadedByName: `${currentUser.name} (${currentUser.role})`,
      uploadedByRole: currentUser.role,
      uploadedAt: new Date().toISOString(),
      viewCount: 0,
    };

    storageService.saveClassroomMaterial(newMaterial);

    storageService.addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Upload Materi Kelas Online',
      module: 'Kelas Online',
      notes: `Mengunggah materi pembelajaran "${newMaterial.title}" (${newMaterial.fileType})`,
    });

    addToast(`Materi "${newMaterial.title}" berhasil diunggah dan siap diakses petugas!`, 'success');
    setIsUploadModalOpen(false);
    setMatTitle('');
    setMatDesc('');
    setMatFileName('');
    setMatFileSize('');
    setMatFileData('');
    setMatUrl('');
    setUploadError('');
    reloadData();
  };

  const handleDeleteMaterial = (id: string, title: string) => {
    if (!window.confirm(`Hapus materi "${title}" dari Kelas Online?`)) return;
    storageService.deleteClassroomMaterial(id);
    addToast('Materi berhasil dihapus.', 'info');
    reloadData();
  };

  const handleOpenMaterial = (mat: ClassroomMaterial) => {
    // Increment view count
    const updated = { ...mat, viewCount: (mat.viewCount || 0) + 1 };
    storageService.saveClassroomMaterial(updated);
    setPreviewMaterial(updated);
    reloadData();
  };

  // Discussion Actions
  const handleCreateDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!discTopic.trim() || !discContent.trim()) {
      setDiscError('Judul topik dan isi pertanyaan/diskusi wajib diisi.');
      return;
    }

    const newDisc: ClassroomDiscussion = {
      id: `disc-${Date.now()}`,
      topic: discTopic.trim(),
      content: discContent.trim(),
      questionRef: discQuestionRef.trim() || undefined,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      authorAvatar: currentUser.avatarUrl,
      createdAt: new Date().toISOString(),
      replies: [],
    };

    storageService.saveClassroomDiscussion(newDisc);

    storageService.addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Membuat Topik Diskusi Soal',
      module: 'Kelas Online',
      notes: `Membuat diskusi baru: "${newDisc.topic}"`,
    });

    addToast('Topik diskusi berhasil dipublikasikan!', 'success');
    setIsNewDiscussionModalOpen(false);
    setDiscTopic('');
    setDiscContent('');
    setDiscQuestionRef('');
    setDiscError('');
    reloadData();
  };

  const handleSendReply = (discussionId: string) => {
    if (!currentUser) return;
    const text = replyTexts[discussionId]?.trim();
    if (!text) {
      addToast('Tuliskan pesan tanggapan sebelum mengirim.', 'error');
      return;
    }

    const reply = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      content: text,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      authorAvatar: currentUser.avatarUrl,
      createdAt: new Date().toISOString(),
    };

    storageService.addDiscussionReply(discussionId, reply);
    setReplyTexts(prev => ({ ...prev, [discussionId]: '' }));
    addToast('Tanggapan berhasil dikirimkan ke forum diskusi!', 'success');
    reloadData();
  };

  const handleDeleteDiscussion = (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus topik diskusi ini?')) return;
    storageService.deleteClassroomDiscussion(id);
    addToast('Topik diskusi berhasil dihapus.', 'info');
    reloadData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5 text-indigo-200" />
              <span>Pusat Pembelajaran &amp; Diskusi Kolaboratif</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Kelas Online Uji Pemahaman
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
              Akses modul materi PDF dan slide presentasi PPT resmi, serta diskusikan butir soal uji pemahaman secara interaktif antara Petugas, Team Leader (TL), dan Quality Assurance (QA).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentRoute('exams')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition backdrop-blur-md"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Ujian</span>
            </button>

            {canUploadMaterial && (
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl text-xs font-bold shadow-md transition"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-700" />
                <span>Upload Materi (PDF/PPT)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('materi')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 transition-all relative ${
            activeTab === 'materi'
              ? 'text-indigo-600'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Materi &amp; Bahan Ajar ({materials.length})</span>
          {activeTab === 'materi' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('diskusi')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 transition-all relative ${
            activeTab === 'diskusi'
              ? 'text-indigo-600'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Forum Diskusi Soal ({discussions.length})</span>
          {activeTab === 'diskusi' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
      </div>

      {/* TAB 1: MATERI PEMBELAJARAN (PDF & PPT) */}
      {activeTab === 'materi' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex flex-1 items-center gap-2 max-w-md">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={materialSearch}
                  onChange={e => setMaterialSearch(e.target.value)}
                  placeholder="Cari materi pembelajaran, SOP, regulasi..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(['ALL', 'PDF', 'PPT'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMaterialFilterType(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    materialFilterType === type
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type === 'ALL' ? 'Semua Format' : type === 'PDF' ? 'PDF Dokumen' : 'PPT Presentasi'}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Materials */}
          {filteredMaterials.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Belum Ada Materi Pembelajaran</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Belum ada modul yang cocok dengan kriteria pencarian. Team Leader atau QA dapat mengunggah modul SOP format PDF atau PPT.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMaterials.map(mat => {
                const isPdf = mat.fileType === 'PDF';
                return (
                  <div
                    key={mat.id}
                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between hover:border-indigo-200 hover:shadow-sm transition group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isPdf
                              ? 'bg-rose-50 text-rose-600 border border-rose-100'
                              : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}
                        >
                          {isPdf ? <FileText className="w-5 h-5" /> : <Presentation className="w-5 h-5" />}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                              isPdf
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {mat.fileType}
                          </span>
                          {(canUploadMaterial || currentUser?.id === mat.uploadedBy) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMaterial(mat.id, mat.title)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Hapus Materi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-indigo-600 transition">
                          {mat.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-3 leading-relaxed">
                          {mat.description}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-[11px] text-slate-500">
                        <div className="flex items-center justify-between font-mono">
                          <span className="truncate max-w-[180px] font-sans font-medium text-slate-700">
                            {mat.fileName}
                          </span>
                          <span className="font-bold text-slate-400 shrink-0">{mat.fileSize}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/60">
                          <span>Oleh: {mat.uploadedByName}</span>
                          <span>{mat.viewCount || 0}x dibaca</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => handleOpenMaterial(mat)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Buka &amp; Akses Materi</span>
                      </button>

                      {mat.fileData && (
                        <a
                          href={mat.fileData}
                          download={mat.fileName}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                          title="Download File"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FORUM DISKUSI SOAL UJI PEMAHAMAN (PETUGAS, TL, QA) */}
      {activeTab === 'diskusi' && (
        <div className="space-y-6">
          {/* Action & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={discussionSearch}
                onChange={e => setDiscussionSearch(e.target.value)}
                placeholder="Cari topik diskusi atau referensi butir soal..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsNewDiscussionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tanya / Buka Diskusi Soal</span>
            </button>
          </div>

          {/* Discussion List */}
          {filteredDiscussions.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Belum Ada Topik Diskusi</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Petugas, TL, atau QA dapat membuka diskusi untuk mengulas butir soal uji pemahaman, regulasi, ataupun klarifikasi kunci jawaban.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredDiscussions.map(disc => {
                const isAuthor = currentUser?.id === disc.authorId;
                const canDelete = isAuthor || isAdmin;
                return (
                  <div
                    key={disc.id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
                  >
                    {/* Discussion Topic Header */}
                    <div className="p-5 border-b border-slate-100 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0 border border-indigo-100 overflow-hidden">
                            {disc.authorAvatar ? (
                              <img src={disc.authorAvatar} alt={disc.authorName} className="w-full h-full object-cover" />
                            ) : (
                              disc.authorName.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                                {disc.topic}
                              </h3>
                              {disc.questionRef && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-bold">
                                  <HelpCircle className="w-3 h-3" />
                                  <span>{disc.questionRef}</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                              <span className="font-semibold text-slate-700">{disc.authorName}</span>
                              <span className={`px-2 py-0.2 rounded-md text-[9px] font-extrabold ${getRoleBadgeClass(disc.authorRole)}`}>
                                {disc.authorRole}
                              </span>
                              <span>•</span>
                              <span>{new Date(disc.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            </div>
                          </div>
                        </div>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDiscussion(disc.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Hapus Topik"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-slate-700 leading-relaxed pl-12 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                        {disc.content}
                      </div>
                    </div>

                    {/* Replies Thread */}
                    <div className="p-5 bg-slate-50/40 space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <MessageCircle className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Tanggapan Diskusi ({disc.replies?.length || 0})</span>
                      </div>

                      {disc.replies && disc.replies.length > 0 ? (
                        <div className="space-y-3">
                          {disc.replies.map(rep => (
                            <div
                              key={rep.id}
                              className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center overflow-hidden">
                                    {rep.authorAvatar ? (
                                      <img src={rep.authorAvatar} alt={rep.authorName} className="w-full h-full object-cover" />
                                    ) : (
                                      rep.authorName.charAt(0)
                                    )}
                                  </div>
                                  <span className="font-bold text-xs text-slate-800">{rep.authorName}</span>
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${getRoleBadgeClass(rep.authorRole)}`}>
                                    {rep.authorRole}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(rep.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed pl-8">
                                {rep.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic py-1">
                          Belum ada tanggapan. Jadilah yang pertama memberikan penjelasan!
                        </div>
                      )}

                      {/* Reply Textbox Input Box */}
                      <div className="pt-2 border-t border-slate-200/60 flex items-start gap-2">
                        <textarea
                          rows={2}
                          value={replyTexts[disc.id] || ''}
                          onChange={e => setReplyTexts(prev => ({ ...prev, [disc.id]: e.target.value }))}
                          placeholder={`Tuliskan tanggapan sebagai ${currentUser?.name} (${currentUser?.role})...`}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => handleSendReply(disc.id)}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition shrink-0 flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Kirim</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: UPLOAD MATERI KELAS ONLINE (PDF / PPT) */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Materi Pembelajaran Baru"
      >
        <form onSubmit={handleSaveMaterial} className="space-y-4 text-xs">
          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {uploadError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Judul Materi Pembelajaran *</label>
            <input
              type="text"
              value={matTitle}
              onChange={e => setMatTitle(e.target.value)}
              placeholder="Contoh: SOP Pelayanan Kontak Layanan 2026"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Deskripsi Singkat *</label>
            <textarea
              rows={2}
              value={matDesc}
              onChange={e => setMatDesc(e.target.value)}
              placeholder="Jelaskan ringkasan materi, tujuan pembelajaran, dan kelompok target..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tipe Format Dokumen *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMatType('PDF')}
                className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-2 transition ${
                  matType === 'PDF'
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <FileText className="w-4 h-4 text-rose-600" />
                <span>Dokumen PDF (.pdf)</span>
              </button>

              <button
                type="button"
                onClick={() => setMatType('PPT')}
                className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-2 transition ${
                  matType === 'PPT'
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <Presentation className="w-4 h-4 text-amber-600" />
                <span>Presentasi PPT (.pptx)</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="block font-semibold text-slate-700">Unggah Berkas (PDF / PPT) *</label>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition">
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pilih File Dari Komputer</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf, .ppt, .pptx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              {matFileName && (
                <span className="text-xs text-emerald-700 font-medium">
                  {matFileName} ({matFileSize})
                </span>
              )}
            </div>
            <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
              <span>Atau masukkan tautan URL materi:</span>
              <input
                type="url"
                value={matUrl}
                onChange={e => setMatUrl(e.target.value)}
                placeholder="https://contoh-portal.id/modul-pembelajaran.pdf"
                className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
            >
              Unggah Materi
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: VIEW MATERI PDF / PPT (IN-APP VIEWER) */}
      <Modal
        isOpen={Boolean(previewMaterial)}
        onClose={() => setPreviewMaterial(null)}
        title={previewMaterial ? `${previewMaterial.title} (${previewMaterial.fileType})` : 'Akses Materi'}
      >
        {previewMaterial && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between text-indigo-900">
              <div>
                <span className="font-bold text-sm block">{previewMaterial.title}</span>
                <span className="text-[11px] text-indigo-700">
                  {previewMaterial.fileName} • {previewMaterial.fileSize} • Diunggah oleh {previewMaterial.uploadedByName}
                </span>
              </div>
              {previewMaterial.fileData && (
                <a
                  href={previewMaterial.fileData}
                  download={previewMaterial.fileName}
                  className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-lg font-bold flex items-center gap-1 hover:bg-indigo-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              )}
            </div>

            <p className="text-slate-600 leading-relaxed">
              {previewMaterial.description}
            </p>

            {/* Embedded Document Viewer / Reader */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 h-96 flex flex-col items-center justify-center p-4 text-center">
              {previewMaterial.fileData && previewMaterial.fileData.startsWith('data:application/pdf') ? (
                <iframe
                  src={previewMaterial.fileData}
                  title={previewMaterial.title}
                  className="w-full h-full border-none rounded-xl"
                />
              ) : previewMaterial.fileData && (previewMaterial.fileData.startsWith('http://') || previewMaterial.fileData.startsWith('https://')) ? (
                <iframe
                  src={previewMaterial.fileData}
                  title={previewMaterial.title}
                  className="w-full h-full border-none rounded-xl bg-white"
                />
              ) : (
                <div className="space-y-3 text-slate-300">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mx-auto">
                    {previewMaterial.fileType === 'PDF' ? <FileText className="w-6 h-6" /> : <Presentation className="w-6 h-6" />}
                  </div>
                  <h4 className="font-bold text-sm text-white">Pratinjau Berkas {previewMaterial.fileType}</h4>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Dokumen siap dipelajari. Anda dapat mengunduh berkas lengkap atau membukanya di aplikasi pendukung perangkat Anda.
                  </p>
                  {previewMaterial.fileData && (
                    <a
                      href={previewMaterial.fileData}
                      download={previewMaterial.fileName}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh {previewMaterial.fileName}</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewMaterial(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: BUKA DISKUSI BARU TERKAIT SOAL */}
      <Modal
        isOpen={isNewDiscussionModalOpen}
        onClose={() => setIsNewDiscussionModalOpen(false)}
        title="Buka Topik Diskusi Soal Uji Pemahaman"
      >
        <form onSubmit={handleCreateDiscussion} className="space-y-4 text-xs">
          {discError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {discError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Judul Topik Diskusi *</label>
            <input
              type="text"
              value={discTopic}
              onChange={e => setDiscTopic(e.target.value)}
              placeholder="Contoh: Klarifikasi Soal Kategori PM vs IM pada Penanganan Data Publik"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Referensi Soal / Materi (Opsional)</label>
            <div className="space-y-1.5">
              <select
                value={discQuestionRef}
                onChange={e => setDiscQuestionRef(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="">-- Pilih Dari Bank Soal atau Kosongkan --</option>
                {questions.map((q, idx) => (
                  <option key={q.id} value={`Soal #${idx + 1}: ${q.category}`}>
                    Soal #{idx + 1} ({q.category}): {q.questionText.slice(0, 60)}...
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={discQuestionRef}
                onChange={e => setDiscQuestionRef(e.target.value)}
                placeholder="Atau tulis manual: Soal Ujian Pre-Test #3, SOP Shift P5, dll."
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pertanyaan / Isi Diskusi *</label>
            <textarea
              rows={4}
              value={discContent}
              onChange={e => setDiscContent(e.target.value)}
              placeholder="Tuliskan pertanyaan, keraguan, atau pembahasan Anda untuk didiskusikan bersama Petugas, TL, dan QA..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewDiscussionModalOpen(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
            >
              Publikasikan Diskusi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
