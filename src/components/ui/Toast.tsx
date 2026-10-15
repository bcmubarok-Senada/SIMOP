import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAuth();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map(toast => {
        let bg = 'bg-slate-900 text-white';
        let Icon = Info;
        let iconColor = 'text-blue-400';

        if (toast.type === 'success') {
          bg = 'bg-emerald-900/95 text-white border border-emerald-700/50 shadow-emerald-950/20';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-400';
        } else if (toast.type === 'error') {
          bg = 'bg-rose-900/95 text-white border border-rose-700/50 shadow-rose-950/20';
          Icon = AlertCircle;
          iconColor = 'text-rose-400';
        } else if (toast.type === 'warning') {
          bg = 'bg-amber-900/95 text-white border border-amber-700/50 shadow-amber-950/20';
          Icon = AlertTriangle;
          iconColor = 'text-amber-400';
        } else {
          bg = 'bg-slate-900/95 text-white border border-slate-700/50 shadow-slate-950/20';
          Icon = Info;
          iconColor = 'text-blue-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg backdrop-blur transition-all duration-300 transform translate-y-0 ${bg}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-sm font-medium leading-snug">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
