import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, UserCheck, X, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  message?: React.ReactNode;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success' | 'primary';
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  subtitle,
  message,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  icon,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const variantBtn = {
    danger:
      'bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-600 text-white shadow-lg shadow-rose-500/25 border border-white/20',
    warning:
      'bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-600 text-white shadow-lg shadow-amber-500/25 border border-white/20',
    info:
      'bg-gradient-to-b from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-600 text-white shadow-lg shadow-sky-500/25 border border-white/20',
    primary: 'btn-glass-primary',
    success:
      'bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/25 border border-white/20',
  };

  const getVariantIcon = () => {
    if (icon) return icon;
    switch (variant) {
      case 'success':
        return <UserCheck className="w-6 h-6 stroke-[2.2]" />;
      case 'primary':
      case 'info':
        return <Info className="w-6 h-6 stroke-[2.2]" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 stroke-[2.2]" />;
      case 'danger':
      default:
        return <AlertTriangle className="w-6 h-6 stroke-[2.2]" />;
    }
  };

  const getIconWrapperClass = () => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'primary':
      case 'info':
        return 'bg-sky-500/12 text-sky-600 dark:text-sky-400 border border-sky-500/20';
      case 'warning':
        return 'bg-amber-500/12 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'danger':
      default:
        return 'bg-rose-500/12 text-rose-600 dark:text-rose-400 border border-rose-500/20';
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in"
      onClick={onCancel}
    >
      <div
        className="glass-surface rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl backdrop-blur-md shadow-xs ${getIconWrapperClass()}`}
            >
              {getVariantIcon()}
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-8 h-8 rounded-full btn-glass-secondary flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-4 h-4 shrink-0 stroke-[2.2]" />
          </button>
        </div>

        {message && (
          typeof message === 'string' ? (
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {message}
            </p>
          ) : (
            <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {message}
            </div>
          )
        )}
        {children}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-5 py-2.5 text-xs font-bold rounded-2xl btn-glass-secondary cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 text-xs font-extrabold rounded-2xl transition-all cursor-pointer flex items-center gap-2 ${variantBtn[variant]} disabled:opacity-75`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default ConfirmModal;
