import { ShiftMeta, Team, RoleType } from '../types';

export const DEFAULT_SHIFT_DEFINITIONS: Record<string, ShiftMeta> = {
  P1: {
    code: 'P1',
    name: 'Pagi 1 (06.00 - 15.00)',
    category: 'Shift',
    colorBg: 'bg-[#00FFFF]',
    colorText: 'text-slate-900',
    colorBorder: 'border-[#00e0e0]',
    hexBg: '#00FFFF',
    hexText: '#0f172a',
    startTime: '06:00',
    endTime: '15:00',
    isSystemDefault: true,
  },
  P2: {
    code: 'P2',
    name: 'Pagi 2 (08.00 - 17.00)',
    category: 'Shift',
    colorBg: 'bg-[#F0FFFF]',
    colorText: 'text-slate-900',
    colorBorder: 'border-[#c5e6e6]',
    hexBg: '#F0FFFF',
    hexText: '#0f172a',
    startTime: '08:00',
    endTime: '17:00',
    isSystemDefault: true,
  },
  P3: {
    code: 'P3',
    name: 'Siang 1 (11.00 - 20.00)',
    category: 'Shift',
    colorBg: 'bg-[#DEB887]',
    colorText: 'text-stone-900',
    colorBorder: 'border-[#c49b67]',
    hexBg: '#DEB887',
    hexText: '#1c1917',
    startTime: '11:00',
    endTime: '20:00',
    isSystemDefault: true,
  },
  P4: {
    code: 'P4',
    name: 'Siang 2 (13.00 - 22.00)',
    category: 'Shift',
    colorBg: 'bg-[#FF7F50]',
    colorText: 'text-white',
    colorBorder: 'border-[#e06638]',
    hexBg: '#FF7F50',
    hexText: '#ffffff',
    startTime: '13:00',
    endTime: '22:00',
    isSystemDefault: true,
  },
  P5: {
    code: 'P5',
    name: 'Malam (22.00 - 06.00)',
    category: 'Shift',
    colorBg: 'bg-[#8A2BE2]',
    colorText: 'text-white',
    colorBorder: 'border-[#731ec5]',
    hexBg: '#8A2BE2',
    hexText: '#ffffff',
    startTime: '22:00',
    endTime: '06:00',
    isSystemDefault: true,
  },
  // WFA
  P1A: {
    code: 'P1A',
    name: 'WFA P1 (06.00 - 15.00)',
    category: 'WFA',
    colorBg: 'bg-cyan-100',
    colorText: 'text-cyan-900',
    colorBorder: 'border-cyan-300',
    hexBg: '#cffafe',
    hexText: '#164e63',
    startTime: '06:00',
    endTime: '15:00',
    isSystemDefault: true,
  },
  P2A: {
    code: 'P2A',
    name: 'WFA P2 (08.00 - 17.00)',
    category: 'WFA',
    colorBg: 'bg-sky-100',
    colorText: 'text-sky-900',
    colorBorder: 'border-sky-300',
    hexBg: '#e0f2fe',
    hexText: '#0c4a6e',
    startTime: '08:00',
    endTime: '17:00',
    isSystemDefault: true,
  },
  P3A: {
    code: 'P3A',
    name: 'WFA P3 (11.00 - 20.00)',
    category: 'WFA',
    colorBg: 'bg-amber-50',
    colorText: 'text-amber-900',
    colorBorder: 'border-amber-200',
    hexBg: '#fffbeb',
    hexText: '#78350f',
    startTime: '11:00',
    endTime: '20:00',
    isSystemDefault: true,
  },
  P4A: {
    code: 'P4A',
    name: 'WFA P4 (13.00 - 22.00)',
    category: 'WFA',
    colorBg: 'bg-orange-100',
    colorText: 'text-orange-900',
    colorBorder: 'border-orange-300',
    hexBg: '#ffedd5',
    hexText: '#7c2d12',
    startTime: '13:00',
    endTime: '22:00',
    isSystemDefault: true,
  },
  // Status
  X: {
    code: 'X',
    name: 'Libur',
    category: 'Status',
    colorBg: 'bg-slate-200',
    colorText: 'text-slate-700',
    colorBorder: 'border-slate-300',
    hexBg: '#e2e8f0',
    hexText: '#334155',
    isSystemDefault: true,
  },
  C: {
    code: 'C',
    name: 'Cuti',
    category: 'Status',
    colorBg: 'bg-[#A9A9A9]',
    colorText: 'text-white',
    colorBorder: 'border-[#919191]',
    hexBg: '#A9A9A9',
    hexText: '#ffffff',
    isSystemDefault: true,
  },
  I: {
    code: 'I',
    name: 'Izin',
    category: 'Status',
    colorBg: 'bg-[#DCDCDC]',
    colorText: 'text-slate-800',
    colorBorder: 'border-[#bfbfbf]',
    hexBg: '#DCDCDC',
    hexText: '#1e293b',
    isSystemDefault: true,
  },
  S: {
    code: 'S',
    name: 'Sakit',
    category: 'Status',
    colorBg: 'bg-[#DC143C]',
    colorText: 'text-white',
    colorBorder: 'border-[#b80e30]',
    hexBg: '#DC143C',
    hexText: '#ffffff',
    isSystemDefault: true,
  },
  M: {
    code: 'M',
    name: 'Monev',
    category: 'Status',
    colorBg: 'bg-[#228B22]',
    colorText: 'text-white',
    colorBorder: 'border-[#1a6e1a]',
    hexBg: '#228B22',
    hexText: '#ffffff',
    isSystemDefault: true,
  },
  K: {
    code: 'K',
    name: 'Kegiatan',
    category: 'Status',
    colorBg: 'bg-fuchsia-100',
    colorText: 'text-fuchsia-800',
    colorBorder: 'border-fuchsia-300',
    hexBg: '#fae8ff',
    hexText: '#86198f',
    isSystemDefault: true,
  },
};

