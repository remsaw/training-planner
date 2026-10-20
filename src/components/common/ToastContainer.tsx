import React from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = usePlanner();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const getStyle = () => {
          switch (toast.type) {
            case 'success':
              return {
                bg: 'bg-white border-emerald-300 text-emerald-950',
                icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
                bar: 'bg-emerald-600',
              };
            case 'error':
              return {
                bg: 'bg-white border-rose-300 text-rose-950',
                icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
                bar: 'bg-rose-600',
              };
            case 'warning':
              return {
                bg: 'bg-white border-amber-300 text-amber-950',
                icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
                bar: 'bg-amber-500',
              };
            case 'info':
            default:
              return {
                bg: 'bg-white border-blue-300 text-blue-950',
                icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
                bar: 'bg-blue-600',
              };
          }
        };

        const s = getStyle();

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-3 ${s.bg}`}
          >
            {s.icon}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm leading-tight text-gray-900">{toast.title}</div>
              <div className="text-xs text-gray-600 mt-0.5 leading-relaxed break-words">{toast.message}</div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-gray-400 hover:text-gray-700 p-1 -mr-1 -mt-1 rounded-lg transition-colors cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
