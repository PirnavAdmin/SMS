import React, { useRef } from 'react';
import { CalendarDays } from 'lucide-react';

export function formatDateDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '—';
  const clean = dateStr.trim();
  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
      } else if (parts[2].length === 4) {
        return clean;
      }
    }
  } else if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        return clean;
      }
    }
  }
  return clean;
}

export function DatePickerInput({
  value,
  onChange,
  className = ''
}: {
  value: string;
  onChange: (newDateStr: string) => void;
  className?: string;
}) {
  const hiddenNativeRef = useRef<HTMLInputElement>(null);
  const displayVal = formatDateDDMMYYYY(value);

  let isoVal = value;
  if (value && value.includes('-')) {
    const parts = value.split('-');
    if (parts[0].length === 2 && parts[2].length === 4) {
      isoVal = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  return (
    <div className="relative flex items-center w-full">
      <input
        type="text"
        value={displayVal}
        placeholder="DD-MM-YYYY"
        onChange={e => onChange(e.target.value)}
        className={`${className} pr-7 font-mono w-full`}
      />
      <button
        type="button"
        onClick={() => {
          if (hiddenNativeRef.current) {
            if (typeof hiddenNativeRef.current.showPicker === 'function') {
              hiddenNativeRef.current.showPicker();
            } else {
              hiddenNativeRef.current.click();
            }
          }
        }}
        className="absolute right-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition p-0.5"
        title="Calendar Date Picker"
      >
        <CalendarDays className="w-3.5 h-3.5" />
      </button>
      <input
        ref={hiddenNativeRef}
        type="date"
        value={isoVal}
        onChange={e => onChange(e.target.value)}
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
      />
    </div>
  );
}

interface PanelProps {
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  description?: string;
}

export function Panel({ title, action, className = '', children, description }: PanelProps) {
  const panelClass = 'rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';
  return (
    <section className={`${panelClass} ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-slate-800 print:hidden">
        <div>
          <h2 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">{title}</h2>
          {description && <p className="text-xs text-slate-500 font-medium mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
