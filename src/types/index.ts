export type RoleType =
  | 'MASTER'
  | 'KOORDINATOR'
  | 'TL 1'
  | 'TL 2'
  | 'TL 3'
  | 'TL 4'
  | 'TL 5'
  | 'TL 6'
  | 'TL'
  | 'QA'
  | 'PETUGAS';

export type UserStatus = 'Aktif' | 'Nonaktif';

export interface User {
  id: string;
  npp: string;
  name: string;
  email: string;
  jabatan: string;
  teamId: string; // 'team-1' ... 'team-6', or 'tl-team', 'qa-team'
  role: RoleType;
  status: UserStatus;
  avatarUrl?: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  type: 'PETUGAS' | 'TL' | 'QA';
}

export type ShiftCode =
  | 'P1'
  | 'P2'
  | 'P3'
  | 'P4'
  | 'P5'
  | 'P1A'
  | 'P2A'
  | 'P3A'
  | 'P4A'
  | 'X'
  | 'C'
  | 'I'
  | 'S'
  | 'M'
  | 'K'
  | string; // Support custom shift codes

export interface ShiftMeta {
  code: string;
  name: string;
  category: 'Shift' | 'WFA' | 'Status' | 'Custom';
  colorBg: string;
  colorText: string;
  colorBorder: string;
  hexBg?: string;
  hexText?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  isSystemDefault?: boolean;
}

export type ScheduleCategory = 'PETUGAS' | 'TL' | 'QA';

export interface ScheduleEntry {
  id: string;
  userId: string;
  teamId: string;
  date: string; // YYYY-MM-DD
  shiftCode: ShiftCode;
  scheduleType: ScheduleCategory;
  isCustom?: boolean;
  customLabel?: string;
  notes?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BaselineScheduleEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  shiftCode: ShiftCode;
  scheduleType: ScheduleCategory;
  createdAt: string;
}

export interface ScheduleChangeRecord {
  id: string;
  userId: string;
  userName: string;
  userNpp: string;
  date: string; // YYYY-MM-DD
  oldShift: string;
  newShift: string;
  type: 'EDIT_ADMIN' | 'APPROVAL_SWAP' | 'BULK_ADMIN';
  changedBy: string;
  changedByName: string;
  notes?: string;
  timestamp: string;
}

export interface ShiftRequirement {
  shiftCode: string;
  requiredCount: number;
}

