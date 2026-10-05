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
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
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

    setToasts(prev => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const value = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-20 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none no-print print:hidden">
        {toasts.map(toast => {
          const bgColors: Record<ToastType, string> = {
            success: 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 border border-emerald-500/40',
            error: 'bg-rose-600 text-white shadow-xl shadow-rose-600/20 border border-rose-500/40',
            warning: 'bg-amber-600 text-white shadow-xl shadow-amber-600/20 border border-amber-500/40',
            info: 'bg-sky-600 text-white shadow-xl shadow-sky-600/20 border border-sky-500/40'
          };
          const Icons: Record<ToastType, React.FC<any>> = {
            success: CheckCircle2,
            error: XCircle,
            warning: AlertTriangle,
            info: Info
          };
          const IconComponent = Icons[toast.type] || Info;
          const bgStyle = bgColors[toast.type] || 'bg-sky-600 text-white';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-2xl transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${bgStyle}`}
            >
              <IconComponent className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="flex-1 text-sm">
                <p className="font-bold leading-snug">{toast.title}</p>
                {toast.message && <p className="text-xs opacity-95 mt-1 leading-relaxed">{toast.message}</p>}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
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
  removeToast: () => {}
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return defaultToastContext;
  }
  return context;
};
