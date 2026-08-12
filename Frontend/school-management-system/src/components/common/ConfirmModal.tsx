import React from 'react';
import { AlertTriangle, CheckCircle2, Info, UserCheck, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success' | 'primary';
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  subtitle,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  icon,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const variantBtn = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/25',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/25',
    info: 'bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-500/25',
    primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/25',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/25'
  };

  const getVariantIcon = () => {
    if (icon) return icon;
    switch (variant) {
      case 'success':
        return <UserCheck className="w-6 h-6" />;
      case 'primary':
      case 'info':
        return <Info className="w-6 h-6" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6" />;
      case 'danger':
      default:
        return <AlertTriangle className="w-6 h-6" />;
    }
  };

  const getIconWrapperClass = () => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400';
      case 'primary':
      case 'info':
        return 'bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400';
      case 'warning':
        return 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400';
      case 'danger':
      default:
        return 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400';
    }
  };

  const defaultSubtitle = {
    danger: 'Please review this action carefully',
    warning: 'Attention required',
    info: 'Action Confirmation',
    primary: 'Action Confirmation',
    success: 'Ready to proceed'
  }[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${getIconWrapperClass()}`}>
              {getVariantIcon()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle || defaultSubtitle}
              </p>
            </div>
          </div>
          <button 
            onClick={onCancel} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200/80 dark:border-slate-700 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${variantBtn[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

