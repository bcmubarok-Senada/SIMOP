import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAuth();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        let bgClass = 'bg-slate-900 text-white border-slate-800';
        let Icon = Info;

        if (toast.type === 'success') {
          bgClass = 'bg-emerald-600 text-white border-emerald-500';
          Icon = CheckCircle2;
        } else if (toast.type === 'error') {
          bgClass = 'bg-rose-600 text-white border-rose-500';
          Icon = AlertCircle;
        } else if (toast.type === 'warning') {
          bgClass = 'bg-amber-600 text-white border-amber-500';
          Icon = AlertTriangle;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-2xl shadow-lg border text-xs font-medium transition-all transform animate-in slide-in-from-bottom-2 ${bgClass}`}
          >
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">{toast.message}</div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg hover:bg-white/20 transition shrink-0"
              aria-label="Tutup"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
