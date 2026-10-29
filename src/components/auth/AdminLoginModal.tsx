import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { KeyRound, ShieldCheck, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { SimopLogo } from '../ui/SimopLogo';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('230297');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Silakan masukkan NPP atau Email Administrator.');
      return;
    }
    if (!password) {
      setErrorMessage('Silakan masukkan kata sandi Administrator.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(identifier, password, true);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Autentikasi Administrator gagal.');
    } else {
      setPassword('');
      onClose();
      if (onSuccess) onSuccess();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Akses Mode Administrator"
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {/* Header Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center gap-3.5 border border-indigo-500/30 shadow-md">
          <div className="p-2.5 rounded-xl bg-indigo-600/30 border border-indigo-400/30 shrink-0">
            <KeyRound className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
              <span>Autentikasi Administrator</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Masukkan kredensial administrator untuk mendapatkan hak akses mengubah jadwal, verifikasi persetujuan, dan konfigurasi sistem.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              NPP atau Email Administrator *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="NPP: 230297"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Kata Sandi Administrator *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi admin"
                className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              Batal (Tetap Mode Publik)
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk Sebagai Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
