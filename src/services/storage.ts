import {
  User, Team, ScheduleEntry, BaselineScheduleEntry, ShiftRequirement,
  ApprovalRequest, SenadaAssignment, SenadaHistory, Question, Exam,
  ExamSubmission, NotificationItem, AuditLog, SystemSettings, RoleType,
  ClassroomMaterial, ClassroomDiscussion, ClassroomDiscussionReply, ShiftMeta
} from '../types';
import { DEFAULT_TEAMS, DEFAULT_SHIFT_DEFINITIONS } from '../utils/constants';
import { hashPassword } from '../utils/crypto';

const STORAGE_KEYS = {
  USERS: 'simop_users_v1',
  TEAMS: 'simop_teams_v1',
  SCHEDULES: 'simop_schedules_v1',
  BASELINE_SCHEDULES: 'simop_baseline_schedules_v1',
  SHIFT_REQUIREMENTS: 'simop_shift_reqs_v1',
  SHIFTS: 'simop_shifts_v2',
  APPROVALS: 'simop_approvals_v1',
  SENADA: 'simop_senada_v1',
  SENADA_HISTORY: 'simop_senada_history_v1',
  QUESTIONS: 'simop_questions_v1',
  EXAMS: 'simop_exams_v1',
  EXAM_SUBMISSIONS: 'simop_exam_submissions_v1',
  NOTIFICATIONS: 'simop_notifications_v1',
  AUDIT_LOGS: 'simop_audit_logs_v1',
  SETTINGS: 'simop_settings_v1',
  CLASSROOM_MATERIALS: 'simop_classroom_materials_v1',
  CLASSROOM_DISCUSSIONS: 'simop_classroom_discussions_v1',
  INITIALIZED: 'simop_init_complete_v1',
};

// Safe localStorage access
function getStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

