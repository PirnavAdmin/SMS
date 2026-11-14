import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' | 'yellow' | 'inactive';
  size?: 'sm' | 'md';
  className?: string;
  showDot?: boolean;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  showDot,
  dot,
}) => {
  let resolvedVariant = variant;
  if (typeof children === 'string') {
    const text = children.trim().toLowerCase();
    if (text === 'active' || text === 'running' || text === 'enabled' || text === 'approved' || text === 'paid') {
      if (!variant || variant === 'neutral' || variant === 'info') {
        resolvedVariant = 'success';
      }
    } else if (text === 'inactive' || text === 'disabled' || text === 'deleted' || text === 'unpaid' || text === 'rejected') {
      if (!variant || variant === 'neutral' || variant === 'success') {
        resolvedVariant = 'danger';
      }
    }
  }

  const variantStyles = {
    success: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 shadow-emerald-500/10',
    warning: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25 shadow-amber-500/10',
    yellow: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25 shadow-amber-500/10',
    danger: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/25 shadow-rose-500/10',
    inactive: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/25 shadow-rose-500/10',
    info: 'bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/25 shadow-sky-500/10',
    neutral: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20 shadow-slate-500/10',
    purple: 'bg-purple-500/12 text-purple-700 dark:text-purple-300 border-purple-500/25 shadow-purple-500/10',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] font-bold',
    md: 'px-2.5 py-1 text-xs font-bold',
  };

  const isDotExplicit = dot !== undefined ? dot : showDot;
  const shouldShowDot = isDotExplicit !== undefined ? isDotExplicit : true;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-md shadow-2xs transition-all ${
        variantStyles[resolvedVariant as keyof typeof variantStyles] || variantStyles.neutral
      } ${sizeStyles[size]} ${className}`}
    >
      {shouldShowDot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
};

export default Badge;