export type ApprovalType =
  | 'Cuti'
  | 'Izin'
  | 'Sakit'
  | 'Tukar Jadwal'
  | 'Perubahan Shift'
  | 'Perubahan Kategori';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ApprovalRequest {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userRole: RoleType;
  teamId: string;
  userTeamId?: string;
  type: ApprovalType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  attachmentName?: string;
  status: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  // Target TL destination
  targetTlRole?: 'TL 1' | 'TL 2' | 'TL 3' | 'TL 4' | 'TL 5' | 'TL 6' | string;
  targetTlUserId?: string;
  targetTlUserName?: string;
  // Details specific to Tukar Jadwal (Shift Swap)
  swapWithUserId?: string;
  swapWithUserName?: string;
  swapDate?: string; // YYYY-MM-DD
  originalShiftUserA?: string; // Shift awal pemohon
  proposedShiftUserA?: string; // Shift yang akan ditukar / shift baru pemohon
  originalShiftUserB?: string; // Shift awal rekan
  proposedShiftUserB?: string; // Shift yang didapat rekan
  // Details specific to Perubahan Shift & Perubahan Kategori
  currentShift?: string;
  requestedShift?: string;
  currentCategory?: SenadaCategoryCode | string;
  requestedCategory?: SenadaCategoryCode | string;
  // Reviewer info
  reviewedByUserId?: string;
  reviewedByUserName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type SenadaCategoryCode = 'PM' | 'IP' | 'IM';
export type SenadaCategory = SenadaCategoryCode;

export interface SenadaAssignment {
  id: string;
  userId: string;
  npp: string;
  userName: string;
  teamId: string;
  date: string; // YYYY-MM-DD
  shiftCode: ShiftCode;
  category: SenadaCategoryCode;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SenadaHistory {
  id: string;
  assignmentId: string;
  userId: string;
  date: string;
  previousCategory: SenadaCategoryCode;
  newCategory: SenadaCategoryCode;
  reason: string;
  changedBy: string;
  changedAt: string;
}

export type QuestionType = 'PILIHAN_GANDA' | 'ESSAY';
export type DifficultyLevel = 'Mudah' | 'Sedang' | 'Sulit';

export interface QuestionOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface Question {
  id: string;
  type?: QuestionType;
  questionText: string;
  category: string;
  difficulty?: DifficultyLevel;
  imageUrl?: string;
  // Multiple Choice fields
  options?: QuestionOption[];
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  // Essay fields
  idealAnswer?: string;
  gradingRubric?: string;
  createdAt: string;
}

export type ExamType = 'Pre-Test' | 'Post-Test';
export type ExamStatus = 'Draft' | 'Aktif' | 'Selesai';

export interface Exam {
  id: string;
  title: string;
  type: ExamType;
  description: string;
  category?: string;
  durationMinutes: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  maxAttempts: number;
  passingGrade: number; // e.g. 75
  isLeaderboardEnabled?: boolean;
  questionIds: string[];
  status: ExamStatus;
  createdAt: string;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  examTitle: string;
  examType?: ExamType;
  userId: string;
  userName: string;
  userNpp: string;
  teamId?: string;
  userTeamId?: string;
  userJabatan?: string;
  startedAt?: string;
  submittedAt: string;
  durationSeconds: number;
  answers: Record<string, string> | any;
  essayScores?: Record<string, number>;
  score: number; // overall percentage 0-100
  correctCount: number;
  wrongCount?: number;
  totalQuestions?: number;
  unansweredCount?: number;
  isPassed: boolean;
  essayStatus?: 'Tidak Ada Essay' | 'Menunggu Penilaian' | 'Dinilai';
}

export interface NotificationItem {
  id: string;
  recipientUserId?: string; // empty means broadcast to admin
  userId?: string; // alias
  targetRole?: RoleType | 'ADMIN' | 'ALL';
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'SCHEDULE' | 'APPROVAL' | 'EXAM';
  read?: boolean;
  linkAction?: string;
  linkRoute?: string;
  createdAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: RoleType;
  action: string;
  module: string;
  timestamp: string;
  dataBefore?: string;
  dataAfter?: string;
  notes?: string;
}

export interface SystemSettings {
  appName: string;
  organization: string;
  strictSwapRequirementEnforcement: boolean;
  allowPastScheduleEdit: boolean;
}

export interface ClassroomMaterial {
  id: string;
  title: string;
  description: string;
  fileType: 'PDF' | 'PPT' | 'PPTX' | 'DOC' | 'OTHER';
  fileName: string;
  fileSize: string;
  fileData?: string; // Data URL / base64 or URL for reading/downloading
  uploadedBy: string;
  uploadedByName: string;
  uploadedByRole: RoleType;
  uploadedAt: string;
  viewCount?: number;
}

export interface ClassroomDiscussionReply {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: RoleType;
  authorAvatar?: string;
  createdAt: string;
}

export interface ClassroomDiscussion {
  id: string;
  topic: string;
  content: string;
  questionRef?: string; // Optional reference to specific question/material
  authorId: string;
  authorName: string;
  authorRole: RoleType;
  authorAvatar?: string;
  createdAt: string;
  replies: ClassroomDiscussionReply[];
}

export interface UserUtilization {
  id: string;
  npp: string;
  name: string;
  role: string;
  jabatan: string;
  accessCount: number; // Frekuensi akses web / login
  operationsCount: number; // Total aksi operasional / interaksi fitur
  utilizationRate: number; // Persentase pemanfaatan (%)
  primaryModule: string; // Modul yang paling sering dimanfaatkan
  lastActive: string; // Waktu terakhir akses
  trend: string; // e.g. '+24% minggu ini'
  rank: number;
  badge?: string;
}

