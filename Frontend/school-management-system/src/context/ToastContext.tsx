// @refresh reset
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X, Trash2 } from 'lucide-react';

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

    const isDeleteOrRemove = (
      title.toLowerCase().includes('delete') ||
      title.toLowerCase().includes('remov') ||
      (message && (message.toLowerCase().includes('deleted') || message.toLowerCase().includes('removed')))
    ) && type !== 'warning';

    if (isDeleteOrRemove && (type === 'info' || type === 'success')) {
      type = 'error';
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
      <div className="fixed top-5 right-5 sm:top-6 sm:right-6 z-[99999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none no-print print:hidden">
        {toasts.map(toast => {
          const typeConfigs: Record<ToastType, {
            container: string;
            iconBg: string;
            iconColor: string;
            titleColor: string;
            messageColor: string;
            closeBtn: string;
          }> = {
            success: {
              container: 'bg-emerald-50/95 dark:bg-emerald-955/40 border border-emerald-300/90 dark:border-emerald-800/80 shadow-xl shadow-emerald-500/10 text-emerald-950 dark:text-emerald-100',
              iconBg: 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25',
              iconColor: 'text-white',
              titleColor: 'text-emerald-950 dark:text-emerald-100',
              messageColor: 'text-emerald-800 dark:text-emerald-300',
              closeBtn: 'text-emerald-700 hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-200 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40'
            },
            error: {
              container: 'bg-rose-50/95 dark:bg-rose-955/40 border border-rose-300/90 dark:border-rose-800/80 shadow-xl shadow-rose-500/10 text-rose-950 dark:text-rose-100',
              iconBg: 'bg-rose-500 text-white shadow-sm shadow-rose-500/25',
              iconColor: 'text-white',
              titleColor: 'text-rose-950 dark:text-rose-100',
              messageColor: 'text-rose-800 dark:text-rose-300',
              closeBtn: 'text-rose-700 hover:text-rose-950 dark:text-rose-400 dark:hover:text-rose-200 hover:bg-rose-100/80 dark:hover:bg-rose-900/40'
            },
            warning: {
              container: 'bg-amber-50/95 dark:bg-amber-955/40 border border-amber-300/90 dark:border-amber-800/80 shadow-xl shadow-amber-500/10 text-amber-950 dark:text-amber-100',
              iconBg: 'bg-amber-500 text-white shadow-sm shadow-amber-500/25',
              iconColor: 'text-white',
              titleColor: 'text-amber-950 dark:text-amber-100',
              messageColor: 'text-amber-800 dark:text-amber-300',
              closeBtn: 'text-amber-700 hover:text-amber-950 dark:text-amber-400 dark:hover:text-amber-200 hover:bg-amber-100/80 dark:hover:bg-amber-900/40'
            },
            info: {
              container: 'bg-sky-50/95 dark:bg-sky-955/40 border border-sky-300/90 dark:border-sky-800/80 shadow-xl shadow-sky-500/10 text-sky-950 dark:text-sky-100',
              iconBg: 'bg-brand-500 text-white shadow-sm shadow-brand-500/25',
              iconColor: 'text-white',
              titleColor: 'text-sky-950 dark:text-sky-100',
              messageColor: 'text-sky-800 dark:text-sky-300',
              closeBtn: 'text-sky-700 hover:text-sky-950 dark:text-sky-400 dark:hover:text-sky-200 hover:bg-sky-100/80 dark:hover:bg-sky-900/40'
            }
          };

          const Icons: Record<ToastType, React.FC<any>> = {
            success: CheckCircle2,
            error: XCircle,
            warning: AlertTriangle,
            info: Info
          };

          const cfg = typeConfigs[toast.type] || typeConfigs.info;
          const isToastDelete = (
            toast.title.toLowerCase().includes('delete') ||
            toast.title.toLowerCase().includes('remov') ||
            Boolean(toast.message && (toast.message.toLowerCase().includes('deleted') || toast.message.toLowerCase().includes('removed')))
          );
          const IconComponent = (toast.type === 'error' && isToastDelete) ? Trash2 : (Icons[toast.type] || Info);

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-2.5 p-3 sm:p-3.5 rounded-2xl shadow-xl transition-all duration-300 animate-in slide-in-from-top-4 fade-in backdrop-blur-md ${cfg.container}`}
            >
              <div className={`p-1.5 rounded-xl shrink-0 ${cfg.iconBg}`}>
                <IconComponent className={`w-4 h-4 stroke-[2.5] ${cfg.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <p className={`font-bold leading-snug ${cfg.titleColor}`}>{toast.title}</p>
                {toast.message && (
                  <p className={`text-[11px] mt-0.5 leading-snug ${cfg.messageColor}`}>{toast.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className={`shrink-0 p-1 rounded-lg transition-colors cursor-pointer -mr-1 -mt-1 ${cfg.closeBtn}`}
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
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
