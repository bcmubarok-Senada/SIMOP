import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getRoleBadgeClass, isAdminRole } from '../../utils/constants';
import {
  Bell, LogOut, User as UserIcon, CheckCheck,
  Menu, Camera, Trash2, Upload
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { SimopLogo } from '../ui/SimopLogo';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const {
    currentUser,
    logout,
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    updateUserProfile,
    addToast,
  } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        updateUserProfile({ avatarUrl: base64 });
        addToast('Foto profil berhasil diperbarui!', 'success');
      }
    };
    reader.readAsDataURL(file);
    // Reset file input value so same file can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAvatar = () => {
    updateUserProfile({ avatarUrl: undefined });
    addToast('Foto profil dihapus.', 'info');
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between shadow-xs">
        {/* Left: Mobile Sidebar Trigger + System Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <SimopLogo size="sm" variant="mark-only" className="w-8 h-8 lg:hidden shrink-0" />
            <div className="hidden sm:block">
              <h1 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                <span>SIMOP TERPADU</span>
                <span className="text-slate-300 font-normal">|</span>
                <span className="text-xs font-semibold text-slate-600">Sistem Operasional Petugas</span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                {currentUser.role === 'MASTER'
                  ? '👑 Hak Akses: Pemilik Sistem (Master Owner)'
                  : isAdminRole(currentUser.role)
                  ? 'Mode Akses: Administrator'
                  : 'Mode Akses: Pengguna Layanan'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Notifications, User Profile & Logout */}
        <div className="flex items-center gap-2 md:gap-3">

          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Notifikasi</h4>
                    <p className="text-[11px] text-slate-400">{unreadNotificationCount} belum dibaca</p>
                  </div>
                  {unreadNotificationCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Baca Semua</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Tidak ada notifikasi saat ini
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationAsRead(notif.id)}
                        className={`p-3.5 text-xs hover:bg-slate-50 transition cursor-pointer flex gap-3 ${
                          !notif.read ? 'bg-indigo-50/40 font-medium' : 'text-slate-600'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            !notif.read ? 'bg-indigo-600' : 'bg-transparent'
                          }`}
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800 text-xs">{notif.title}</div>
                          <div className="text-slate-600 mt-0.5 leading-relaxed">{notif.message}</div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {new Date(notif.createdAt || Date.now()).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* User Profile Pill */}
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover shadow-xs border border-indigo-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div className="text-left hidden md:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser.name}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${getRoleBadgeClass(currentUser.role)}`}>
                  {currentUser.role}
                </span>
                <span className="text-[10px] text-slate-400">NPP: {currentUser.npp}</span>
              </div>
            </div>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={logout}
            title="Keluar / Logout"
            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* User Profile Details Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Profil Pengguna & Foto"
        maxWidth="md"
      >
        <div className="space-y-4 text-sm">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
            <div className="relative group shrink-0">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-300 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md shadow-indigo-600/20">
                  {currentUser.name.charAt(0)}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Ganti Foto Profil"
                className="absolute inset-0 bg-slate-900/50 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer"
              >
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-semibold">Ganti Foto</span>
              </button>
            </div>

            <div className="text-center sm:text-left flex-1 min-w-0">
              <h4 className="font-bold text-slate-800 text-base truncate">{currentUser.name}</h4>
              <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${getRoleBadgeClass(currentUser.role)}`}>
                  {currentUser.role}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                  {currentUser.status}
                </span>
              </div>

              {/* Foto Profil Action Buttons */}
              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {currentUser.avatarUrl ? 'Ganti Foto' : 'Unggah Foto'}
                </button>
                {currentUser.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium rounded-xl transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Foto
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                NPP
              </span>
              <span className="font-medium text-slate-800">{currentUser.npp}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Jabatan
              </span>
              <span className="font-medium text-slate-800">{currentUser.jabatan}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Team
              </span>
              <span className="font-medium text-slate-800">{currentUser.teamId}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Tingkat Wewenang
              </span>
              <span className="font-medium text-slate-800">
                {isAdminRole(currentUser.role) ? 'Hak Akses Penuh (Admin)' : 'Hak Akses Pengguna'}
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setShowProfileModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
