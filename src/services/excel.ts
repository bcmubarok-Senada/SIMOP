import * as XLSX from 'xlsx';
import { ScheduleEntry, User, SenadaAssignment, Question, ExamSubmission } from '../types';

/**
 * Excel Utility for Import, Export, and Template Generation using sheetjs (xlsx)
 */

// Download helper for browser
export function downloadWorkbook(workbook: XLSX.WorkBook, filename: string): void {
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

// 1. SCHEDULE TEMPLATE & EXPORT/IMPORT
export function exportSchedulesToExcel(
  schedules: ScheduleEntry[],
  users: User[],
  year: number,
  month: number,
  filename = 'Jadwal_Operasional.xlsx'
): void {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dateHeaders: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    dateHeaders.push(String(d));
  }

  const rows: any[] = [];
  users.forEach((user, index) => {
    const row: any = {
      'No': index + 1,
      'NPP': user.npp,
      'Nama': user.name,
      'Jabatan': user.jabatan,
      'Team': user.teamId,
      'Role': user.role,
    };

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const sched = schedules.find(s => s.userId === user.id && s.date === dateStr);
      row[`Tgl_${d}`] = sched ? sched.shiftCode : 'X';
    }
    rows.push(row);
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Jadwal');
  downloadWorkbook(workbook, filename);
}

export function downloadScheduleTemplate(year: number, month: number): void {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const sampleData: any[] = [
    {
      'NPP': 'PET001',
      'Nama': 'Andi Saputra',
      'Team': 'team-1',
    },
    {
      'NPP': 'PET002',
      'Nama': 'Dewi Lestari',
      'Team': 'team-2',
    },
  ];

  for (let d = 1; d <= daysInMonth; d++) {
    sampleData[0][`Tgl_${d}`] = d % 5 === 0 ? 'X' : 'P1';
    sampleData[1][`Tgl_${d}`] = d % 5 === 0 ? 'X' : 'P2';
  }

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Jadwal');
  downloadWorkbook(workbook, `Template_Jadwal_${year}_${month + 1}.xlsx`);
}

export interface ScheduleImportResult {
  validCount: number;
  errors: { row: number; npp: string; message: string }[];
  importedEntries: { npp: string; date: string; shiftCode: string }[];
}

export async function parseScheduleExcel(
  file: File,
  validNpps: Set<string>,
  validShifts: Set<string>,
  year: number,
  month: number
): Promise<ScheduleImportResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

  const errors: { row: number; npp: string; message: string }[] = [];
  const importedEntries: { npp: string; date: string; shiftCode: string }[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  jsonData.forEach((row, idx) => {
    const rowNum = idx + 2; // +2 for 1-based and header
    const npp = String(row['NPP'] || row['npp'] || '').trim();

    if (!npp) {
      errors.push({ row: rowNum, npp: '-', message: 'Kolom NPP kosong' });
      return;
    }

    if (!validNpps.has(npp.toLowerCase())) {
      errors.push({ row: rowNum, npp, message: `NPP "${npp}" tidak ditemukan di master user aktif` });
      return;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const shiftVal = String(row[`Tgl_${d}`] || row[String(d)] || '').trim().toUpperCase();
      if (shiftVal) {
        if (!validShifts.has(shiftVal)) {
          errors.push({
            row: rowNum,
            npp,
            message: `Kode shift "${shiftVal}" pada tanggal ${d} tidak valid`,
          });
        } else {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          importedEntries.push({
            npp,
            date: dateStr,
            shiftCode: shiftVal,
          });
        }
      }
    }
  });

  return {
    validCount: importedEntries.length,
    errors,
    importedEntries,
  };
}

// 2. SENADA IMPORT / EXPORT
export function exportSenadaToExcel(assignments: SenadaAssignment[], filename = 'Kategori_Senada.xlsx'): void {
  const data = assignments.map((item, idx) => ({
    'No': idx + 1,
    'NPP': item.npp,
    'Nama Petugas': item.userName,
    'Team': item.teamId,
    'Tanggal': item.date,
    'Sift': item.shiftCode,
    'Kategori Senada': item.category,
    'Catatan': item.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Senada');
  downloadWorkbook(workbook, filename);
}

export function exportSenadaMatrixToExcel(
  assignments: SenadaAssignment[],
  schedules: ScheduleEntry[],
  users: User[],
  year: number,
  month: number,
  filename = 'Jadwal_Kategori_Senada.xlsx'
): void {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rows: any[] = [];

  users.forEach((user, idx) => {
    const row: any = {
      'No': idx + 1,
      'NPP': user.npp,
      'Nama Petugas': user.name,
      'Team': user.teamId,
    };

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const sched = schedules.find(s => s.userId === user.id && s.date === dateStr);
      const shiftCode = sched ? sched.shiftCode : 'X';
      const isOff = ['X', 'C', 'I', 'S'].includes(shiftCode);
      if (isOff) {
        row[`Tgl_${d}`] = shiftCode === 'X' ? 'X (Libur)' : shiftCode;
      } else {
        const senada = assignments.find(a => a.userId === user.id && a.date === dateStr);
        row[`Tgl_${d}`] = senada ? `${shiftCode} [${senada.category}]` : `${shiftCode} [Belum Plot]`;
      }
    }
    rows.push(row);
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Kategori_Senada');
  downloadWorkbook(workbook, filename);
}

export function downloadSenadaTemplate(): void {
  const sample = [
    {
      'NPP': 'PET001',
      'Nama': 'Andi Saputra',
      'Team': 'team-1',
      'Tanggal': '2026-09-20',
      'Sift': 'P1',
      'Kategori': 'PM',
      'Catatan': 'Contoh format (PM / IP / IM)',
    },
    {
      'NPP': 'PET002',
      'Nama': 'Dewi Lestari',
      'Team': 'team-2',
      'Tanggal': '2026-09-20',
      'Sift': 'P2',
      'Kategori': 'IP',
      'Catatan': 'Contoh format',
    }
  ];
  const worksheet = XLSX.utils.json_to_sheet(sample);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Senada');
  downloadWorkbook(workbook, 'Template_Kategori_Senada.xlsx');
}

// 3. BANK SOAL TEMPLATE & EXPORT/IMPORT
export function downloadQuestionTemplate(): void {
  const sample = [
    {
      'Tipe': 'PILIHAN_GANDA',
      'Pertanyaan': 'Apa kepanjangan dari kategori Senada PM?',
      'Kategori': 'Kategori Senada',
      'Tingkat Kesulitan': 'Mudah',
      'Pilihan A': 'Permintaan dan Informasi',
      'Pilihan B': 'Pengaduan Masalah',
      'Pilihan C': 'Penyampaian Materi',
      'Pilihan D': 'Proses Mediasi',
      'Kunci Jawaban': 'A',
      'Pembahasan': 'PM singkatan Permintaan dan Informasi.',
      'Jawaban Ideal': '',
      'Rubrik Penilaian': '',
    },
    {
      'Tipe': 'ESSAY',
      'Pertanyaan': 'Jelaskan alur eskalasi keluhan pelanggan kategori IP!',
      'Kategori': 'SOP Pelayanan',
      'Tingkat Kesulitan': 'Sedang',
      'Pilihan A': '',
      'Pilihan B': '',
      'Pilihan C': '',
      'Pilihan D': '',
      'Kunci Jawaban': '',
      'Pembahasan': '',
      'Jawaban Ideal': 'Catat nomor tiket, koordinasi dengan Team Leader, hubungi unit teknis...',
      'Rubrik Penilaian': 'Langkah eskalasi (50%), koordinasi TL (30%), keramahan (20%)',
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sample);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Bank_Soal');
  downloadWorkbook(workbook, 'Template_Bank_Soal.xlsx');
}

export function exportQuestionsToExcel(questions: Question[], filename = 'Bank_Soal.xlsx'): void {
  const data = questions.map(q => ({
    'ID': q.id,
    'Tipe': q.type,
    'Pertanyaan': q.questionText,
    'Kategori': q.category,
    'Tingkat Kesulitan': q.difficulty,
    'Pilihan A': q.optionA || '',
    'Pilihan B': q.optionB || '',
    'Pilihan C': q.optionC || '',
    'Pilihan D': q.optionD || '',
    'Kunci Jawaban': q.correctAnswer || '',
    'Pembahasan': q.explanation || '',
    'Jawaban Ideal': q.idealAnswer || '',
    'Rubrik Penilaian': q.gradingRubric || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Soal');
  downloadWorkbook(workbook, filename);
}

// 4. REPORT EXPORT HELPER
export function exportExamResultsToExcel(submissions: ExamSubmission[], filename = 'Laporan_Hasil_Ujian.xlsx'): void {
  const data = submissions.map((sub, idx) => ({
    'No': idx + 1,
    'Nama Peserta': sub.userName,
    'NPP': sub.userNpp,
    'Team': sub.teamId,
    'Jabatan': sub.userJabatan,
    'Judul Ujian': sub.examTitle,
    'Tipe': sub.examType,
    'Nilai': sub.score,
    'Benar': sub.correctCount,
    'Salah': sub.wrongCount,
    'Status': sub.isPassed ? 'Lulus' : 'Tidak Lulus',
    'Status Essay': sub.essayStatus,
    'Durasi (Detik)': sub.durationSeconds,
    'Waktu Selesai': sub.submittedAt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hasil_Ujian');
  downloadWorkbook(workbook, filename);
}

// Aliases for convenient importing
export const downloadBankSoalTemplate = downloadQuestionTemplate;
export const exportBankSoalToExcel = exportQuestionsToExcel;
export const exportLeaderboardToExcel = exportExamResultsToExcel;

// 5. PARSE BANK SOAL EXCEL
export async function parseBankSoalExcel(file: File): Promise<{
  validCount: number;
  errors: { row: number; message: string }[];
  questions: Question[];
}> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet);

  const errors: { row: number; message: string }[] = [];
  const questions: Question[] = [];

  jsonData.forEach((row, idx) => {
    const rowNum = idx + 2;
    const questionText = String(row['Pertanyaan'] || row['pertanyaan'] || row['Soal'] || '').trim();
    if (!questionText) {
      errors.push({ row: rowNum, message: 'Teks Pertanyaan kosong.' });
      return;
    }

    const typeStr = String(row['Tipe'] || row['tipe'] || 'PILIHAN_GANDA').trim().toUpperCase();
    const isEssay = typeStr === 'ESSAY';
    const category = String(row['Kategori'] || row['kategori'] || 'Standar Operasional Prosedur').trim();
    const difficulty = (row['Tingkat Kesulitan'] || row['kesulitan'] || 'Sedang') as any;

    if (isEssay) {
      questions.push({
        id: `q-imp-${Date.now()}-${idx}`,
        type: 'ESSAY',
        questionText,
        category,
        difficulty,
        idealAnswer: String(row['Jawaban Ideal'] || row['jawaban_ideal'] || '').trim(),
        gradingRubric: String(row['Rubrik Penilaian'] || row['rubrik'] || '').trim(),
        createdAt: new Date().toISOString(),
      });
    } else {
      const optA = String(row['Pilihan A'] || row['A'] || row['pilihan_a'] || '').trim();
      const optB = String(row['Pilihan B'] || row['B'] || row['pilihan_b'] || '').trim();
      const optC = String(row['Pilihan C'] || row['C'] || row['pilihan_c'] || '').trim();
      const optD = String(row['Pilihan D'] || row['D'] || row['pilihan_d'] || '').trim();
      const rawAns = String(row['Kunci Jawaban'] || row['kunci'] || row['Jawaban'] || 'A').trim().toUpperCase();
      const validAns = ['A', 'B', 'C', 'D'].includes(rawAns) ? (rawAns as 'A' | 'B' | 'C' | 'D') : 'A';

      if (!optA || !optB) {
        errors.push({ row: rowNum, message: 'Pilihan A dan B wajib diisi untuk soal pilihan ganda.' });
        return;
      }

      questions.push({
        id: `q-imp-${Date.now()}-${idx}`,
        type: 'PILIHAN_GANDA',
        questionText,
        category,
        difficulty,
        options: [
          { key: 'A', text: optA },
          { key: 'B', text: optB },
          { key: 'C', text: optC || '-' },
          { key: 'D', text: optD || '-' },
        ],
        optionA: optA,
        optionB: optB,
        optionC: optC || '-',
        optionD: optD || '-',
        correctAnswer: validAns,
        explanation: String(row['Pembahasan'] || row['pembahasan'] || '').trim(),
        createdAt: new Date().toISOString(),
      });
    }
  });

  return {
    validCount: questions.length,
    errors,
    questions,
  };
}

// 6. PARSE SENADA EXCEL
export async function parseSenadaExcel(file: File, users: User[]): Promise<{
  validCount: number;
  errors: { row: number; npp: string; message: string }[];
  assignments: SenadaAssignment[];
}> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet);

  const errors: { row: number; npp: string; message: string }[] = [];
  const assignments: SenadaAssignment[] = [];
  const validCategories = new Set(['PM', 'IP', 'IM']);

  jsonData.forEach((row, idx) => {
    const rowNum = idx + 2;
    const nppInput = String(row['NPP'] || row['npp'] || '').trim().toLowerCase();
    const nameInput = String(row['Nama Petugas'] || row['Nama'] || row['nama'] || '').trim().toLowerCase();
    const dateInput = String(row['Tanggal'] || row['tanggal'] || '').trim();
    const catInput = String(row['Kategori'] || row['Kategori Senada'] || row['kategori'] || '').trim().toUpperCase();
    const shiftInput = String(row['Sift'] || row['Shift'] || row['shift'] || 'P1').trim().toUpperCase();
    const notesInput = String(row['Catatan'] || row['catatan'] || '').trim();

    if (!nppInput && !nameInput) {
      errors.push({ row: rowNum, npp: '-', message: 'NPP atau Nama Petugas harus diisi.' });
      return;
    }

    const matchedUser = users.find(u => 
      (nppInput && u.npp.toLowerCase() === nppInput) || 
      (nameInput && u.name.toLowerCase().includes(nameInput))
    );

    if (!matchedUser) {
      errors.push({ row: rowNum, npp: nppInput || nameInput, message: `Petugas tidak ditemukan di sistem.` });
      return;
    }

    if (!dateInput || !/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      errors.push({ row: rowNum, npp: matchedUser.npp, message: `Format tanggal "${dateInput}" tidak valid (gunakan YYYY-MM-DD).` });
      return;
    }

    if (!validCategories.has(catInput)) {
      errors.push({ row: rowNum, npp: matchedUser.npp, message: `Kategori "${catInput}" tidak valid (hanya PM, IP, IM).` });
      return;
    }

    assignments.push({
      id: `senada-imp-${Date.now()}-${idx}`,
      userId: matchedUser.id,
      npp: matchedUser.npp,
      userName: matchedUser.name,
      teamId: matchedUser.teamId,
      date: dateInput,
      shiftCode: shiftInput,
      category: catInput as any,
      notes: notesInput,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  return {
    validCount: assignments.length,
    errors,
    assignments,
  };
}

// 7. USER EXCEL TEMPLATE, EXPORT & IMPORT
export function downloadUserTemplate(): void {
  const sample = [
    {
      'NPP': 'PET010',
      'Nama': 'Rian Pratama',
      'Email': 'rian.pratama@instansi.go.id',
      'Jabatan': 'Petugas Layanan',
      'Team': 'team-1',
      'Role': 'PETUGAS',
      'Status': 'Aktif',
      'Password': 'password123',
    },
    {
      'NPP': 'TL003',
      'Nama': 'Hendra Setiawan (TL)',
      'Email': 'hendra.tl@instansi.go.id',
      'Jabatan': 'Team Leader Operasional',
      'Team': 'team-tl',
      'Role': 'TL',
      'Status': 'Aktif',
      'Password': 'password123',
    },
    {
      'NPP': 'QA002',
      'Nama': 'Nurul Hidayah (QA)',
      'Email': 'nurul.qa@instansi.go.id',
      'Jabatan': 'Quality Assurance Officer',
      'Team': 'team-qa',
      'Role': 'QA',
      'Status': 'Aktif',
      'Password': 'password123',
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sample);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_User');
  downloadWorkbook(workbook, 'Template_Import_Pengguna.xlsx');
}

export function exportUsersToExcel(users: User[], filename = 'Data_Pengguna.xlsx'): void {
  const data = users.map((u, idx) => ({
    'No': idx + 1,
    'NPP': u.npp,
    'Nama Lengkap': u.name,
    'Email': u.email,
    'Jabatan': u.jabatan,
    'Team': u.teamId,
    'Role': u.role,
    'Status': u.status,
    'Terdaftar': u.createdAt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pengguna');
  downloadWorkbook(workbook, filename);
}

export async function parseUserExcel(file: File): Promise<{
  validCount: number;
  errors: { row: number; npp: string; message: string }[];
  users: Array<{
    npp: string;
    name: string;
    email: string;
    jabatan: string;
    teamId: string;
    role: any;
    status: any;
    password?: string;
  }>;
}> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet);

  const errors: { row: number; npp: string; message: string }[] = [];
  const parsedUsers: any[] = [];
  const validRoles = new Set([
    'MASTER',
    'PETUGAS',
    'TL',
    'TL 1',
    'TL 2',
    'TL 3',
    'TL 4',
    'TL 5',
    'TL 6',
    'QA',
    'KOORDINATOR',
  ]);
  const validStatuses = new Set(['Aktif', 'Nonaktif']);

  jsonData.forEach((row, idx) => {
    const rowNum = idx + 2;
    const npp = String(row['NPP'] || row['npp'] || '').trim();
    const name = String(row['Nama'] || row['Nama Lengkap'] || row['nama'] || '').trim();
    const email = String(row['Email'] || row['email'] || '').trim();
    const jabatan = String(row['Jabatan'] || row['jabatan'] || 'Petugas Layanan').trim();
    const teamId = String(row['Team'] || row['team'] || row['Tim'] || 'team-1').trim();
    let role = String(row['Role'] || row['role'] || 'PETUGAS').trim().toUpperCase();
    let status = String(row['Status'] || row['status'] || 'Aktif').trim();
    const password = String(row['Password'] || row['password'] || 'password123').trim();

    if (!npp) {
      errors.push({ row: rowNum, npp: '-', message: 'Kolom NPP wajib diisi.' });
      return;
    }
    if (!name) {
      errors.push({ row: rowNum, npp, message: 'Kolom Nama wajib diisi.' });
      return;
    }
    if (!email) {
      errors.push({ row: rowNum, npp, message: 'Kolom Email wajib diisi.' });
      return;
    }

    if (!validRoles.has(role)) {
      role = 'PETUGAS';
    }

    if (!validStatuses.has(status)) {
      status = 'Aktif';
    }

    parsedUsers.push({
      npp,
      name,
      email,
      jabatan,
      teamId,
      role,
      status,
      password: password || 'password123',
    });
  });

  return {
    validCount: parsedUsers.length,
    errors,
    users: parsedUsers,
  };
}