export async function initializeDatabase(): Promise<void> {
  if (localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
    return;
  }

  // Generate salts and hashes for default users
  const defaultSalt = 'a1b2c3d4e5f67890';
  const defaultPassword = 'password123';
  const defaultHash = await hashPassword(defaultPassword, defaultSalt);

  const initialUsers: User[] = [
    {
      id: 'usr-master-1',
      npp: 'MASTER001',
      name: 'B.C. Mubarok (Master / Pemilik)',
      email: 'bcmubarok@gmail.com',
      jabatan: 'Pemilik Sistem (Master / Super Admin)',
      teamId: 'team-tl',
      role: 'MASTER',
      status: 'Aktif',
      passwordHash: defaultHash,
      salt: defaultSalt,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'usr-kor-1',
      npp: 'KOR001',
      name: 'Budi Pratama (Koordinator)',
      email: 'koordinator@instansi.go.id',
      jabatan: 'Koordinator Operasional',
      teamId: 'team-tl',
      role: 'KOORDINATOR',
      status: 'Aktif',
      passwordHash: defaultHash,
      salt: defaultSalt,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'usr-tl-1',
      npp: 'TL001',
      name: 'Siti Rahmawati (TL 1)',
      email: 'tl1@instansi.go.id',
      jabatan: 'Team Leader 1 (Operasional)',
      teamId: 'team-1',
      role: 'TL 1',
      status: 'Aktif',
      passwordHash: defaultHash,
      salt: defaultSalt,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'usr-tl-2',
      npp: 'TL002',
      name: 'Bambang Wijaya (TL 2)',
      email: 'tl2@instansi.go.id',
      jabatan: 'Team Leader 2 (Operasional)',
      teamId: 'team-2',
      role: 'TL 2',
      status: 'Aktif',
      passwordHash: defaultHash,
      salt: defaultSalt,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'usr-tl-3',
      npp: 'TL003',
      name: 'Ratna Sari (TL 3)',
      email: 'tl3@instansi.go.id',
      jabatan: 'Team Leader 3 (Operasional)',
      teamId: 'team-3',
      role: 'TL 3',
      status: 'Aktif',
      passwordHash: defaultHash,
      salt: defaultSalt,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'usr-tl-4',
      npp: 'TL004',
      name: 'Hendra Gunawan (TL 4)',
      email: 'tl4@instansi.go.id',
      jabatan: 'Team Leader 4 (Operasional)',
      teamId: 'team-4',
      role: 'TL 4',
      status: 'Aktif',
      passwordHash: defaultHash,
      salt: defaultSalt,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'usr-tl-5',
      npp: 'TL005',
      name: 'Fitri Handayani (TL 5)',
      email: 'tl5@instansi.go.id',
      jabatan: 'Team Leader 5 (Operasional)',
      teamId: 'team-5',
      role: 'TL 5',
      status: 'Aktif',
      passwordHash: defaultHash,
      salt: defaultSalt,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'usr-tl-6',
      npp: 'TL006',
      name: 'Agus Prasetyo (TL 6)',
      email: 'tl6@instansi.go.id',
      jabatan: 'Team Leader 6 (Operasional)',
      teamId: 'team-6',
      role: 'TL 6',
      status: 'Aktif',
      passwordHash: defaultHash,
      salt: defaultSalt,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'usr-qa-1',
      npp: 'QA001',
      name: 'Ahmad Fauzi (QA)',
      email: 'qa@instansi.go.id',
      jabatan: 'Quality Assurance Officer',
      teamId: 'team-qa',
      role: 'QA',
      status: 'Aktif',
      passwordHash: defaultHash,
      salt: defaultSalt,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'usr-pet-1',
      npp: 'PET001',
      name: 'Andi Saputra',
      email: 'andi@instansi.go.id',
      jabatan: 'Petugas Layanan',
      teamId: 'team-1',
      role: 'PETUGAS',
      status: 'Aktif',
      passwordHash: defaultHash,
      salt: defaultSalt,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'usr-pet-2',
      npp: 'PET002',
      name: 'Dewi Lestari',
      email: 'dewi@instansi.go.id',
      jabatan: 'Petugas Layanan',
      teamId: 'team-2',
      role: 'PETUGAS',
      status: 'Aktif',
      passwordHash: defaultHash,
      salt: defaultSalt,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'usr-pet-3',
      npp: 'PET003',
      name: 'Rian Hidayat',
      email: 'rian@instansi.go.id',
      jabatan: 'Petugas Layanan',
      teamId: 'team-3',
      role: 'PETUGAS',
      status: 'Aktif',
      passwordHash: defaultHash,
      salt: defaultSalt,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'usr-pet-4',
      npp: 'PET004',
      name: 'Maya Safitri',
      email: 'maya@instansi.go.id',
      jabatan: 'Petugas Layanan',
      teamId: 'team-4',
      role: 'PETUGAS',
      status: 'Aktif',
      passwordHash: defaultHash,
      salt: defaultSalt,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'usr-pet-5',
      npp: 'PET005',
      name: 'Doni Irawan',
      email: 'doni@instansi.go.id',
      jabatan: 'Petugas Layanan',
      teamId: 'team-5',
      role: 'PETUGAS',
      status: 'Aktif',
      passwordHash: defaultHash,
      salt: defaultSalt,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'usr-pet-6',
      npp: 'PET006',
      name: 'Nina Marlina',
      email: 'nina@instansi.go.id',
      jabatan: 'Petugas Layanan',
      teamId: 'team-6',
      role: 'PETUGAS',
      status: 'Aktif',
      passwordHash: defaultHash,
      salt: defaultSalt,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
    },
  ];

  setStorage(STORAGE_KEYS.USERS, initialUsers);
  setStorage(STORAGE_KEYS.TEAMS, DEFAULT_TEAMS);

  // Requirements per shift
  const initialRequirements: ShiftRequirement[] = [
    { shiftCode: 'P1', requiredCount: 2 },
    { shiftCode: 'P2', requiredCount: 2 },
    { shiftCode: 'P3', requiredCount: 1 },
    { shiftCode: 'P4', requiredCount: 1 },
    { shiftCode: 'P5', requiredCount: 1 },
  ];
  setStorage(STORAGE_KEYS.SHIFT_REQUIREMENTS, initialRequirements);

  // Seed sample schedules for current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const schedules: ScheduleEntry[] = [];
  const baselineSchedules: BaselineScheduleEntry[] = [];
  const senadaAssignments: SenadaAssignment[] = [];

  const shiftCycle = ['P1', 'P2', 'P3', 'P4A', 'X', 'P1', 'P2'];
  const senadaCycle: ('PM' | 'IP' | 'IM')[] = ['PM', 'IP', 'IM', 'PM', 'IP', 'IM', 'PM'];

  initialUsers.forEach((user, uIdx) => {
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const shiftCode = shiftCycle[(day + uIdx) % shiftCycle.length];
      const schedType = user.role === 'PETUGAS' ? 'PETUGAS' : (user.role === 'TL' || user.role.startsWith('TL')) ? 'TL' : user.role === 'QA' ? 'QA' : 'TL';

      const entry: ScheduleEntry = {
        id: `sch-${user.id}-${dateStr}`,
        userId: user.id,
        teamId: user.teamId,
        date: dateStr,
        shiftCode,
        scheduleType: schedType,
        createdBy: 'usr-kor-1',
        updatedBy: 'usr-kor-1',
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      };
      schedules.push(entry);

      // Baseline schedule (JADWAL AWAL)
      baselineSchedules.push({
        id: `base-${entry.id}`,
        userId: user.id,
        date: dateStr,
        shiftCode,
        scheduleType: schedType,
        createdAt: '2026-09-01T00:00:00Z',
      });

      // If user is PETUGAS and shift is working shift, seed Senada Assignment
      if (user.role === 'PETUGAS' && !['X', 'C', 'I', 'S'].includes(shiftCode)) {
        const cat = senadaCycle[(day + uIdx) % senadaCycle.length];
        senadaAssignments.push({
          id: `sen-${user.id}-${dateStr}`,
          userId: user.id,
          npp: user.npp,
          userName: user.name,
          teamId: user.teamId,
          date: dateStr,
          shiftCode,
          category: cat,
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
        });
      }
    }
  });

  setStorage(STORAGE_KEYS.SCHEDULES, schedules);
  setStorage(STORAGE_KEYS.BASELINE_SCHEDULES, baselineSchedules);
  setStorage(STORAGE_KEYS.SENADA, senadaAssignments);
  setStorage(STORAGE_KEYS.SENADA_HISTORY, []);

  // Initial Approvals
  const initialApprovals: ApprovalRequest[] = [
    {
      id: 'appr-001',
      ticketNumber: 'REQ-2026-001',
      userId: 'usr-pet-1',
      userName: 'Andi Saputra',
      userRole: 'PETUGAS',
      teamId: 'team-1',
      type: 'Tukar Jadwal',
      startDate: `${year}-${String(month + 1).padStart(2, '0')}-20`,
      endDate: `${year}-${String(month + 1).padStart(2, '0')}-20`,
      targetTlRole: 'TL 1',
      targetTlUserId: 'usr-tl-1',
      targetTlUserName: 'Siti Rahmawati (TL 1)',
      reason: 'Ada keperluan mendesak keluarga di pagi hari',
      status: 'Pending',
      swapWithUserId: 'usr-pet-2',
      swapWithUserName: 'Dewi Lestari',
      swapDate: `${year}-${String(month + 1).padStart(2, '0')}-20`,
      originalShiftUserA: 'P1',
      originalShiftUserB: 'P3',
      proposedShiftUserA: 'P3',
      proposedShiftUserB: 'P1',
      createdAt: `${year}-${String(month + 1).padStart(2, '0')}-18T10:30:00Z`,
      updatedAt: `${year}-${String(month + 1).padStart(2, '0')}-18T10:30:00Z`,
    },
    {
      id: 'appr-002',
      ticketNumber: 'REQ-2026-002',
      userId: 'usr-pet-3',
      userName: 'Rian Hidayat',
      userRole: 'PETUGAS',
      teamId: 'team-3',
      type: 'Cuti',
      startDate: `${year}-${String(month + 1).padStart(2, '0')}-24`,
      endDate: `${year}-${String(month + 1).padStart(2, '0')}-25`,
      targetTlRole: 'TL 3',
      targetTlUserId: 'usr-tl-3',
      targetTlUserName: 'Ratna Sari (TL 3)',
      reason: 'Cuti tahunan keperluan keluarga',
      status: 'Pending',
      createdAt: `${year}-${String(month + 1).padStart(2, '0')}-18T11:00:00Z`,
      updatedAt: `${year}-${String(month + 1).padStart(2, '0')}-18T11:00:00Z`,
    }
  ];
  setStorage(STORAGE_KEYS.APPROVALS, initialApprovals);

  // Initial Questions for Bank Soal
  const initialQuestions: Question[] = [
    {
      id: 'q-001',
      type: 'PILIHAN_GANDA',
      questionText: 'Apa kepanjangan dari kategori layanan Senada PM?',
      category: 'Kategori Senada',
      difficulty: 'Mudah',
      optionA: 'Permintaan dan Informasi',
      optionB: 'Pengaduan Masalah',
      optionC: 'Penyampaian Materi',
      optionD: 'Proses Mediasi',
      correctAnswer: 'A',
      explanation: 'PM merupakan singkatan dari Permintaan dan Informasi sesuai SOP Senada.',
      createdAt: '2026-09-01T00:00:00Z',
    },
    {
      id: 'q-002',
      type: 'PILIHAN_GANDA',
      questionText: 'Berapa durasi jam kerja shift P1 menurut standar operasional?',
      category: 'SOP Operasional',
      difficulty: 'Mudah',
      optionA: '08.00 - 17.00',
      optionB: '06.00 - 15.00',
      optionC: '11.00 - 20.00',
      optionD: '22.00 - 06.00',
      correctAnswer: 'B',
      explanation: 'Shift P1 dimulai pukul 06.00 hingga 15.00 WIB.',
      createdAt: '2026-09-01T00:00:00Z',
    },
    {
      id: 'q-003',
      type: 'PILIHAN_GANDA',
      questionText: 'Jika terjadi pertukaran jadwal antara dua petugas, bagaimanakah status kategori Senada yang berlaku?',
      category: 'SOP Tukar Jadwal',
      difficulty: 'Sedang',
      optionA: 'Kategori Senada tetap pada petugas awal tanpa perubahan',
      optionB: 'Kategori Senada mengikuti jadwal aktif hasil pertukaran',
      optionC: 'Kategori Senada otomatis terhapus',
      optionD: 'Petugas wajib membuat laporan tiket baru',
      correctAnswer: 'B',
      explanation: 'Berdasarkan aturan integrasi jadwal dan Senada, kategori mengikuti jadwal aktif yang berlaku saat ini.',
      createdAt: '2026-09-01T00:00:00Z',
    },
    {
      id: 'q-004',
      type: 'ESSAY',
      questionText: 'Jelaskan prosedur yang harus dilakukan Petugas ketika menghadapi kendala eskalasi pengaduan pada kategori IP (Informasi dan Pengaduan)!',
      category: 'SOP Pelayanan',
      difficulty: 'Sedang',
      idealAnswer: '1. Catat nomor tiket pengaduan dan identitas pelapor. 2. Identifikasi tingkat urgensi masalah. 3. Hubungi Team Leader jaga untuk koordinasi eskalasi. 4. Berikan informasi estimasi waktu penyelesaian kepada pelapor secara sopan. 5. Perbarui status tiket pada sistem.',
      gradingRubric: 'Mencakup identifikasi masalah (25%), komunikasi SOP (25%), koordinasi dengan TL (25%), dan pembaruan sistem tiket (25%).',
      createdAt: '2026-09-01T00:00:00Z',
    },
  ];
  setStorage(STORAGE_KEYS.QUESTIONS, initialQuestions);

  // Initial Exams
  const initialExams: Exam[] = [
    {
      id: 'exam-001',
      title: 'Uji Pemahaman SOP Operasional & Senada Q3',
      type: 'Pre-Test',
      description: 'Ujian pemahaman regulasi pelayanan, alur pertukaran jadwal, dan klasifikasi kategori Senada untuk Petugas dan QA.',
      category: 'Operasional',
      durationMinutes: 15,
      startDate: `${year}-${String(month + 1).padStart(2, '0')}-01`,
      endDate: `${year}-${String(month + 1).padStart(2, '0')}-30`,
      startTime: '08:00',
      endTime: '23:59',
      randomizeQuestions: true,
      randomizeOptions: true,
      maxAttempts: 2,
      passingGrade: 75,
      isLeaderboardEnabled: true,
      questionIds: ['q-001', 'q-002', 'q-003', 'q-004'],
      status: 'Aktif',
      createdAt: '2026-09-01T00:00:00Z',
    },
  ];
  setStorage(STORAGE_KEYS.EXAMS, initialExams);

  // Sample submission for leaderboard and stats
  const initialSubmissions: ExamSubmission[] = [
    {
      id: 'sub-001',
      examId: 'exam-001',
      examTitle: 'Uji Pemahaman SOP Operasional & Senada Q3',
      examType: 'Pre-Test',
      userId: 'usr-pet-2',
      userName: 'Dewi Lestari',
      userNpp: 'PET002',
      teamId: 'team-2',
      userJabatan: 'Petugas Layanan',
      startedAt: `${year}-${String(month + 1).padStart(2, '0')}-15T09:00:00Z`,
      submittedAt: `${year}-${String(month + 1).padStart(2, '0')}-15T09:12:30Z`,
      durationSeconds: 750,
      answers: {
        'q-001': 'A',
        'q-002': 'B',
        'q-003': 'B',
        'q-004': 'Prosedur eskalasi: Catat keluhan, koordinasi dengan Team Leader, hubungi unit teknis, dan perbarui status ke sistem operasional.',
      },
      essayScores: {
        'q-004': 90,
      },
      score: 95,
      correctCount: 3,
      wrongCount: 0,
      unansweredCount: 0,
      isPassed: true,
      essayStatus: 'Dinilai',
    },
    {
      id: 'sub-002',
      examId: 'exam-001',
      examTitle: 'Uji Pemahaman SOP Operasional & Senada Q3',
      examType: 'Pre-Test',
      userId: 'usr-pet-4',
      userName: 'Maya Safitri',
      userNpp: 'PET004',
      teamId: 'team-4',
      userJabatan: 'Petugas Layanan',
      startedAt: `${year}-${String(month + 1).padStart(2, '0')}-16T14:10:00Z`,
      submittedAt: `${year}-${String(month + 1).padStart(2, '0')}-16T14:23:45Z`,
      durationSeconds: 825,
      answers: {
        'q-001': 'A',
        'q-002': 'B',
        'q-003': 'A',
        'q-004': 'Melakukan konfirmasi pelanggan lalu menyampaikan ke atasan.',
      },
      essayScores: {
        'q-004': 70,
      },
      score: 80,
      correctCount: 2,
      wrongCount: 1,
      unansweredCount: 0,
      isPassed: true,
      essayStatus: 'Dinilai',
    },
  ];
  setStorage(STORAGE_KEYS.EXAM_SUBMISSIONS, initialSubmissions);

  // Initial Notifications
  const initialNotifications: NotificationItem[] = [
    {
      id: 'notif-001',
      targetRole: 'ADMIN',
      title: 'Pengajuan Tukar Jadwal Baru',
      message: 'Andi Saputra mengajukan tukar jadwal dengan Dewi Lestari untuk tanggal 20.',
      type: 'APPROVAL',
      read: false,
      createdAt: '2026-09-18T10:30:00Z',
    },
    {
      id: 'notif-002',
      targetRole: 'ALL',
      title: 'Ujian Pemahaman Tersedia',
      message: 'Ujian Pre-Test SOP Operasional & Senada Q3 telah aktif dan dapat dikerjakan.',
      type: 'EXAM',
      read: false,
      createdAt: '2026-09-15T08:00:00Z',
    },
  ];
  setStorage(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);

  // Initial Audit Logs
  const initialAuditLogs: AuditLog[] = [
    {
      id: 'log-001',
      userId: 'usr-kor-1',
      userName: 'Budi Pratama (Koordinator)',
      userRole: 'KOORDINATOR',
      action: 'Inisialisasi Sistem',
      module: 'Sistem',
      timestamp: '2026-09-01T08:00:00Z',
      notes: 'Inisialisasi jadwal awal, 6 tim petugas, dan modul Senada',
    },
  ];
  setStorage(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);

  // Initial Settings
  const initialSettings: SystemSettings = {
    appName: 'Sistem Operasional & Jadwal Petugas',
    organization: 'Instansi Layanan Terpadu',
    strictSwapRequirementEnforcement: true,
    allowPastScheduleEdit: false,
  };
  setStorage(STORAGE_KEYS.SETTINGS, initialSettings);

  // Initial Shift References
  setStorage(STORAGE_KEYS.SHIFTS, DEFAULT_SHIFT_DEFINITIONS);

  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
}

