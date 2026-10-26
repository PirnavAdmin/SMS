// @refresh reset
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  addToast: (typeOrTitle: any, titleOrMessage?: any, message?: string) => void;
  removeToast: (id: string) => void;
  clearToasts?: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = useCallback((arg1: any, arg2?: any, arg3?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    let type: ToastType = 'info';
    let title = '';
    let message = arg3;

    const validTypes: ToastType[] = ['success', 'error', 'warning', 'info'];

    if (validTypes.includes(arg1 as ToastType)) {
      type = arg1 as ToastType;
      title = String(arg2 || '');
    } else if (validTypes.includes(arg2 as ToastType)) {
      type = arg2 as ToastType;
      title = String(arg1 || '');
    } else {
      title = String(arg1 || '');
      message = arg2 ? String(arg2) : undefined;
    }

    if (message && message.trim().toLowerCase() === title.trim().toLowerCase()) {
      message = undefined;
    }

    setToasts(prev => {
      // Remove any existing success toasts so multiple success banners never display simultaneously
      const filtered = type === 'success' ? prev.filter(t => t.type !== 'success') : prev;
      return [...filtered, { id, type, title, message }];
    });

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const value = useMemo(() => ({ addToast, removeToast, clearToasts }), [addToast, removeToast, clearToasts]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-5 right-5 sm:top-6 sm:right-6 z-[99999] flex flex-col gap-2 max-w-[340px] sm:max-w-sm w-full pointer-events-none no-print print:hidden">
        {toasts.map(toast => {
          const bgColors: Record<ToastType, string> = {
            success: 'bg-emerald-600 text-white shadow-2xl shadow-emerald-600/30 border border-emerald-400/50',
            error: 'bg-rose-600 text-white shadow-2xl shadow-rose-600/30 border border-rose-400/50',
            warning: 'bg-amber-600 text-white shadow-2xl shadow-amber-600/30 border border-amber-400/50',
            info: 'bg-sky-600 text-white shadow-2xl shadow-sky-600/30 border border-sky-400/50'
          };
          const Icons: Record<ToastType, React.FC<any>> = {
            success: CheckCircle2,
            error: XCircle,
            warning: AlertTriangle,
            info: Info
          };
          const IconComponent = Icons[toast.type] || Info;
          const bgStyle = bgColors[toast.type] || 'bg-emerald-600 text-white';
          const isSuccess = toast.type === 'success';

          return (
            <div
              key={toast.id}
              style={isSuccess ? { backgroundColor: '#059669', color: '#ffffff' } : undefined}
              className={`pointer-events-auto flex items-start gap-2.5 p-3 sm:p-3.5 rounded-2xl shadow-xl transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${bgStyle}`}
            >
              <div className="p-1 rounded-xl bg-white/20 shrink-0 text-white mt-0.5">
                <IconComponent className="w-4 h-4 text-white stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0 text-xs text-white">
                <p className="font-bold leading-tight text-white">{toast.title}</p>
                {toast.message && <p className="text-[11px] text-white/95 mt-0.5 leading-snug">{toast.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 text-white hover:bg-white/25 rounded-lg transition-colors cursor-pointer -mr-1 -mt-1"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

const defaultToastContext: ToastContextType = {
  addToast: (typeOrTitle: any, titleOrMessage?: any, message?: string) => {
    console.debug('[Toast Notice]', typeOrTitle, titleOrMessage, message);
  },
  removeToast: () => {},
  clearToasts: () => {}
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return defaultToastContext;
  }
  return context;
};