export const SHIFT_DEFINITIONS = DEFAULT_SHIFT_DEFINITIONS;

export const SENADA_CATEGORIES = [
  {
    code: 'PM' as const,
    name: 'Permintaan dan Informasi',
    description: 'Menangani kebutuhan permohonan data dan info teknis.',
    colorBg: 'bg-emerald-500',
    colorBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    code: 'IP' as const,
    name: 'Informasi dan Pengaduan',
    description: 'Menangani aduan pelayanan dan pengusutan keluhan.',
    colorBg: 'bg-blue-500',
    colorBadge: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    code: 'IM' as const,
    name: 'Informasi Permintaan',
    description: 'Menangani informasi umum tindak lanjut permohonan.',
    colorBg: 'bg-amber-500',
    colorBadge: 'bg-amber-100 text-amber-800 border-amber-300',
  },
];

export const DEFAULT_TEAMS: Team[] = [
  { id: 'team-1', name: 'Team 1', type: 'PETUGAS', description: 'Tim Operasional Petugas 1' },
  { id: 'team-2', name: 'Team 2', type: 'PETUGAS', description: 'Tim Operasional Petugas 2' },
  { id: 'team-3', name: 'Team 3', type: 'PETUGAS', description: 'Tim Operasional Petugas 3' },
  { id: 'team-4', name: 'Team 4', type: 'PETUGAS', description: 'Tim Operasional Petugas 4' },
  { id: 'team-5', name: 'Team 5', type: 'PETUGAS', description: 'Tim Operasional Petugas 5' },
  { id: 'team-6', name: 'Team 6', type: 'PETUGAS', description: 'Tim Operasional Petugas 6' },
  { id: 'team-tl', name: 'Team Team Leader', type: 'TL', description: 'Grup Team Leader' },
  { id: 'team-qa', name: 'Team Quality Assurance', type: 'QA', description: 'Grup Quality Assurance' },
];

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const DAY_NAMES_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const TL_ROLES = ['TL 1', 'TL 2', 'TL 3', 'TL 4', 'TL 5', 'TL 6'] as const;

export const ALL_ROLES: RoleType[] = [
  'MASTER',
  'KOORDINATOR',
  'TL 1',
  'TL 2',
  'TL 3',
  'TL 4',
  'TL 5',
  'TL 6',
  'QA',
  'PETUGAS',
];

export function isMasterRole(role: RoleType | string): boolean {
  if (!role) return false;
  return role === 'MASTER';
}

export function isTLRole(role: RoleType | string): boolean {
  if (!role) return false;
  return role === 'TL' || role.startsWith('TL');
}

export function isAdminRole(role: RoleType | string): boolean {
  if (!role) return false;
  return role === 'MASTER' || role === 'KOORDINATOR' || isTLRole(role);
}

export function getRoleBadgeClass(role: RoleType | string): string {
  switch (role) {
    case 'MASTER':
      return 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 border border-amber-400 font-extrabold shadow-2xs';
    case 'KOORDINATOR':
      return 'bg-purple-100 text-purple-800 border border-purple-300';
    case 'TL 1':
      return 'bg-blue-100 text-blue-800 border border-blue-300';
    case 'TL 2':
      return 'bg-indigo-100 text-indigo-800 border border-indigo-300';
    case 'TL 3':
      return 'bg-cyan-100 text-cyan-800 border border-cyan-300';
    case 'TL 4':
      return 'bg-sky-100 text-sky-800 border border-sky-300';
    case 'TL 5':
      return 'bg-violet-100 text-violet-800 border border-violet-300';
    case 'TL 6':
      return 'bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-300';
    case 'TL':
      return 'bg-blue-100 text-blue-800 border border-blue-300';
    case 'QA':
      return 'bg-teal-100 text-teal-800 border border-teal-300';
    case 'PETUGAS':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    default:
      if (typeof role === 'string' && role.startsWith('TL')) {
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      }
      return 'bg-gray-100 text-gray-800 border border-gray-300';
  }
}
