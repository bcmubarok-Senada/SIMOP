import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { Exam, Question, ExamSubmission } from '../../types';
import {
  Clock, CheckCircle2, XCircle, AlertTriangle, ArrowRight,
  ArrowLeft, Award, HelpCircle, FileCheck2
} from 'lucide-react';
import { Modal } from '../ui/Modal';

interface ExamRunnerProps {
  exam: Exam;
  onFinish: () => void;
}

const getQuestionOptions = (q: Question) => {
  if (q.options && q.options.length > 0) return q.options;
  return [
    { key: 'A' as const, text: q.optionA || '' },
    { key: 'B' as const, text: q.optionB || '' },
    { key: 'C' as const, text: q.optionC || '' },
    { key: 'D' as const, text: q.optionD || '' },
  ];
};

export const ExamRunner: React.FC<ExamRunnerProps> = ({ exam, onFinish }) => {
  const { currentUser, addToast } = useAuth();

  // Load questions for this exam
  const allQuestions = storageService.getQuestions();
  const examQuestions = useMemo(() => {
    return allQuestions.filter(q => exam.questionIds.includes(q.id));
  }, [allQuestions, exam.questionIds]);

  // Current question index (0-based)
  const [currentIndex, setCurrentIndex] = useState(0);

  // User answers map: { [questionId]: 'A' | 'B' | 'C' | 'D' | string }
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Countdown timer in seconds
  const [timeLeft, setTimeLeft] = useState(exam.durationMinutes * 60);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Confirm submit modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Completed submission result state
  const [submissionResult, setSubmissionResult] = useState<ExamSubmission | null>(null);

  // Start timer
  useEffect(() => {
    if (submissionResult) return; // stop if finished

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [submissionResult]);

  // Auto-submit on time up
  useEffect(() => {
    if (isTimeUp && !submissionResult) {
      handleFinalSubmit();
    }
  }, [isTimeUp, submissionResult]);

  // Time formatter
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [timeLeft]);

  const currentQuestion = examQuestions[currentIndex];
  const totalQuestions = examQuestions.length;
  const answeredCount = examQuestions.filter(q => {
    const val = answers[q.id];
    return typeof val === 'string' && val.trim().length > 0;
  }).length;

  // Handle select option for multiple-choice
  const handleSelectOption = (key: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion || submissionResult) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: key,
    }));
  };

  // Handle text input for essay questions
  const handleEssayAnswer = (text: string) => {
    if (!currentQuestion || submissionResult) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: text,
    }));
  };

  // Final calculate & save submission
  const handleFinalSubmit = () => {
    if (!currentUser || submissionResult) return;

    let correctCount = 0;
    const answerRecords = examQuestions.map(q => {
      const selected = answers[q.id];
      let isCorrect = false;
      if (q.type === 'ESSAY') {
        // Essay is credited as answered for review and scoring
        isCorrect = typeof selected === 'string' && selected.trim().length > 0;
      } else {
        isCorrect = selected === q.correctAnswer;
      }
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        selectedAnswer: selected || null,
        isCorrect,
      };
    });

    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const isPassed = score >= exam.passingGrade;
    const durationTakenSeconds = exam.durationMinutes * 60 - timeLeft;

    const submission: ExamSubmission = {
      id: `sub-${Date.now()}`,
      examId: exam.id,
      examTitle: exam.title,
      userId: currentUser.id,
      userName: currentUser.name,
      userNpp: currentUser.npp,
      userTeamId: currentUser.teamId,
      score,
      totalQuestions,
      correctCount,
      isPassed,
      submittedAt: new Date().toISOString(),
      durationSeconds: durationTakenSeconds,
      answers,
    };

    storageService.saveExamSubmission(submission);

    // Audit Log
    storageService.addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Menyelesaikan Uji Pemahaman',
      module: 'Uji Pemahaman',
      notes: `${currentUser.name} menyelesaikan ${exam.title} dengan nilai ${score} (${isPassed ? 'LULUS' : 'TIDAK LULUS'})`,
    });

    // Notification
    storageService.addNotification({
      recipientUserId: currentUser.id,
      title: `Hasil Ujian: ${exam.title}`,
      message: `Nilai Anda: ${score} (${isPassed ? 'LULUS' : 'TIDAK LULUS'}). Passing Grade: ${exam.passingGrade}`,
      type: 'EXAM',
      linkRoute: 'exams',
    });

    setSubmissionResult(submission);
    setIsConfirmModalOpen(false);
  };

  if (totalQuestions === 0) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-100 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Ujian Belum Memiliki Soal</h3>
        <p className="text-xs text-slate-500">
          Administrator belum menambahkan butir soal ke dalam ujian ini.
        </p>
        <button
          onClick={onFinish}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
        >
          Kembali
        </button>
      </div>
    );
  }

  // If Finished: Display Complete Result & Review
  if (submissionResult) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center space-y-4">
          <div
            className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white ${
              submissionResult.isPassed ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-rose-500 shadow-lg shadow-rose-500/30'
            }`}
          >
            {submissionResult.isPassed ? (
              <Award className="w-8 h-8" />
            ) : (
              <XCircle className="w-8 h-8" />
            )}
          </div>

          <div>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 ${
                submissionResult.isPassed
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {submissionResult.isPassed ? 'LULUS UJI PEMAHAMAN' : 'BELUM MEMENUHI PASSING GRADE'}
            </span>
            <h2 className="text-2xl font-bold text-slate-800">{exam.title}</h2>
            <p className="text-xs text-slate-500 mt-1">
              Peserta: {currentUser?.name} ({currentUser?.npp}) &bull; Waktu:{' '}
              {Math.floor(submissionResult.durationSeconds / 60)} menit{' '}
              {submissionResult.durationSeconds % 60} detik
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Nilai Anda</span>
              <span className="text-2xl font-black text-indigo-600">{submissionResult.score}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Jawaban Benar</span>
              <span className="text-2xl font-black text-emerald-600">
                {submissionResult.correctCount} / {totalQuestions}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Passing Grade</span>
              <span className="text-2xl font-black text-slate-800">{exam.passingGrade}</span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={onFinish}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              Kembali ke Daftar Ujian
            </button>
          </div>
        </div>

        {/* Detailed Review of Answers */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 px-1">
            Pembahasan &amp; Kunci Jawaban Lengkap
          </h3>

          {examQuestions.map((q, idx) => {
            const userChoice = answers[q.id];
            const isCorrect = userChoice === q.correctAnswer;

            return (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="font-bold text-slate-800 text-xs leading-relaxed">
                      {q.questionText}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isCorrect ? 'Benar (+1)' : 'Salah'}
                  </span>
                </div>

                {q.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 max-w-sm ml-8">
                    <img
                      src={q.imageUrl}
                      alt="Lampiran Soal"
                      className="max-h-48 w-auto object-contain"
                    />
                  </div>
                )}

                {/* Options or Essay Answer Review */}
                {q.type === 'ESSAY' ? (
                  <div className="space-y-3 pt-1">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <span className="font-bold text-slate-700 block mb-1">Jawaban Anda (Uraian / Essay):</span>
                      <p className="text-slate-800 whitespace-pre-wrap font-medium">
                        {userChoice ? userChoice : <span className="text-rose-500 italic">Tidak ada jawaban ditulis</span>}
                      </p>
                    </div>

                    {q.idealAnswer && (
                      <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200 text-xs">
                        <span className="font-bold text-purple-900 block mb-1">Kunci Jawaban Ideal / Acuan Penilaian:</span>
                        <p className="text-purple-950 whitespace-pre-wrap">{q.idealAnswer}</p>
                      </div>
                    )}

                    {q.gradingRubric && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px]">
                        <span className="font-bold text-amber-900 block mb-0.5">Rubrik &amp; Pedoman Penilaian:</span>
                        <p className="text-amber-950 whitespace-pre-wrap">{q.gradingRubric}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {getQuestionOptions(q).map(opt => {
                      const isKey = opt.key === q.correctAnswer;
                      const isUserPick = opt.key === userChoice;

                      let style = 'bg-slate-50 border-slate-100 text-slate-600';
                      if (isKey) style = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold';
                      else if (isUserPick && !isCorrect)
                        style = 'bg-rose-50 border-rose-300 text-rose-800 line-through';

                      return (
                        <div
                          key={opt.key}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 ${style}`}
                        >
                          <span className="font-bold">{opt.key}.</span>
                          <span>{opt.text}</span>
                          {isKey && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-[11px] text-slate-600">
                    <strong className="text-indigo-900">Pembahasan: </strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
      {/* Top Floating Bar: Timer & Progress */}
      <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-md flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Sedang Dikerjakan
          </span>
          <h3 className="text-sm font-bold text-slate-800 truncate max-w-xs sm:max-w-md">
            {exam.title}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer Display */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-black text-sm ${
              timeLeft <= 180
                ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
                : 'bg-indigo-50 border-indigo-200 text-indigo-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formattedTime}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsConfirmModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            Selesai Ujian
          </button>
        </div>
      </div>

      {/* Main Runner Layout: Question content + Navigator */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Question & Options Area */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
            <span className="font-bold text-indigo-600">
              Soal Nomor {currentIndex + 1} dari {totalQuestions}
            </span>
            <span className="text-slate-400 font-medium">Kategori: {currentQuestion.category}</span>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  currentQuestion.type === 'ESSAY'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                }`}
              >
                {currentQuestion.type === 'ESSAY' ? 'Soal Essay / Uraian' : 'Soal Pilihan Ganda'}
              </span>
              <span className="text-[11px] text-slate-400">
                Tingkat Kesulitan: {currentQuestion.difficulty || 'Sedang'}
              </span>
            </div>
            <div className="text-slate-800 text-sm font-semibold leading-relaxed">
              {currentQuestion.questionText}
            </div>
          </div>

          {/* Question Image Attachment */}
          {currentQuestion.imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50/50 p-2 max-w-md">
              <img
                src={currentQuestion.imageUrl}
                alt="Lampiran Soal"
                className="max-h-72 w-auto object-contain mx-auto rounded-xl"
              />
            </div>
          )}

          {/* Answer Input: Options (A, B, C, D) OR Essay Textarea */}
          {currentQuestion.type === 'ESSAY' ? (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Lembar Jawaban Uraian / Essay Anda:
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {(answers[currentQuestion.id] || '').length} karakter
                </span>
              </div>
              <textarea
                rows={7}
                value={answers[currentQuestion.id] || ''}
                onChange={e => handleEssayAnswer(e.target.value)}
                placeholder="Ketikkan uraian jawaban, analisis, atau penjelasan Anda di sini..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 focus:bg-white transition"
              />
              <p className="text-[11px] text-slate-400">
                Jawaban Anda disimpan otomatis. Pastikan menuliskan poin-poin penjelasan secara jelas dan lengkap.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 pt-2">
              {getQuestionOptions(currentQuestion).map(opt => {
                const isSelected = answers[currentQuestion.id] === opt.key;

                return (
                  <div
                    key={opt.key}
                    onClick={() => handleSelectOption(opt.key)}
                    className={`p-3.5 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {opt.key}
                    </span>
                    <span className="flex-1">{opt.text}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Question Navigation Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => prev - 1)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            {currentIndex < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                <span>Berikutnya</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Kumpulkan Ujian</span>
              </button>
            )}
          </div>
        </div>

        {/* Question Number Palette Sidebar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div>
            <h4 className="font-bold text-slate-800 text-xs">Navigasi Butir Soal</h4>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Terjawab: {answeredCount} dari {totalQuestions}
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {examQuestions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = idx === currentIndex;

              let btnClass = 'bg-slate-100 text-slate-700 border-slate-200';
              if (isAnswered) btnClass = 'bg-emerald-600 text-white border-emerald-700';
              if (isCurrent) btnClass += ' ring-2 ring-indigo-500 scale-105';

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 rounded-xl font-bold text-xs border transition ${btnClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[10px] space-y-1.5 text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
              <span>Sudah dijawab</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-slate-200 inline-block" />
              <span>Belum dijawab</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Confirm Submit */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Konfirmasi Pengumpulan Ujian"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Anda telah menjawab <strong className="text-slate-800">{answeredCount}</strong> dari{' '}
            <strong className="text-slate-800">{totalQuestions}</strong> butir pertanyaan.
          </p>

          {answeredCount < totalQuestions && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
              Masih terdapat {totalQuestions - answeredCount} soal yang belum Anda jawab. Apakah Anda tetap ingin mengumpulkan?
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
            >
              Kembali Kerjakan
            </button>
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
            >
              Ya, Kumpulkan Sekarang
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