// Storage accessors
export const storageService = {
  // Users
  getUsers: (): User[] => {
    const users = getStorage<User[]>(STORAGE_KEYS.USERS, []);
    if (!users || users.length === 0) return [];

    let modified = false;

    // Migrate old generic TL to TL 1
    const tl1 = users.find(u => u.id === 'usr-tl-1' || u.role === 'TL');
    if (tl1 && tl1.role === 'TL') {
      tl1.role = 'TL 1';
      if (!tl1.name.includes('(TL 1)')) {
        tl1.name = 'Siti Rahmawati (TL 1)';
      }
      tl1.jabatan = 'Team Leader 1 (Operasional)';
      tl1.teamId = 'team-1';
      modified = true;
    }

    const defaultTls: Partial<User>[] = [
      { id: 'usr-tl-1', npp: 'TL001', name: 'Siti Rahmawati (TL 1)', email: 'tl1@instansi.go.id', jabatan: 'Team Leader 1 (Operasional)', teamId: 'team-1', role: 'TL 1' },
      { id: 'usr-tl-2', npp: 'TL002', name: 'Bambang Wijaya (TL 2)', email: 'tl2@instansi.go.id', jabatan: 'Team Leader 2 (Operasional)', teamId: 'team-2', role: 'TL 2' },
      { id: 'usr-tl-3', npp: 'TL003', name: 'Ratna Sari (TL 3)', email: 'tl3@instansi.go.id', jabatan: 'Team Leader 3 (Operasional)', teamId: 'team-3', role: 'TL 3' },
      { id: 'usr-tl-4', npp: 'TL004', name: 'Hendra Gunawan (TL 4)', email: 'tl4@instansi.go.id', jabatan: 'Team Leader 4 (Operasional)', teamId: 'team-4', role: 'TL 4' },
      { id: 'usr-tl-5', npp: 'TL005', name: 'Fitri Handayani (TL 5)', email: 'tl5@instansi.go.id', jabatan: 'Team Leader 5 (Operasional)', teamId: 'team-5', role: 'TL 5' },
      { id: 'usr-tl-6', npp: 'TL006', name: 'Agus Prasetyo (TL 6)', email: 'tl6@instansi.go.id', jabatan: 'Team Leader 6 (Operasional)', teamId: 'team-6', role: 'TL 6' },
    ];

    const refUser = users[0];
    const defaultHash = refUser ? refUser.passwordHash : '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';
    const defaultSalt = refUser ? refUser.salt : 'a1b2c3d4e5f67890';

    for (const dt of defaultTls) {
      const exists = users.some(u => u.id === dt.id || u.role === dt.role);
      if (!exists && dt.id) {
        users.push({
          id: dt.id,
          npp: dt.npp!,
          name: dt.name!,
          email: dt.email!,
          jabatan: dt.jabatan!,
          teamId: dt.teamId!,
          role: dt.role as RoleType,
          status: 'Aktif',
          passwordHash: defaultHash,
          salt: defaultSalt,
          createdAt: '2026-01-01T08:00:00Z',
          updatedAt: '2026-01-01T08:00:00Z',
        });
        modified = true;
      }
    }

    // Ensure MASTER account exists
    const masterExists = users.some(
      u => u.role === 'MASTER' || u.email.toLowerCase() === 'bcmubarok@gmail.com' || u.id === 'usr-master-1'
    );
    if (!masterExists) {
      users.unshift({
        id: 'usr-master-1',
        npp: 'MASTER001',
        name: 'B.C. Mubarok (Master / Pemilik)',
        email: 'bcmubarok@gmail.com',
        jabatan: 'Pemilik Sistem (Master / Super Admin)',
        teamId: 'team-tl',
        role: 'MASTER',
        status: 'Aktif',
        passwordHash: defaultHash,
        salt: defaultSalt,
        createdAt: '2026-01-01T08:00:00Z',
        updatedAt: '2026-01-01T08:00:00Z',
      });
      modified = true;
    }

    if (modified) {
      setStorage(STORAGE_KEYS.USERS, users);
    }

    return users;
  },
  saveUsers: (users: User[]): void => setStorage(STORAGE_KEYS.USERS, users),
  getUserById: (id: string): User | undefined => {
    return storageService.getUsers().find(u => u.id === id);
  },
  getUserByNppOrEmail: (identifier: string): User | undefined => {
    const trimmed = identifier.trim().toLowerCase();
    return storageService.getUsers().find(
      u => u.npp.toLowerCase() === trimmed || u.email.toLowerCase() === trimmed
    );
  },
  saveUser: (user: User): void => {
    const users = storageService.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = { ...user, updatedAt: new Date().toISOString() };
    } else {
      users.push({ ...user, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    setStorage(STORAGE_KEYS.USERS, users);
  },
  deleteUser: (id: string): void => {
    const users = storageService.getUsers().filter(u => u.id !== id);
    setStorage(STORAGE_KEYS.USERS, users);
  },

  // Teams
  getTeams: (): Team[] => getStorage(STORAGE_KEYS.TEAMS, DEFAULT_TEAMS),
  saveTeams: (teams: Team[]): void => setStorage(STORAGE_KEYS.TEAMS, teams),

  // Schedules (Aktif)
  getSchedules: (): ScheduleEntry[] => getStorage(STORAGE_KEYS.SCHEDULES, []),
  saveSchedules: (schedules: ScheduleEntry[]): void => setStorage(STORAGE_KEYS.SCHEDULES, schedules),
  updateScheduleCell: (userId: string, date: string, shiftCode: string, scheduleType: 'PETUGAS' | 'TL' | 'QA', updaterId: string): void => {
    const schedules = storageService.getSchedules();
    const user = storageService.getUserById(userId);
    const existingIndex = schedules.findIndex(s => s.userId === userId && s.date === date);
    
    if (existingIndex >= 0) {
      schedules[existingIndex] = {
        ...schedules[existingIndex],
        shiftCode,
        updatedBy: updaterId,
        updatedAt: new Date().toISOString(),
      };
    } else {
      schedules.push({
        id: `sch-${userId}-${date}-${Date.now()}`,
        userId,
        teamId: user?.teamId || 'team-1',
        date,
        shiftCode,
        scheduleType,
        createdBy: updaterId,
        updatedBy: updaterId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    setStorage(STORAGE_KEYS.SCHEDULES, schedules);
  },

  // Baseline Schedules (JADWAL AWAL)
  getBaselineSchedules: (): BaselineScheduleEntry[] => getStorage(STORAGE_KEYS.BASELINE_SCHEDULES, []),
  saveBaselineSchedules: (schedules: BaselineScheduleEntry[]): void => setStorage(STORAGE_KEYS.BASELINE_SCHEDULES, schedules),

  // Shift requirements
  getShiftRequirements: (): ShiftRequirement[] => getStorage(STORAGE_KEYS.SHIFT_REQUIREMENTS, []),
  saveShiftRequirements: (reqs: ShiftRequirement[]): void => setStorage(STORAGE_KEYS.SHIFT_REQUIREMENTS, reqs),

  // Approvals
  getApprovals: (): ApprovalRequest[] => getStorage(STORAGE_KEYS.APPROVALS, []),
  saveApprovals: (apps: ApprovalRequest[]): void => setStorage(STORAGE_KEYS.APPROVALS, apps),
  saveApproval: (app: ApprovalRequest): void => storageService.updateApproval(app),
  addApproval: (app: ApprovalRequest): void => {
    const list = storageService.getApprovals();
    list.unshift(app);
    setStorage(STORAGE_KEYS.APPROVALS, list);
  },
  updateApproval: (app: ApprovalRequest): void => {
    const list = storageService.getApprovals();
    const idx = list.findIndex(a => a.id === app.id);
    if (idx >= 0) {
      list[idx] = app;
      setStorage(STORAGE_KEYS.APPROVALS, list);
    }
  },

  // Senada
  getSenadaAssignments: (): SenadaAssignment[] => getStorage(STORAGE_KEYS.SENADA, []),
  saveSenadaAssignments: (list: SenadaAssignment[]): void => setStorage(STORAGE_KEYS.SENADA, list),
  getSenadaHistory: (): SenadaHistory[] => getStorage(STORAGE_KEYS.SENADA_HISTORY, []),
  addSenadaHistory: (history: SenadaHistory): void => {
    const list = storageService.getSenadaHistory();
    list.unshift(history);
    setStorage(STORAGE_KEYS.SENADA_HISTORY, list);
  },

  // Bank Soal & Exams
  getQuestions: (): Question[] => {
    const list = getStorage<Question[]>(STORAGE_KEYS.QUESTIONS, []);
    if (!list || list.length === 0) return [];
    // If no essay question is found in existing stored list, add sample essay question
    const hasEssay = list.some(q => q.type === 'ESSAY');
    if (!hasEssay) {
      list.push({
        id: 'q-004',
        type: 'ESSAY',
        questionText: 'Jelaskan prosedur yang harus dilakukan Petugas ketika menghadapi kendala eskalasi pengaduan pada kategori IP (Informasi dan Pengaduan)!',
        category: 'SOP Pelayanan',
        difficulty: 'Sedang',
        idealAnswer: '1. Catat nomor tiket pengaduan dan identitas pelapor.\n2. Identifikasi tingkat urgensi masalah.\n3. Hubungi Team Leader jaga untuk koordinasi eskalasi.\n4. Berikan informasi estimasi waktu penyelesaian kepada pelapor secara sopan.\n5. Perbarui status tiket pada sistem.',
        gradingRubric: 'Mencakup identifikasi masalah (25%), komunikasi SOP (25%), koordinasi dengan TL (25%), dan pembaruan sistem tiket (25%).',
        createdAt: '2026-09-01T00:00:00Z',
      });
      setStorage(STORAGE_KEYS.QUESTIONS, list);
    }
    return list;
  },
  saveQuestions: (q: Question[]): void => setStorage(STORAGE_KEYS.QUESTIONS, q),
  saveQuestion: (q: Question): void => {
    const list = storageService.getQuestions();
    const idx = list.findIndex(item => item.id === q.id);
    if (idx >= 0) list[idx] = q;
    else list.push(q);
    storageService.saveQuestions(list);
  },
  deleteQuestion: (id: string): void => {
    const list = storageService.getQuestions().filter(q => q.id !== id);
    storageService.saveQuestions(list);
  },
  getExams: (): Exam[] => getStorage(STORAGE_KEYS.EXAMS, []),
  saveExams: (exams: Exam[]): void => setStorage(STORAGE_KEYS.EXAMS, exams),
  saveExam: (exam: Exam): void => {
    const list = storageService.getExams();
    const idx = list.findIndex(item => item.id === exam.id);
    if (idx >= 0) list[idx] = exam;
    else list.push(exam);
    storageService.saveExams(list);
  },
  deleteExam: (id: string): void => {
    const list = storageService.getExams().filter(e => e.id !== id);
    storageService.saveExams(list);
  },
  getExamSubmissions: (): ExamSubmission[] => getStorage(STORAGE_KEYS.EXAM_SUBMISSIONS, []),
  saveExamSubmissions: (subs: ExamSubmission[]): void => setStorage(STORAGE_KEYS.EXAM_SUBMISSIONS, subs),
  saveExamSubmission: (sub: ExamSubmission): void => {
    const list = storageService.getExamSubmissions();
    const idx = list.findIndex(item => item.id === sub.id);
    if (idx >= 0) list[idx] = sub;
    else list.push(sub);
    storageService.saveExamSubmissions(list);
  },
  addExamSubmission: (sub: ExamSubmission): void => {
    const list = storageService.getExamSubmissions();
    list.unshift(sub);
    setStorage(STORAGE_KEYS.EXAM_SUBMISSIONS, list);
  },

  // Notifications
  getNotifications: (): NotificationItem[] => getStorage(STORAGE_KEYS.NOTIFICATIONS, []),
  saveNotifications: (items: NotificationItem[]): void => setStorage(STORAGE_KEYS.NOTIFICATIONS, items),
  addNotification: (item: Partial<NotificationItem> & { title: string; message: string; type: NotificationItem['type'] }): void => {
    const list = storageService.getNotifications();
    const newItem: NotificationItem = {
      id: item.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: item.title,
      message: item.message,
      type: item.type,
      recipientUserId: item.recipientUserId || item.userId,
      userId: item.userId || item.recipientUserId,
      targetRole: item.targetRole,
      read: item.read ?? false,
      linkAction: item.linkAction,
      linkRoute: item.linkRoute,
      createdAt: item.createdAt || new Date().toISOString(),
    };
    list.unshift(newItem);
    setStorage(STORAGE_KEYS.NOTIFICATIONS, list);
  },

  // Audit Logs
  getAuditLogs: (): AuditLog[] => {
    const list = getStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    if (!list || list.length < 5) {
      const now = new Date();
      const iso = (minsAgo: number) => new Date(now.getTime() - minsAgo * 60 * 1000).toISOString();

      const sampleLogs: AuditLog[] = [
        {
          id: 'log-seed-001',
          userId: 'usr-master-1',
          userName: 'B.C. Mubarok (Master / Pemilik)',
          userRole: 'MASTER',
          action: 'Pemeriksaan Sistem & Audit Aktivitas',
          module: 'Master Audit Trail',
          timestamp: iso(5),
          notes: 'Master Owner mengakses panel audit untuk memonitor riwayat seluruh aktivitas operasional.',
        },
        {
          id: 'log-seed-002',
          userId: 'usr-tl-1',
          userName: 'Siti Rahmawati (TL 1)',
          userRole: 'TL 1',
          action: 'Verifikasi & Approval Tukar Shift',
          module: 'Persetujuan (Approval)',
          timestamp: iso(25),
          notes: 'Menyetujui permohonan tukar jadwal tiket #REQ-2026-001 (Andi Saputra swap Budi Santoso).',
          dataBefore: 'Status: Pending',
          dataAfter: 'Status: Approved oleh Siti Rahmawati (TL 1)',
        },
        {
          id: 'log-seed-003',
          userId: 'usr-kor-1',
          userName: 'Budi Pratama (Koordinator)',
          userRole: 'KOORDINATOR',
          action: 'Pembaruan Kebutuhan Shift',
          module: 'Jadwal Operasional',
          timestamp: iso(45),
          notes: 'Menyesuaikan alokasi kebutuhan shift P1 dan P2 untuk Unit Layanan Terpadu.',
          dataBefore: 'Shift P1 Req: 2',
          dataAfter: 'Shift P1 Req: 3',
        },
        {
          id: 'log-seed-004',
          userId: 'usr-pet-1',
          userName: 'Andi Saputra',
          userRole: 'PETUGAS',
          action: 'Pengajuan Permohonan Tukar Shift',
          module: 'Persetujuan (Approval)',
          timestamp: iso(70),
          notes: 'Mengajukan permohonan pertukaran jadwal dinas shift P1 ke P2 ditujukan ke TL 1.',
        },
        {
          id: 'log-seed-005',
          userId: 'usr-tl-2',
          userName: 'Bambang Wijaya (TL 2)',
          userRole: 'TL 2',
          action: 'Input Butir Soal Baru (Essay)',
          module: 'Bank Soal',
          timestamp: iso(110),
          notes: 'Menambahkan soal studi kasus penanganan komplain kategori IP beserta rubrik penilaian ke Bank Soal.',
        },
        {
          id: 'log-seed-006',
          userId: 'usr-qa-1',
          userName: 'Ahmad Fauzi (QA)',
          userRole: 'QA',
          action: 'Pembaruan Log Kategori Senada',
          module: 'Kategori Senada',
          timestamp: iso(160),
          notes: 'Melakukan re-evaluasi klasifikasi Senada kategori IM (Investigasi Masalah) pada tiket layanan.',
          dataBefore: 'Kategori: PM',
          dataAfter: 'Kategori: IM',
        },
        {
          id: 'log-seed-007',
          userId: 'usr-pet-2',
          userName: 'Budi Santoso',
          userRole: 'PETUGAS',
          action: 'Menyelesaikan Uji Pemahaman',
          module: 'Uji Pemahaman',
          timestamp: iso(220),
          notes: 'Budi Santoso menyelesaikan Ujian SOP Pelayanan Q3 dengan skor 85 (LULUS).',
        },
        {
          id: 'log-seed-008',
          userId: 'usr-tl-3',
          userName: 'Ratna Sari (TL 3)',
          userRole: 'TL 3',
          action: 'Login Berhasil',
          module: 'Autentikasi',
          timestamp: iso(280),
          notes: 'Login ke dalam portal operasional melalui NPP: TL003.',
        },
        {
          id: 'log-seed-009',
          userId: 'usr-kor-1',
          userName: 'Budi Pratama (Koordinator)',
          userRole: 'KOORDINATOR',
          action: 'Edit Data User',
          module: 'Manajemen User',
          timestamp: iso(360),
          notes: 'Memperbarui profil dan penugasan tim petugas layanan.',
        },
        {
          id: 'log-seed-010',
          userId: 'usr-master-1',
          userName: 'B.C. Mubarok (Master / Pemilik)',
          userRole: 'MASTER',
          action: 'Inisialisasi Master Owner Control',
          module: 'Sistem',
          timestamp: iso(480),
          notes: 'Hak akses pemilik sistem diaktifkan dengan wewenang monitoring seluruh aktivitas pengguna.',
        }
      ];

      const merged = [...(list || []), ...sampleLogs];
      setStorage(STORAGE_KEYS.AUDIT_LOGS, merged);
      return merged;
    }
    return list;
  },
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>): void => {
    const list = storageService.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    list.unshift(newLog);
    // Keep max 1000 logs for extensive master audit tracking
    if (list.length > 1000) list.pop();
    setStorage(STORAGE_KEYS.AUDIT_LOGS, list);
  },

  // Settings
  getSettings: (): SystemSettings => getStorage(STORAGE_KEYS.SETTINGS, {
    appName: 'Sistem Operasional & Jadwal Petugas',
    organization: 'Instansi Layanan Terpadu',
    strictSwapRequirementEnforcement: true,
    allowPastScheduleEdit: false,
  }),
  saveSettings: (settings: SystemSettings): void => setStorage(STORAGE_KEYS.SETTINGS, settings),

  // Classroom Materials (PDF / PPT / PPTX)
  getClassroomMaterials: (): ClassroomMaterial[] => {
    const fallback: ClassroomMaterial[] = [
      {
        id: 'mat-001',
        title: 'SOP Pelayanan Kontak Layanan 1500225 Versi Terbaru',
        description: 'Standar Operasional Prosedur penanganan interaksi permohonan informasi, etika komunikasi telepon, dan eskalasi pengaduan.',
        fileType: 'PDF',
        fileName: 'SOP_Layanan_Kontak_1500225_Rev2026.pdf',
        fileSize: '2.4 MB',
        uploadedBy: 'usr-kor-1',
        uploadedByName: 'Budi Pratama (Koordinator)',
        uploadedByRole: 'KOORDINATOR',
        uploadedAt: '2026-09-10T09:30:00Z',
        viewCount: 48,
      },
      {
        id: 'mat-002',
        title: 'Panduan Klasifikasi Kategori Senada (PM, IP, IM)',
        description: 'Pedoman penentuan kategori tiket Senada: Permintaan dan Informasi (PM), Informasi dan Pengaduan (IP), dan Informasi Permintaan (IM).',
        fileType: 'PPT',
        fileName: 'Panduan_Klasifikasi_Senada_PM_IP_IM.pptx',
        fileSize: '4.8 MB',
        uploadedBy: 'usr-tl-1',
        uploadedByName: 'Siti Rahmawati (TL)',
        uploadedByRole: 'TL',
        uploadedAt: '2026-09-12T14:15:00Z',
        viewCount: 36,
      },
      {
        id: 'mat-003',
        title: 'Materi Pelatihan Komunikasi Efektif & Service Excellence',
        description: 'Bahan ajar pelatihan berkala peningkatan kompetensi respon ramah, empati, dan resolusi tuntas pada kontak pertama (FCR).',
        fileType: 'PDF',
        fileName: 'Modul_Service_Excellence_Petugas.pdf',
        fileSize: '1.9 MB',
        uploadedBy: 'usr-qa-1',
        uploadedByName: 'Ahmad Fauzi (QA)',
        uploadedByRole: 'QA',
        uploadedAt: '2026-09-15T11:00:00Z',
        viewCount: 29,
      }
    ];
    return getStorage(STORAGE_KEYS.CLASSROOM_MATERIALS, fallback);
  },
  saveClassroomMaterials: (materials: ClassroomMaterial[]): void => {
    setStorage(STORAGE_KEYS.CLASSROOM_MATERIALS, materials);
  },
  saveClassroomMaterial: (material: ClassroomMaterial): void => {
    const list = storageService.getClassroomMaterials();
    const idx = list.findIndex(m => m.id === material.id);
    if (idx >= 0) list[idx] = material;
    else list.unshift(material);
    setStorage(STORAGE_KEYS.CLASSROOM_MATERIALS, list);
  },
  deleteClassroomMaterial: (id: string): void => {
    const list = storageService.getClassroomMaterials().filter(m => m.id !== id);
    setStorage(STORAGE_KEYS.CLASSROOM_MATERIALS, list);
  },

  // Classroom Discussions (Discussion forum between Petugas, TL, QA)
  getClassroomDiscussions: (): ClassroomDiscussion[] => {
    const fallback: ClassroomDiscussion[] = [
      {
        id: 'disc-001',
        topic: 'Pembahasan Soal Bank #1: Kepanjangan Kategori PM',
        content: 'Izin bertanya kepada TL/QA, pada soal uji pemahaman terkait kategori PM, apakah permohonan data statistik dinas langsung masuk ke PM atau perlu dievaluasi ke IM terlebih dahulu?',
        questionRef: 'Soal #1 - Kategori Senada',
        authorId: 'usr-pet-1',
        authorName: 'Andi Saputra',
        authorRole: 'PETUGAS',
        createdAt: '2026-09-16T10:00:00Z',
        replies: [
          {
            id: 'rep-001',
            content: 'Halo Mas Andi, jika pemohon menanyakan data publik yang sudah tersedia di portal, masuk PM. Namun jika membutuhkan proses penelusuran lebih lanjut, dialihkan ke IM.',
            authorId: 'usr-tl-1',
            authorName: 'Siti Rahmawati (TL)',
            authorRole: 'TL',
            createdAt: '2026-09-16T10:20:00Z',
          },
          {
            id: 'rep-002',
            content: 'Tambahan dari QA: Pastikan selalu verifikasi identitas pemohon dan catat NPP petugas di log Senada sesuai SOP.',
            authorId: 'usr-qa-1',
            authorName: 'Ahmad Fauzi (QA)',
            authorRole: 'QA',
            createdAt: '2026-09-16T11:05:00Z',
          }
        ]
      },
      {
        id: 'disc-002',
        topic: 'Eskalasi Tiket Pengaduan Kategori IP saat Shift Malam (P5)',
        content: 'Rekan-rekan TL, untuk pengaduan dengan tingkat urgensi tinggi yang masuk pada shift P5 (22.00 - 06.00), apakah langsung kontak on-call supervisor atau dicatat dulu di logbook?',
        questionRef: 'SOP Shift P5 & Eskalasi IP',
        authorId: 'usr-pet-3',
        authorName: 'Citra Permata',
        authorRole: 'PETUGAS',
        createdAt: '2026-09-17T02:15:00Z',
        replies: [
          {
            id: 'rep-003',
            content: 'Sesuai SOP Rev2026 pada materi PDF hal. 14, tiket tier-1 langsung dieskalasikan via pesan darurat grup dinas setelah mencatat nomor tiket.',
            authorId: 'usr-tl-1',
            authorName: 'Siti Rahmawati (TL)',
            authorRole: 'TL',
            createdAt: '2026-09-17T06:30:00Z',
          }
        ]
      }
    ];
    return getStorage(STORAGE_KEYS.CLASSROOM_DISCUSSIONS, fallback);
  },
  saveClassroomDiscussions: (discussions: ClassroomDiscussion[]): void => {
    setStorage(STORAGE_KEYS.CLASSROOM_DISCUSSIONS, discussions);
  },
  saveClassroomDiscussion: (discussion: ClassroomDiscussion): void => {
    const list = storageService.getClassroomDiscussions();
    const idx = list.findIndex(d => d.id === discussion.id);
    if (idx >= 0) list[idx] = discussion;
    else list.unshift(discussion);
    setStorage(STORAGE_KEYS.CLASSROOM_DISCUSSIONS, list);
  },
  addDiscussionReply: (discussionId: string, reply: ClassroomDiscussionReply): void => {
    const list = storageService.getClassroomDiscussions();
    const disc = list.find(d => d.id === discussionId);
    if (disc) {
      disc.replies.push(reply);
      setStorage(STORAGE_KEYS.CLASSROOM_DISCUSSIONS, list);
    }
  },
  deleteClassroomDiscussion: (id: string): void => {
    const list = storageService.getClassroomDiscussions().filter(d => d.id !== id);
    setStorage(STORAGE_KEYS.CLASSROOM_DISCUSSIONS, list);
  },

  // Shift Definitions (Referensi & Master Shift Dinas)
  getShiftDefinitions: (): Record<string, ShiftMeta> => {
    const stored = getStorage<Record<string, ShiftMeta> | null>(STORAGE_KEYS.SHIFTS, null);
    if (!stored || Object.keys(stored).length === 0) {
      setStorage(STORAGE_KEYS.SHIFTS, DEFAULT_SHIFT_DEFINITIONS);
      return { ...DEFAULT_SHIFT_DEFINITIONS };
    }
    return stored;
  },

  getShiftMeta: (code: string): ShiftMeta => {
    const defs = storageService.getShiftDefinitions();
    if (defs[code]) return defs[code];
    return {
      code,
      name: `Shift ${code}`,
      category: 'Custom',
      colorBg: 'bg-slate-100',
      colorText: 'text-slate-800',
      colorBorder: 'border-slate-300',
      hexBg: '#f1f5f9',
      hexText: '#1e293b',
    };
  },

  saveShiftDefinitions: (defs: Record<string, ShiftMeta>): void => {
    setStorage(STORAGE_KEYS.SHIFTS, defs);
  },

  addShiftDefinition: (
    shift: ShiftMeta,
    actorName?: string,
    actorRole?: string
  ): { success: boolean; message?: string } => {
    const defs = storageService.getShiftDefinitions();
    const upperCode = shift.code.trim().toUpperCase();

    if (!upperCode) {
      return { success: false, message: 'Kode shift tidak boleh kosong.' };
    }
    if (upperCode.length > 8) {
      return { success: false, message: 'Kode shift maksimal 8 karakter.' };
    }
    if (defs[upperCode]) {
      return { success: false, message: `Kode shift "${upperCode}" sudah ada di sistem.` };
    }

    const newShift: ShiftMeta = {
      code: upperCode,
      name: shift.name.trim(),
      category: shift.category || 'Shift',
      colorBg: shift.colorBg || 'bg-slate-100',
      colorText: shift.colorText || 'text-slate-900',
      colorBorder: shift.colorBorder || 'border-slate-300',
      hexBg: shift.hexBg || '#e2e8f0',
      hexText: shift.hexText || '#0f172a',
      startTime: shift.startTime?.trim() || undefined,
      endTime: shift.endTime?.trim() || undefined,
      description: shift.description?.trim() || undefined,
      isSystemDefault: false,
    };

    defs[upperCode] = newShift;
    storageService.saveShiftDefinitions(defs);

    // Audit log
    storageService.addAuditLog({
      userId: 'system',
      userName: actorName || 'Admin',
      userRole: (actorRole as any) || 'MASTER',
      action: 'Tambah Referensi Shift',
      module: 'Pengaturan Sistem',
      dataAfter: JSON.stringify(newShift),
      notes: `Menambahkan referensi shift baru [${upperCode}] ${shift.name} (${shift.category})`,
    });

    return { success: true };
  },

  updateShiftDefinition: (
    code: string,
    updated: Partial<ShiftMeta>,
    actorName?: string,
    actorRole?: string
  ): { success: boolean; message?: string } => {
    const defs = storageService.getShiftDefinitions();
    const upperCode = code.trim().toUpperCase();

    if (!defs[upperCode]) {
      return { success: false, message: `Kode shift "${upperCode}" tidak ditemukan.` };
    }

    const before = { ...defs[upperCode] };
    defs[upperCode] = {
      ...defs[upperCode],
      ...updated,
      code: upperCode, // cannot change code directly
      name: updated.name ? updated.name.trim() : defs[upperCode].name,
    };

    storageService.saveShiftDefinitions(defs);

    storageService.addAuditLog({
      userId: 'system',
      userName: actorName || 'Admin',
      userRole: (actorRole as any) || 'MASTER',
      action: 'Ubah Referensi Shift',
      module: 'Pengaturan Sistem',
      dataBefore: JSON.stringify(before),
      dataAfter: JSON.stringify(defs[upperCode]),
      notes: `Memperbarui referensi shift [${upperCode}] ${defs[upperCode].name}`,
    });

    return { success: true };
  },

  deleteShiftDefinition: (
    code: string,
    actorName?: string,
    actorRole?: string
  ): { success: boolean; message?: string } => {
    const upperCode = code.trim().toUpperCase();

    if (upperCode === 'X') {
      return {
        success: false,
        message: 'Kode "X" (Libur) adalah status default sistem dan tidak boleh dihapus.',
      };
    }

    const defs = storageService.getShiftDefinitions();
    if (!defs[upperCode]) {
      return { success: false, message: `Kode shift "${upperCode}" tidak ditemukan.` };
    }

    const removed = defs[upperCode];
    delete defs[upperCode];
    storageService.saveShiftDefinitions(defs);

    storageService.addAuditLog({
      userId: 'system',
      userName: actorName || 'Admin',
      userRole: (actorRole as any) || 'MASTER',
      action: 'Hapus Referensi Shift',
      module: 'Pengaturan Sistem',
      dataBefore: JSON.stringify(removed),
      notes: `Menghapus referensi shift [${upperCode}] ${removed.name}`,
    });

    return { success: true };
  },

  resetShiftDefinitions: (actorName?: string, actorRole?: string): void => {
    storageService.saveShiftDefinitions(DEFAULT_SHIFT_DEFINITIONS);
    storageService.addAuditLog({
      userId: 'system',
      userName: actorName || 'Admin',
      userRole: (actorRole as any) || 'MASTER',
      action: 'Reset Referensi Shift',
      module: 'Pengaturan Sistem',
      notes: 'Mengembalikan seluruh referensi shift dinas ke standar bawaan sistem',
    });
  },
};
