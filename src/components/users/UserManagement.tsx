import React, { useState, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { User, RoleType, UserStatus } from '../../types';
import { getRoleBadgeClass } from '../../utils/constants';
import { hashPassword, generateSalt } from '../../utils/crypto';
import { parseUserExcel, downloadUserTemplate, exportUsersToExcel } from '../../services/excel';
import {
  UserPlus, Search, Edit2, Trash2, KeyRound,
  CheckCircle2, XCircle, Eye, ShieldAlert, Users,
  Check, Filter, Shield, Upload, Download, FileSpreadsheet, Camera
} from 'lucide-react';
import { Modal } from '../ui/Modal';

export const UserManagement: React.FC = () => {
  const { currentUser, addToast, refreshData } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formAvatarInputRef = useRef<HTMLInputElement>(null);
  const detailAvatarInputRef = useRef<HTMLInputElement>(null);
  const [users, setUsers] = useState<User[]>(() => storageService.getUsers());
  const [teams, setTeams] = useState(() => storageService.getTeams());
  const [isImporting, setIsImporting] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterTeam, setFilterTeam] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form Fields
  const [formId, setFormId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNpp, setFormNpp] = useState('');
  const [formJabatan, setFormJabatan] = useState('');
  const [formTeamId, setFormTeamId] = useState('team-1');
  const [formRole, setFormRole] = useState<RoleType>('PETUGAS');
  const [formStatus, setFormStatus] = useState<UserStatus>('Aktif');
  const [formAvatarUrl, setFormAvatarUrl] = useState<string>('');
  const [formPassword, setFormPassword] = useState('');
  const [formErrors, setFormErrors] = useState<string>('');

  // Password Reset Field
  const [newPassword, setNewPassword] = useState('password123');

  const reloadUsers = () => {
    const list = storageService.getUsers();
    setUsers(list);
    refreshData();
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>, targetUserId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('File harus berupa gambar (JPG, PNG, WebP).', 'warning');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      addToast('Ukuran gambar maksimal 2MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        if (targetUserId) {
          const user = storageService.getUserById(targetUserId);
          if (user) {
            const updated = { ...user, avatarUrl: base64, updatedAt: new Date().toISOString() };
            storageService.saveUser(updated);
            setSelectedUser(updated);
            reloadUsers();
            addToast(`Foto profil ${user.name} berhasil diperbarui!`, 'success');
          }
        } else {
          setFormAvatarUrl(base64);
          addToast('Foto profil berhasil diunggah untuk akun ini.', 'success');
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveUserAvatar = (userId: string) => {
    const user = storageService.getUserById(userId);
    if (user) {
      const updated = { ...user, avatarUrl: undefined, updatedAt: new Date().toISOString() };
      storageService.saveUser(updated);
      setSelectedUser(updated);
      reloadUsers();
      addToast(`Foto profil ${user.name} telah dihapus.`, 'info');
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.npp.toLowerCase().includes(q) ||
        user.jabatan.toLowerCase().includes(q);

      const matchRole = filterRole === 'ALL' || user.role === filterRole;
      const matchTeam = filterTeam === 'ALL' || user.teamId === filterTeam;
      const matchStatus = filterStatus === 'ALL' || user.status === filterStatus;

      return matchSearch && matchRole && matchTeam && matchStatus;
    });
  }, [users, searchQuery, filterRole, filterTeam, filterStatus]);

  const handleOpenAddModal = () => {
    setFormId(null);
    setFormName('');
    setFormEmail('');
    setFormNpp('');
    setFormJabatan('Administrator Operasional');
    setFormTeamId('team-tl');
    setFormRole('KOORDINATOR');
    setFormStatus('Aktif');
    setFormAvatarUrl('');
    setFormPassword('');
    setFormErrors('');
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setFormId(user.id);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormNpp(user.npp);
    setFormJabatan(user.jabatan);
    setFormTeamId(user.teamId);
    setFormRole(user.role);
    setFormStatus(user.status);
    setFormAvatarUrl(user.avatarUrl || '');
    setFormPassword('');
    setFormErrors('');
    setIsFormModalOpen(true);
  };

  const handleOpenDetailModal = (user: User) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const handleOpenResetPasswordModal = (user: User) => {
    setSelectedUser(user);
    setNewPassword('password123');
    setIsResetPasswordModalOpen(true);
  };

  const handleOpenDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // Save User (Create / Edit)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors('');

    if (!formName.trim() || !formEmail.trim() || !formNpp.trim() || !formJabatan.trim()) {
      setFormErrors('Seluruh field bertanda bintang (*) wajib diisi.');
      return;
    }

    // Check duplicate NPP or Email
    const existingNpp = users.find(u => u.npp.toLowerCase() === formNpp.trim().toLowerCase() && u.id !== formId);
    if (existingNpp) {
      setFormErrors(`NPP "${formNpp}" sudah digunakan oleh ${existingNpp.name}.`);
      return;
    }

    const existingEmail = users.find(u => u.email.toLowerCase() === formEmail.trim().toLowerCase() && u.id !== formId);
    if (existingEmail) {
      setFormErrors(`Email "${formEmail}" sudah digunakan.`);
      return;
    }

    if (!formId && !formPassword) {
      setFormErrors('Password wajib diisi untuk pengguna baru.');
      return;
    }

    if (!formId && formRole === 'PETUGAS') {
      setFormErrors('Aplikasi ini bersifat publik tanpa login user petugas. Penambahan akun baru hanya untuk akun berstatus Administrator (Master, Koordinator, TL, QA).');
      return;
    }

    try {
      if (formId) {
        // Update existing user
        const existing = users.find(u => u.id === formId);
        if (!existing) return;

        let passHash = existing.passwordHash;
        let salt = existing.salt;
        if (formPassword.trim()) {
          salt = generateSalt();
          passHash = await hashPassword(formPassword.trim(), salt);
        }

        const updatedUser: User = {
          ...existing,
          name: formName.trim(),
          email: formEmail.trim(),
          npp: formNpp.trim(),
          jabatan: formJabatan.trim(),
          teamId: formTeamId,
          role: formRole,
          status: formStatus,
          avatarUrl: formAvatarUrl.trim() || undefined,
          passwordHash: passHash,
          salt,
          updatedAt: new Date().toISOString(),
        };

        storageService.saveUser(updatedUser);

        storageService.addAuditLog({
          userId: currentUser?.id || 'admin',
          userName: currentUser?.name || 'Administrator',
          userRole: currentUser?.role || 'KOORDINATOR',
          action: 'Edit Data User',
          module: 'Manajemen User',
          dataBefore: `Nama: ${existing.name}, Role: ${existing.role}, Status: ${existing.status}`,
          dataAfter: `Nama: ${updatedUser.name}, Role: ${updatedUser.role}, Status: ${updatedUser.status}`,
          notes: `Memperbarui profil user ${updatedUser.npp}`,
        });

        addToast(`Data user ${updatedUser.name} berhasil diperbarui!`, 'success');
      } else {
        // Create new user
        const salt = generateSalt();
        const passHash = await hashPassword(formPassword.trim() || 'password123', salt);

        const newUser: User = {
          id: `usr-${Date.now()}`,
          name: formName.trim(),
          email: formEmail.trim(),
          npp: formNpp.trim(),
          jabatan: formJabatan.trim(),
          teamId: formTeamId,
          role: formRole,
          status: formStatus,
          avatarUrl: formAvatarUrl.trim() || undefined,
          passwordHash: passHash,
          salt,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        storageService.saveUser(newUser);

        storageService.addAuditLog({
          userId: currentUser?.id || 'admin',
          userName: currentUser?.name || 'Administrator',
          userRole: currentUser?.role || 'KOORDINATOR',
          action: 'Tambah User Baru',
          module: 'Manajemen User',
          dataAfter: `Nama: ${newUser.name}, NPP: ${newUser.npp}, Role: ${newUser.role}`,
          notes: `Menambahkan user baru ${newUser.name}`,
        });

        addToast(`User baru ${newUser.name} berhasil ditambahkan!`, 'success');
      }

      setIsFormModalOpen(false);
      reloadUsers();
    } catch (err) {
      setFormErrors('Gagal menyimpan data user.');
    }
  };

  // Toggle status (Aktif / Nonaktif)
  const handleToggleStatus = (user: User) => {
    const nextStatus: UserStatus = user.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    const updated = { ...user, status: nextStatus };
    storageService.saveUser(updated);

    storageService.addAuditLog({
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Administrator',
      userRole: currentUser?.role || 'KOORDINATOR',
      action: nextStatus === 'Aktif' ? 'Mengaktifkan User' : 'Menonaktifkan User',
      module: 'Manajemen User',
      dataBefore: `Status: ${user.status}`,
      dataAfter: `Status: ${nextStatus}`,
      notes: `Status ${user.name} (${user.npp}) diubah menjadi ${nextStatus}`,
    });

    addToast(`Status user ${user.name} berhasil diubah menjadi ${nextStatus}.`, 'info');
    reloadUsers();
  };

  // Reset Password
  const handleResetPassword = async () => {
    if (!selectedUser) return;
    if (!newPassword.trim()) {
      addToast('Password baru tidak boleh kosong.', 'error');
      return;
    }

    const salt = generateSalt();
    const hash = await hashPassword(newPassword.trim(), salt);

    const updated: User = {
      ...selectedUser,
      passwordHash: hash,
      salt,
      updatedAt: new Date().toISOString(),
    };

    storageService.saveUser(updated);

    storageService.addAuditLog({
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Administrator',
      userRole: currentUser?.role || 'KOORDINATOR',
      action: 'Reset Password User',
      module: 'Manajemen User',
      notes: `Reset password untuk ${selectedUser.name} (${selectedUser.npp})`,
    });

    addToast(`Password untuk ${selectedUser.name} berhasil direset!`, 'success');
    setIsResetPasswordModalOpen(false);
    reloadUsers();
  };

  // Delete User
  const handleDeleteUser = () => {
    if (!selectedUser) return;

    if (selectedUser.id === currentUser?.id) {
      addToast('Anda tidak dapat menghapus akun Anda sendiri.', 'error');
      return;
    }

    storageService.deleteUser(selectedUser.id);

    storageService.addAuditLog({
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Administrator',
      userRole: currentUser?.role || 'KOORDINATOR',
      action: 'Hapus User',
      module: 'Manajemen User',
      dataBefore: `Nama: ${selectedUser.name}, NPP: ${selectedUser.npp}`,
      notes: `User ${selectedUser.name} dihapus dari sistem`,
    });

    addToast(`User ${selectedUser.name} berhasil dihapus.`, 'success');
    setIsDeleteModalOpen(false);
    reloadUsers();
  };

  // Import Users from Excel
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await parseUserExcel(file);
      if (result.users.length === 0) {
        addToast('Tidak ada data pengguna yang valid di file Excel.', 'error');
        return;
      }

      const currentUsers = storageService.getUsers();
      let addedCount = 0;
      let updatedCount = 0;

      for (const u of result.users) {
        const existingIdx = currentUsers.findIndex(
          curr => curr.npp.toLowerCase() === u.npp.toLowerCase() || curr.email.toLowerCase() === u.email.toLowerCase()
        );

        if (existingIdx >= 0) {
          currentUsers[existingIdx] = {
            ...currentUsers[existingIdx],
            name: u.name,
            jabatan: u.jabatan,
            teamId: u.teamId,
            role: u.role,
            status: u.status,
            updatedAt: new Date().toISOString(),
          };
          updatedCount++;
        } else {
          const salt = generateSalt();
          const passHash = await hashPassword(u.password || 'password123', salt);
          const newUser: User = {
            id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            npp: u.npp,
            name: u.name,
            email: u.email,
            jabatan: u.jabatan,
            teamId: u.teamId || 'team-1',
            role: u.role,
            status: u.status,
            passwordHash: passHash,
            salt,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          currentUsers.push(newUser);
          addedCount++;
        }
      }

      storageService.saveUsers(currentUsers);

      storageService.addAuditLog({
        userId: currentUser?.id || 'admin',
        userName: currentUser?.name || 'Administrator',
        userRole: currentUser?.role || 'KOORDINATOR',
        action: 'Import User Excel',
        module: 'Manajemen User',
        notes: `Berhasil mengimpor user dari Excel (${file.name}): ${addedCount} baru, ${updatedCount} diperbarui`,
      });

      addToast(`Import berhasil: ${addedCount} user baru ditambahkan, ${updatedCount} diperbarui!`, 'success');
      reloadUsers();
    } catch (err: any) {
      addToast(`Gagal mengimpor data user: ${err?.message || 'Format Excel tidak sesuai'}`, 'error');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExportExcel = () => {
    exportUsersToExcel(users, 'Data_Pengguna_Aplikasi.xlsx');
    addToast('Data personil berhasil diekspor ke Excel.', 'success');
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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Manajemen Akses &amp; Personil</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Manajemen User &amp; Hak Akses
          </h2>
          <p className="text-xs text-slate-500">
            Aplikasi bersifat publik tanpa login untuk petugas. Penambahan akun dikhususkan untuk Administrator (Master, Koordinator, TL, QA).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            title="Tambah Akun Administrator / Verifikator Baru"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah User Admin</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold shadow-2xs transition"
            title="Import data user langsung dari file Excel (.xlsx)"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>{isImporting ? 'Mengimpor...' : 'Import Excel'}</span>
          </button>

          <button
            type="button"
            onClick={downloadUserTemplate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition"
            title="Unduh format template Excel untuk data user"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Template Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama, email, NPP, jabatan..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="ALL">Semua Role</option>
              <option value="KOORDINATOR">KOORDINATOR</option>
              <option value="TL 1">TL 1</option>
              <option value="TL 2">TL 2</option>
              <option value="TL 3">TL 3</option>
              <option value="TL 4">TL 4</option>
              <option value="TL 5">TL 5</option>
              <option value="TL 6">TL 6</option>
              <option value="QA">QA</option>
              <option value="PETUGAS">PETUGAS</option>
            </select>
          </div>

          {/* Team Filter */}
          <div>
            <select
              value={filterTeam}
              onChange={e => setFilterTeam(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="ALL">Semua Team</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.type})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="ALL">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">NPP</th>
                <th className="py-3 px-4">Jabatan</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ada data pengguna yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 text-center font-medium text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2.5">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <span>{user.name}</span>
                          {user.id === currentUser?.id && (
                            <span className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold">
                              Anda
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{user.email}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{user.npp}</td>
                    <td className="py-3 px-4">{user.jabatan}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {teams.find(t => t.id === user.teamId)?.name || user.teamId}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          user.status === 'Aktif'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Detail */}
                        <button
                          type="button"
                          onClick={() => handleOpenDetailModal(user)}
                          title="Detail Profil"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(user)}
                          title="Edit User"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {/* Toggle Status */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          title={user.status === 'Aktif' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                          className={`p-1.5 rounded-lg transition ${
                            user.status === 'Aktif'
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {user.status === 'Aktif' ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {/* Reset Password */}
                        <button
                          type="button"
                          onClick={() => handleOpenResetPasswordModal(user)}
                          title="Reset Password"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-slate-100 transition"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        {/* Hapus */}
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(user)}
                          title="Hapus User"
                          disabled={user.id === currentUser?.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah / Edit Administrator */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={formId ? 'Edit Data Administrator' : 'Tambah Akun Administrator Baru'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
          {formErrors && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {formErrors}
            </div>
          )}

          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 text-xs flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <div className="leading-relaxed text-[11px]">
              <strong>Khusus Akun Administrator:</strong> Aplikasi SIMOP Terpadu dapat diakses langsung oleh seluruh personil operasional secara publik tanpa login. Form pendaftaran ini dikhususkan untuk akun berstatus Administrator (Master, Koordinator, Team Leader, QA).
            </div>
          </div>

          {/* Avatar Upload for Account */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3.5">
            <div className="relative group shrink-0">
              {formAvatarUrl ? (
                <img
                  src={formAvatarUrl}
                  alt="Avatar Preview"
                  className="w-14 h-14 rounded-xl object-cover border border-slate-300 shadow-2xs"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-lg border border-indigo-200">
                  {formName ? formName.charAt(0).toUpperCase() : <Camera className="w-5 h-5 text-indigo-400" />}
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block font-semibold text-slate-700 text-xs mb-1">
                Foto Profil Akun
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => formAvatarInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{formAvatarUrl ? 'Ganti Foto' : 'Unggah Foto'}</span>
                </button>
                {formAvatarUrl && (
                  <button
                    type="button"
                    onClick={() => setFormAvatarUrl('')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Format JPG, PNG, atau WebP (Maks 2MB)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Nama lengkap"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                placeholder="nama@instansi.go.id"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">NPP (Nomor Pokok Petugas) *</label>
              <input
                type="text"
                value={formNpp}
                onChange={e => setFormNpp(e.target.value)}
                placeholder="Contoh: PET001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jabatan *</label>
              <input
                type="text"
                value={formJabatan}
                onChange={e => setFormJabatan(e.target.value)}
                placeholder="Administrator / TL / QA"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Role Administrator *</label>
              <select
                value={formRole}
                onChange={e => setFormRole(e.target.value as RoleType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-bold text-slate-800"
              >
                <option value="MASTER">MASTER (Pemilik Sistem / Super Admin)</option>
                <option value="KOORDINATOR">KOORDINATOR (Administrator Utama)</option>
                <option value="TL 1">TL 1 (Team Leader 1 - Admin Shift 1)</option>
                <option value="TL 2">TL 2 (Team Leader 2 - Admin Shift 2)</option>
                <option value="TL 3">TL 3 (Team Leader 3 - Admin Shift 3)</option>
                <option value="TL 4">TL 4 (Team Leader 4 - Admin Shift 4)</option>
                <option value="TL 5">TL 5 (Team Leader 5 - Admin Shift 5)</option>
                <option value="TL 6">TL 6 (Team Leader 6 - Admin Shift 6)</option>
                <option value="QA">QA (Quality Assurance)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Team *</label>
              <select
                value={formTeamId}
                onChange={e => setFormTeamId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Akun *</label>
              <select
                value={formStatus}
                onChange={e => setFormStatus(e.target.value as UserStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {formId ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password Awal *'}
              </label>
              <input
                type="password"
                value={formPassword}
                onChange={e => setFormPassword(e.target.value)}
                placeholder={formId ? 'Kosongkan jika tetap' : 'Minimal 6 karakter'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-sm"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Detail User */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Informasi Pengguna"
        maxWidth="md"
      >
        {selectedUser && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="relative group shrink-0">
                {selectedUser.avatarUrl ? (
                  <img
                    src={selectedUser.avatarUrl}
                    alt={selectedUser.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-300 shadow-xs"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                    {selectedUser.name.charAt(0)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => detailAvatarInputRef.current?.click()}
                  title="Ganti Foto Profil Akun Ini"
                  className="absolute inset-0 bg-slate-900/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition text-[10px] font-bold cursor-pointer"
                >
                  <Camera className="w-4 h-4 mb-0.5" />
                  Ganti
                </button>
              </div>

              <div className="flex-1 min-w-0 text-center sm:text-left">
                <h4 className="font-bold text-slate-800 text-sm truncate">{selectedUser.name}</h4>
                <p className="text-slate-500 text-xs truncate">{selectedUser.email}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRoleBadgeClass(selectedUser.role)}`}>
                    {selectedUser.role}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {selectedUser.status}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => detailAvatarInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{selectedUser.avatarUrl ? 'Ganti Foto' : 'Unggah Foto'}</span>
                  </button>
                  {selectedUser.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => handleRemoveUserAvatar(selectedUser.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">NPP</span>
                <span className="font-mono font-bold text-slate-800">{selectedUser.npp}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Jabatan</span>
                <span className="font-medium text-slate-800">{selectedUser.jabatan}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Penugasan Team</span>
                <span className="font-medium text-slate-800">
                  {teams.find(t => t.id === selectedUser.teamId)?.name || selectedUser.teamId}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Keamanan Kredensial</span>
                <span className="font-medium text-emerald-700">Tersandi (SHA-256 + Salt)</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Dibuat Pada</span>
                <span className="text-slate-600">{new Date(selectedUser.createdAt).toLocaleString('id-ID')}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Terakhir Diperbarui</span>
                <span className="text-slate-600">{new Date(selectedUser.updatedAt).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Reset Password */}
      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title="Reset Password Akun"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Anda akan mengatur ulang password untuk pengguna:{' '}
            <strong className="text-slate-800">{selectedUser?.name}</strong> (NPP: {selectedUser?.npp}).
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password Baru</label>
            <input
              type="text"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsResetPasswordModalOpen(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleResetPassword}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-sm"
            >
              Konfirmasi Reset
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Hapus User */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Pengguna"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Apakah Anda yakin ingin menghapus akun{' '}
            <strong className="text-slate-800">{selectedUser?.name}</strong> ({selectedUser?.npp})?
            Tindakan ini tidak dapat dibatalkan.
          </p>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDeleteUser}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-sm"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </Modal>

      {/* Hidden file input for Add/Edit Form avatar */}
      <input
        type="file"
        ref={formAvatarInputRef}
        onChange={e => handleAvatarFile(e)}
        accept="image/*"
        className="hidden"
      />

      {/* Hidden file input for Detail Modal avatar */}
      <input
        type="file"
        ref={detailAvatarInputRef}
        onChange={e => handleAvatarFile(e, selectedUser?.id)}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};
