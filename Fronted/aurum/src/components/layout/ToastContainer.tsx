'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useAurumStore, Toast } from '@/store/useStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAurumStore();

  if (toasts.length === 0) return null;

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-indigo-600 shrink-0" />;
    }
  };

  const getStyle = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50/90 text-emerald-900';
      case 'warning':
        return 'border-amber-200 bg-amber-50/90 text-amber-900';
      case 'error':
        return 'border-rose-200 bg-rose-50/90 text-rose-900';
      default:
        return 'border-indigo-200 bg-indigo-50/90 text-indigo-900';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-xs transition-all duration-200 ${getStyle(
            toast.type
          )}`}
        >
          <div className="flex items-start gap-2.5">
            {getIcon(toast.type)}
            <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-0.5 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
